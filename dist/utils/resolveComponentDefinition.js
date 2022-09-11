"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isComponentDefinition = void 0;
const isReactComponentClass_1 = __importDefault(require("./isReactComponentClass"));
const isReactCreateClassCall_1 = __importDefault(require("./isReactCreateClassCall"));
const isReactForwardRefCall_1 = __importDefault(require("./isReactForwardRefCall"));
const isStatelessComponent_1 = __importDefault(require("./isStatelessComponent"));
const normalizeClassDefinition_1 = __importDefault(require("./normalizeClassDefinition"));
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
function isComponentDefinition(path) {
    return ((0, isReactCreateClassCall_1.default)(path) ||
        (0, isReactComponentClass_1.default)(path) ||
        (0, isStatelessComponent_1.default)(path) ||
        (0, isReactForwardRefCall_1.default)(path));
}
exports.isComponentDefinition = isComponentDefinition;
function resolveComponentDefinition(definition) {
    if ((0, isReactCreateClassCall_1.default)(definition)) {
        // return argument
        const resolvedPath = (0, resolveToValue_1.default)(definition.get('arguments')[0]);
        if (resolvedPath.isObjectExpression()) {
            return resolvedPath;
        }
    }
    else if ((0, isReactComponentClass_1.default)(definition)) {
        (0, normalizeClassDefinition_1.default)(definition);
        return definition;
    }
    else if ((0, isStatelessComponent_1.default)(definition) ||
        (0, isReactForwardRefCall_1.default)(definition)) {
        return definition;
    }
    return null;
}
exports.default = resolveComponentDefinition;
