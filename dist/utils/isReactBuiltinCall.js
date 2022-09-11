"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isReactModuleName_1 = __importDefault(require("./isReactModuleName"));
const match_1 = __importDefault(require("./match"));
const resolveToModule_1 = __importDefault(require("./resolveToModule"));
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
const isDestructuringAssignment_1 = __importDefault(require("./isDestructuringAssignment"));
function isNamedMemberExpression(value, name) {
    if (!value.isMemberExpression()) {
        return false;
    }
    const property = value.get('property');
    return property.isIdentifier() && property.node.name === name;
}
function isNamedImportDeclaration(value, callee, name) {
    if (!value.isImportDeclaration() || !callee.isIdentifier()) {
        return false;
    }
    return value.get('specifiers').some(specifier => {
        if (!specifier.isImportSpecifier()) {
            return false;
        }
        const imported = specifier.get('imported');
        const local = specifier.get('local');
        return (((imported.isIdentifier() && imported.node.name === name) ||
            (imported.isStringLiteral() && imported.node.value === name)) &&
            local.node.name === callee.node.name);
    });
}
/**
 * Returns true if the expression is a function call of the form
 * `React.foo(...)`.
 */
function isReactBuiltinCall(path, name) {
    if (path.isExpressionStatement()) {
        path = path.get('expression');
    }
    if (path.isCallExpression()) {
        if ((0, match_1.default)(path.node, { callee: { property: { name } } })) {
            const module = (0, resolveToModule_1.default)(path.get('callee').get('object'));
            return Boolean(module && (0, isReactModuleName_1.default)(module));
        }
        const value = (0, resolveToValue_1.default)(path.get('callee'));
        if (value === path.get('callee')) {
            return false;
        }
        if (
        // const { x } = require('react')
        (0, isDestructuringAssignment_1.default)(value, name) ||
            // `require('react').createElement`
            isNamedMemberExpression(value, name) ||
            // `import { createElement } from 'react'`
            isNamedImportDeclaration(value, path.get('callee'), name)) {
            const module = (0, resolveToModule_1.default)(value);
            return Boolean(module && (0, isReactModuleName_1.default)(module));
        }
    }
    return false;
}
exports.default = isReactBuiltinCall;
