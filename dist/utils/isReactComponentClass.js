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
function isRenderMethod(path) {
    if ((!path.isClassMethod() || path.node.kind !== 'method') &&
        !path.isClassProperty()) {
        return false;
    }
    if (path.node.computed || path.node.static) {
        return false;
    }
    const key = path.get('key');
    if (!key.isIdentifier() || key.node.name !== 'render') {
        return false;
    }
    return true;
}
/**
 * Returns `true` of the path represents a class definition which either extends
 * `React.Component` or has a superclass and implements a `render()` method.
 */
function isReactComponentClass(path) {
    if (!path.isClassDeclaration() && !path.isClassExpression()) {
        return false;
    }
    // extends something
    if (!path.node.superClass) {
        return false;
    }
    // React.Component or React.PureComponent
    const superClass = (0, resolveToValue_1.default)(path.get('superClass'));
    if ((0, match_1.default)(superClass.node, { property: { name: 'Component' } }) ||
        (0, match_1.default)(superClass.node, { property: { name: 'PureComponent' } }) ||
        (0, isDestructuringAssignment_1.default)(superClass, 'Component') ||
        (0, isDestructuringAssignment_1.default)(superClass, 'PureComponent')) {
        const module = (0, resolveToModule_1.default)(superClass);
        if (module && (0, isReactModuleName_1.default)(module)) {
            return true;
        }
    }
    // render method
    if (path.get('body').get('body').some(isRenderMethod)) {
        return true;
    }
    // check for @extends React.Component in docblock
    if (path.node.leadingComments &&
        path.node.leadingComments.some(function (comment) {
            return /@extends\s+React\.Component/.test(comment.value);
        })) {
        return true;
    }
    return false;
}
exports.default = isReactComponentClass;
