"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const traverse_1 = require("@babel/traverse");
const getMemberExpressionRoot_1 = __importDefault(require("./getMemberExpressionRoot"));
const getPropertyValuePath_1 = __importDefault(require("./getPropertyValuePath"));
const expressionTo_1 = require("./expressionTo");
const traverse_2 = require("./traverse");
const getMemberValuePath_1 = __importStar(require("./getMemberValuePath"));
const ts_types_1 = __importDefault(require("./ts-types"));
const getNameOrValue_1 = __importDefault(require("./getNameOrValue"));
function findScopePath(bindingIdentifiers) {
    if (bindingIdentifiers && bindingIdentifiers.length >= 1) {
        const resolvedParentPath = bindingIdentifiers[0].parentPath;
        if (resolvedParentPath.isImportDefaultSpecifier() ||
            resolvedParentPath.isImportSpecifier()) {
            // TODO TESTME
            let exportName;
            if (resolvedParentPath.isImportDefaultSpecifier()) {
                exportName = 'default';
            }
            else {
                const imported = resolvedParentPath.get('imported');
                if (imported.isStringLiteral()) {
                    exportName = imported.node.value;
                }
                else if (imported.isIdentifier()) {
                    exportName = imported.node.name;
                }
            }
            if (!exportName) {
                throw new Error('Could not detect export name');
            }
            const importedPath = resolvedParentPath.hub.import(resolvedParentPath.parentPath, exportName);
            if (importedPath) {
                return resolveToValue(importedPath);
            }
        }
        return resolveToValue(resolvedParentPath);
    }
    return null;
}
const explodedVisitors = traverse_1.visitors.explode({
    ...traverse_2.shallowIgnoreVisitors,
    AssignmentExpression: {
        enter: function (assignmentPath, state) {
            const node = state.idPath.node;
            const left = assignmentPath.get('left');
            // Skip anything that is not an assignment to a variable with the
            // passed name.
            // Ensure the LHS isn't the reference we're trying to resolve.
            if (!left.isIdentifier() ||
                left.node === node ||
                left.node.name !== node.name ||
                assignmentPath.node.operator !== '=') {
                return assignmentPath.skip();
            }
            // Ensure the RHS doesn't contain the reference we're trying to resolve.
            const candidatePath = assignmentPath.get('right');
            if (candidatePath.node === node ||
                state.idPath.findParent(parent => parent.node === candidatePath.node)) {
                return assignmentPath.skip();
            }
            state.resultPath = candidatePath;
            return assignmentPath.skip();
        },
    },
});
/**
 * Tries to find the last value assigned to `name` in the scope created by
 * `scope`. We are not descending into any statements (blocks).
 */
function findLastAssignedValue(path, idPath) {
    const state = { idPath };
    path.traverse(explodedVisitors, state);
    return state.resultPath ? resolveToValue(state.resultPath) : null;
}
/**
 * If the path is an identifier, it is resolved in the scope chain.
 * If it is an assignment expression, it resolves to the right hand side.
 * If it is a member expression it is resolved to it's initialization value.
 *
 * Else the path itself is returned.
 */
function resolveToValue(path) {
    if (path.isIdentifier()) {
        if ((path.parentPath.isClass() || path.parentPath.isFunction()) &&
            path.parentPath.get('id') === path) {
            return path.parentPath;
        }
        const binding = path.scope.getBinding(path.node.name);
        let resolvedPath = null;
        if (binding) {
            // The variable may be assigned a different value after initialization.
            // We are first trying to find all assignments to the variable in the
            // block where it is defined (i.e. we are not traversing into statements)
            resolvedPath = findLastAssignedValue(binding.scope.path, path);
            if (!resolvedPath) {
                const bindingMap = binding.path.getOuterBindingIdentifierPaths(true);
                resolvedPath = findScopePath(bindingMap[path.node.name]);
            }
        }
        else {
            // Initialize our monkey-patching of @babel/traverse 🙈
            (0, ts_types_1.default)(traverse_1.Scope);
            const typeBinding = path.scope.getTypeBinding(path.node.name);
            if (typeBinding) {
                resolvedPath = findScopePath([typeBinding.identifierPath]);
            }
        }
        return resolvedPath || path;
    }
    else if (path.isVariableDeclarator()) {
        const init = path.get('init');
        if (init.hasNode()) {
            return resolveToValue(init);
        }
    }
    else if (path.isMemberExpression()) {
        const root = (0, getMemberExpressionRoot_1.default)(path);
        const resolved = resolveToValue(root);
        if (resolved.isObjectExpression()) {
            let propertyPath = resolved;
            for (const propertyName of (0, expressionTo_1.Array)(path).slice(1)) {
                if (propertyPath && propertyPath.isObjectExpression()) {
                    propertyPath = (0, getPropertyValuePath_1.default)(propertyPath, propertyName);
                }
                if (!propertyPath) {
                    return path;
                }
                propertyPath = resolveToValue(propertyPath);
            }
            return propertyPath;
        }
        else if ((0, getMemberValuePath_1.isSupportedDefinitionType)(resolved)) {
            const property = path.get('property');
            if (property.isIdentifier() || property.isStringLiteral()) {
                const memberPath = (0, getMemberValuePath_1.default)(resolved, property.isIdentifier() ? property.node.name : property.node.value);
                if (memberPath) {
                    return resolveToValue(memberPath);
                }
            }
        }
        else if (resolved.isImportDeclaration() && resolved.node.specifiers) {
            // Handle references to namespace imports, e.g. import * as foo from 'bar'.
            // Try to find a specifier that matches the root of the member expression, and
            // find the export that matches the property name.
            for (const specifier of resolved.get('specifiers')) {
                const property = path.get('property');
                let propertyName;
                if (property.isIdentifier() || property.isStringLiteral()) {
                    propertyName = (0, getNameOrValue_1.default)(property);
                }
                if (specifier.isImportNamespaceSpecifier() &&
                    root.isIdentifier() &&
                    propertyName &&
                    specifier.node.local.name === root.node.name) {
                    const resolvedPath = path.hub.import(resolved, propertyName);
                    if (resolvedPath) {
                        return resolveToValue(resolvedPath);
                    }
                }
            }
        }
    }
    else if (path.isImportDefaultSpecifier() ||
        path.isImportNamespaceSpecifier() ||
        path.isImportSpecifier()) {
        // go up to the import declaration
        return path.parentPath;
    }
    else if (path.isTypeCastExpression() ||
        path.isTSAsExpression() ||
        path.isTSTypeAssertion()) {
        return resolveToValue(path.get('expression'));
    }
    return path;
}
exports.default = resolveToValue;
