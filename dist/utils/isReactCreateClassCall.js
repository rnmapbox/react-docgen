"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolveToModule_1 = __importDefault(require("./resolveToModule"));
const isReactBuiltinCall_1 = __importDefault(require("./isReactBuiltinCall"));
/**
 * Returns true if the expression is a function call of the form
 * ```
 * import createReactClass from 'create-react-class';
 * createReactClass(...);
 * ```
 */
function isReactCreateClassCallModular(path) {
    if (path.isExpressionStatement()) {
        path = path.get('expression');
    }
    if (!path.isCallExpression()) {
        return false;
    }
    const module = (0, resolveToModule_1.default)(path);
    return Boolean(module && module === 'create-react-class');
}
/**
 * Returns true if the expression is a function call of the form
 * `React.createClass(...)` or
 * ```
 * import createReactClass from 'create-react-class';
 * createReactClass(...);
 * ```
 */
function isReactCreateClassCall(path) {
    return ((0, isReactBuiltinCall_1.default)(path, 'createClass') ||
        isReactCreateClassCallModular(path));
}
exports.default = isReactCreateClassCall;
