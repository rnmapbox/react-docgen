"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isReactComponentClass_1 = __importDefault(require("../utils/isReactComponentClass"));
const isReactCreateClassCall_1 = __importDefault(require("../utils/isReactCreateClassCall"));
const isReactForwardRefCall_1 = __importDefault(require("../utils/isReactForwardRefCall"));
const isStatelessComponent_1 = __importDefault(require("../utils/isStatelessComponent"));
const normalizeClassDefinition_1 = __importDefault(require("../utils/normalizeClassDefinition"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
const traverse_1 = require("@babel/traverse");
function classVisitor(path, state) {
    if ((0, isReactComponentClass_1.default)(path)) {
        (0, normalizeClassDefinition_1.default)(path);
        state.foundDefinitions.add(path);
    }
    path.skip();
}
function statelessVisitor(path, state) {
    if ((0, isStatelessComponent_1.default)(path)) {
        state.foundDefinitions.add(path);
    }
    path.skip();
}
const explodedVisitors = traverse_1.visitors.explode({
    FunctionDeclaration: { enter: statelessVisitor },
    FunctionExpression: { enter: statelessVisitor },
    ObjectMethod: { enter: statelessVisitor },
    ArrowFunctionExpression: { enter: statelessVisitor },
    ClassExpression: { enter: classVisitor },
    ClassDeclaration: { enter: classVisitor },
    CallExpression: {
        enter: function (path, state) {
            if ((0, isReactForwardRefCall_1.default)(path)) {
                // If the the inner function was previously identified as a component
                // replace it with the parent node
                const inner = (0, resolveToValue_1.default)(path.get('arguments')[0]);
                state.foundDefinitions.delete(inner);
                state.foundDefinitions.add(path);
                // Do not traverse into arguments
                return path.skip();
            }
            else if ((0, isReactCreateClassCall_1.default)(path)) {
                const resolvedPath = (0, resolveToValue_1.default)(path.get('arguments')[0]);
                if (resolvedPath.isObjectExpression()) {
                    state.foundDefinitions.add(resolvedPath);
                }
                // Do not traverse into arguments
                return path.skip();
            }
        },
    },
});
/**
 * Given an AST, this function tries to find all object expressions that are
 * passed to `React.createClass` calls, by resolving all references properly.
 */
const findAllComponentDefinitions = function (file) {
    const state = {
        foundDefinitions: new Set(),
    };
    file.traverse(explodedVisitors, state);
    return Array.from(state.foundDefinitions);
};
exports.default = findAllComponentDefinitions;
