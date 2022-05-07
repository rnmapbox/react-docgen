import { namedTypes as t, visit } from 'ast-types';
import getMemberValuePath from '../utils/getMemberValuePath';
import getMethodDocumentation from '../utils/getMethodDocumentation';
import isReactBuiltinCall from '../utils/isReactBuiltinCall';
import isReactComponentClass from '../utils/isReactComponentClass';
import isReactComponentMethod from '../utils/isReactComponentMethod';
import isReactForwardRefCall from '../utils/isReactForwardRefCall';
import type Documentation from '../Documentation';
import match from '../utils/match';
import { traverseShallow } from '../utils/traverse';
import resolveToValue from '../utils/resolveToValue';
import type { Importer } from '../parse';
import type { NodePath } from 'ast-types/lib/node-path';
import { Scope } from 'ast-types/lib/scope';

function isPublicClassProperty(path: NodePath): boolean {
  return (
    t.ClassProperty.check(path.node) && !t.ClassPrivateProperty.check(path.node)
  );
}
/**
 * The following values/constructs are considered methods:
 *
 * - Method declarations in classes (except "constructor" and React lifecycle
 *   methods
 * - Public class fields in classes whose value are a functions
 * - Object properties whose values are functions
 */
function isMethod(path: NodePath, importer: Importer): boolean {
  const isProbablyMethod =
    (t.MethodDefinition.check(path.node) && path.node.kind !== 'constructor') ||
    ((isPublicClassProperty(path) || t.Property.check(path.node)) &&
      t.Function.check(resolveToValue(path.get('value'), importer).node));

  return isProbablyMethod && !isReactComponentMethod(path, importer);
}

function findAssignedMethods(
  scope: Scope,
  idPath: NodePath,
  importer: Importer,
): NodePath[] {
  const results: NodePath[] = [];

  if (!t.Identifier.check(idPath.node)) {
    return results;
  }

  const name = idPath.node.name;
  const idScope = idPath.scope.lookup(idPath.node.name);

  traverseShallow(scope.path, {
    visitAssignmentExpression: function (path) {
      const node = path.node;
      if (
        match(node.left, {
          type: 'MemberExpression',
          object: { type: 'Identifier', name },
        }) &&
        path.scope.lookup(name) === idScope &&
        t.Function.check(resolveToValue(path.get('right'), importer).node)
      ) {
        results.push(path);
        return false;
      }
      return this.traverse(path);
    },
  });

  return results;
}

// Finding the component itself depends heavily on how it's exported.
// Conversely, finding any 'useImperativeHandle()' methods requires digging
// through intervening assignments, declarations, and optionally a
// React.forwardRef() call.
function findUnderlyingComponentDefinition(exportPath, importer) {
  let path = exportPath;
  let keepDigging = true;
  let sawForwardRef = false;

  // We can't use 'visit', because we're not necessarily climbing "down" the
  // AST, we're following the logic flow *backwards* to the component
  // definition. Once we do find what looks like the underlying functional
  // component definition, *then* we can 'visit' downwards to find the call to
  // useImperativeHandle, if it exists.
  while (keepDigging && path) {
    // Using resolveToValue automatically gets the "value" from things like
    // assignments or identifier references.  Putting this here removes the need
    // to call it in a bunch of places on a per-type basis.
    path = resolveToValue(path, importer);
    const node = path.node;
    console.log('*** digging', node.type, node);

    // Rather than using ast-types 'namedTypes' (t) checks, we 'switch' on the
    // `node.type` value.  We lose the "is a" aspect (like a CallExpression "is
    // a(n)" Expression), but our handling very much depends on the *exact* node
    // type, so that's an acceptable compromise.
    switch (node.type) {
      case 'VariableDeclaration':
        path = path.get('declarations');
        if (path.value && path.value.length === 1) {
          path = path.get(0);
        } else {
          path = null;
        }
        break;

      case 'ExpressionStatement':
        path = path.get('expression');
        break;

      case 'CallExpression':
        // FUTURE: Can we detect other common HOCs that we could drill through?
        if (isReactForwardRefCall(path, importer) && !sawForwardRef) {
          sawForwardRef = true;
          path = path.get('arguments', 0);
        } else {
          path = null;
        }
        break;

      case 'ArrowFunctionExpression':
      case 'FunctionDeclaration':
      case 'FunctionExpression':
        // get the body and visit for useImperativeHandle!
        path = path.get('body');
        keepDigging = false;
        break;

      default:
        // Any other type causes us to bail.
        path = null;
    }
  }

  return path;
}

function findImperativeHandleMethods(exportPath, importer) {
  const path = findUnderlyingComponentDefinition(exportPath, importer);

  if (!path) {
    return [];
  }

  const results: NodePath[] = [];
  visit(path, {
    visitCallExpression: function(callPath) {
      // console.log('* call expression...');
      // We're trying to handle calls to React's useImperativeHandle.  If this
      // isn't, we can stop visiting this node path immediately.
      if (!isReactBuiltinCall(callPath, 'useImperativeHandle', importer)) {
        return false;
      }

      // The standard use (and documented example) is:
      //
      //   useImperativeHandle(ref, () => ({ name: () => {}, ...}))
      //                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //
      // ... so we only handle a second argument (index 1) that is an
      // ArrowFunctionExpression and whose body is an ObjectExpression.
      const arg = callPath.get('arguments', 1);

      if (!t.ArrowFunctionExpression.check(arg.node)) {
        return false;
      }

      const body = arg.get('body');
      if (!t.ObjectExpression.check(body.node)) {
        return false;
      }

      // We found the object body, now add all of the properties as methods.
      traverseShallow(body.get('properties'), {
        visitProperty: prop => {
          results.push(prop);
          return false;
        },
      });

      return false;
    },
  });

  return results;
}

/**
 * Extract all flow types for the methods of a react component. Doesn't
 * return any react specific lifecycle methods.
 */
export default function componentMethodsHandler(
  documentation: Documentation,
  path: NodePath,
  importer: Importer,
): void {
  // Extract all methods from the class or object.
  let methodPaths: NodePath[] = [];
  if (isReactComponentClass(path, importer)) {
    methodPaths = path
      .get('body', 'body')
      .filter((body: NodePath) => isMethod(body, importer));
  } else if (t.ObjectExpression.check(path.node)) {
    methodPaths = path
      .get('properties')
      .filter((props: NodePath) => isMethod(props, importer));

    // Add the statics object properties.
    const statics = getMemberValuePath(path, 'statics', importer);
    if (statics) {
      statics.get('properties').each((p: NodePath) => {
        if (isMethod(p, importer)) {
          p.node.static = true;
          methodPaths.push(p);
        }
      });
    }
  } else if (
    t.VariableDeclarator.check(path.parent.node) &&
    path.parent.node.init === path.node &&
    t.Identifier.check(path.parent.node.id)
  ) {
    methodPaths = findAssignedMethods(
      path.parent.scope,
      path.parent.get('id'),
      importer,
    );
  } else if (
    t.AssignmentExpression.check(path.parent.node) &&
    path.parent.node.right === path.node &&
    t.Identifier.check(path.parent.node.left)
  ) {
    methodPaths = findAssignedMethods(
      path.parent.scope,
      path.parent.get('left'),
      importer,
    );
  } else if (t.FunctionDeclaration.check(path.node)) {
    methodPaths = findAssignedMethods(
      path.parent.scope,
      path.get('id'),
      importer,
    );
  }

  // Also look for any methods that come from useImperativeHandle() calls.
  const impMethodPaths = findImperativeHandleMethods(path, importer);
  if (impMethodPaths && impMethodPaths.length > 0) {
    methodPaths = methodPaths.concat(impMethodPaths);
  }

  documentation.set(
    'methods',
    methodPaths.map(p => getMethodDocumentation(p, importer)).filter(Boolean),
  );
}
