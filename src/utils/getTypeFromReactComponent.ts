import type { NodePath } from '@babel/traverse';
import type Documentation from '../Documentation.js';
import getMemberValuePath from './getMemberValuePath.js';
import getTypeAnnotation from './getTypeAnnotation.js';
import getTypeParameters from './getTypeParameters.js';
import isReactComponentClass from './isReactComponentClass.js';
import isReactForwardRefCall from './isReactForwardRefCall.js';
import resolveGenericTypeAnnotation from './resolveGenericTypeAnnotation.js';
import resolveToValue from './resolveToValue.js';
import type { TypeParameters } from './getTypeParameters.js';
import type {
  FlowType,
  InterfaceDeclaration,
  InterfaceExtends,
  TSExpressionWithTypeArguments,
  TSInterfaceDeclaration,
  TSType,
  TSTypeParameterDeclaration,
  TSTypeParameterInstantiation,
  TypeParameterDeclaration,
  TypeParameterInstantiation,
  VariableDeclarator,
  ClassDeclaration,
  ClassExpression,
} from '@babel/types';
import getTypeIdentifier from './getTypeIdentifier.js';
import isReactBuiltinReference from './isReactBuiltinReference.js';

function isInheritedFromHoc(
  path: NodePath<ClassDeclaration | ClassExpression>,
): boolean {
  const superClass = path.get('superClass');

  if (superClass.isCallExpression()) {
    return true;
  } else return false;
}

function propTypeFromInheritedHoc(
  path: NodePath<ClassDeclaration | ClassExpression>,
): NodePath | null {
  const superClass = path.get('superClass');

  if (!superClass.isCallExpression()) return null;

  const arugments: NodePath[] = superClass.get('arguments');
  const parent = arugments[0];

  if (parent && !Array.isArray(parent) && parent.hasNode()) {
    const typeParams = parent.get('typeParameters');

    if (!Array.isArray(typeParams) && typeParams.hasNode()) {
      const params = typeParams.get('params');

      if (!Array.isArray(params)) return null;

      const typeParam = params[0];

      if (
        typeParam &&
        !Array.isArray(typeParam) &&
        typeParam.hasNode() &&
        typeParam.isTSTypeReference()
      ) {
        return typeParam;
      }
    }
  }

  return null;
}

// TODO TESTME

function getStatelessPropsPath(
  componentDefinition: NodePath,
): NodePath | undefined {
  let value = componentDefinition;

  if (isReactForwardRefCall(value)) {
    value = resolveToValue(value.get('arguments')[0]!);
  }

  if (!value.isFunction()) return;

  return value.get('params')[0];
}

function findAssignedVariableType(
  componentDefinition: NodePath,
): NodePath | null {
  const variableDeclarator = componentDefinition.findParent((path) =>
    path.isVariableDeclarator(),
  ) as NodePath<VariableDeclarator> | null;

  if (!variableDeclarator) return null;

  const typeAnnotation = getTypeAnnotation(variableDeclarator.get('id'));

  if (!typeAnnotation) return null;

  if (typeAnnotation.isTSTypeReference()) {
    const typeName = typeAnnotation.get('typeName');

    if (
      isReactBuiltinReference(typeName, 'FunctionComponent') ||
      isReactBuiltinReference(typeName, 'FC') ||
      isReactBuiltinReference(typeName, 'VoidFunctionComponent') ||
      isReactBuiltinReference(typeName, 'VFC')
    ) {
      const typeParameters = typeAnnotation.get(
        'typeParameters',
      ) as NodePath<TSTypeParameterInstantiation>;

      if (!typeParameters.hasNode()) return null;

      return typeParameters.get('params')[0] ?? null;
    }
  }

  return null;
}

/**
 * Given an React component (stateless or class) tries to find
 * flow or TS types for the props. It may find multiple types.
 * If not found or it is not one of the supported component types,
 *  this function returns an empty array.
 */
export default (componentDefinition: NodePath): NodePath[] => {
  const typePaths: NodePath[] = [];

  if (isReactComponentClass(componentDefinition)) {
    const superTypes = componentDefinition.get('superTypeParameters');

    if (superTypes.hasNode()) {
      const params = superTypes.get('params');

      if (params.length >= 1) {
        typePaths.push(params[params.length === 3 ? 1 : 0]!);
      }
    } else {
      if (isInheritedFromHoc(componentDefinition)) {
        const typePath = propTypeFromInheritedHoc(componentDefinition);

        if (typePath) {
          typePaths.push(typePath);
        }

        return typePaths;
      }
      const propsMemberPath = getMemberValuePath(componentDefinition, 'props');

      if (!propsMemberPath) {
        return [];
      }

      const typeAnnotation = getTypeAnnotation(propsMemberPath.parentPath);

      if (typeAnnotation) {
        typePaths.push(typeAnnotation);
      }
    }

    return typePaths;
  }

  const propsParam = getStatelessPropsPath(componentDefinition);

  if (propsParam) {
    const typeAnnotation = getTypeAnnotation(propsParam);

    if (typeAnnotation) {
      typePaths.push(typeAnnotation);
    }
  }

  const assignedVariableType = findAssignedVariableType(componentDefinition);

  if (assignedVariableType) {
    typePaths.push(assignedVariableType);
  }

  return typePaths;
};

export function applyToTypeProperties(
  documentation: Documentation,
  path: NodePath,
  callback: (propertyPath: NodePath, params: TypeParameters | null) => void,
  typeParams: TypeParameters | null,
): void {
  if (path.isObjectTypeAnnotation()) {
    path
      .get('properties')
      .forEach((propertyPath) => callback(propertyPath, typeParams));
  } else if (path.isTSTypeLiteral()) {
    path
      .get('members')
      .forEach((propertyPath) => callback(propertyPath, typeParams));
  } else if (path.isInterfaceDeclaration()) {
    applyExtends(documentation, path, callback, typeParams);

    path
      .get('body')
      .get('properties')
      .forEach((propertyPath) => callback(propertyPath, typeParams));
  } else if (path.isTSInterfaceDeclaration()) {
    applyExtends(documentation, path, callback, typeParams);

    path
      .get('body')
      .get('body')
      .forEach((propertyPath) => callback(propertyPath, typeParams));
  } else if (
    path.isIntersectionTypeAnnotation() ||
    path.isTSIntersectionType()
  ) {
    (path.get('types') as Array<NodePath<FlowType | TSType>>).forEach(
      (typesPath) =>
        applyToTypeProperties(documentation, typesPath, callback, typeParams),
    );
  } else if (!path.isUnionTypeAnnotation()) {
    // The react-docgen output format does not currently allow
    // for the expression of union types
    const typePath = resolveGenericTypeAnnotation(path);

    if (typePath) {
      applyToTypeProperties(documentation, typePath, callback, typeParams);
    }
  }
}

function applyExtends(
  documentation: Documentation,
  path: NodePath<InterfaceDeclaration | TSInterfaceDeclaration>,
  callback: (propertyPath: NodePath, params: TypeParameters | null) => void,
  typeParams: TypeParameters | null,
): void {
  const classExtends = path.get('extends');

  if (!Array.isArray(classExtends)) {
    return;
  }

  classExtends.forEach(
    (
      extendsPath: NodePath<InterfaceExtends | TSExpressionWithTypeArguments>,
    ) => {
      const resolvedPath = resolveGenericTypeAnnotation(extendsPath);

      if (resolvedPath) {
        if (
          resolvedPath.has('typeParameters') &&
          extendsPath.node.typeParameters
        ) {
          typeParams = getTypeParameters(
            resolvedPath.get('typeParameters') as NodePath<
              TSTypeParameterDeclaration | TypeParameterDeclaration
            >,
            extendsPath.get('typeParameters') as NodePath<
              TSTypeParameterInstantiation | TypeParameterInstantiation
            >,
            typeParams,
          );
        }
        applyToTypeProperties(
          documentation,
          resolvedPath,
          callback,
          typeParams,
        );
      } else {
        const idPath = getTypeIdentifier(extendsPath);

        if (idPath && idPath.isIdentifier()) {
          documentation.addComposes(idPath.node.name);
        }
      }
    },
  );
}
