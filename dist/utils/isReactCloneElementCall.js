"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isReactBuiltinCall_1 = __importDefault(require("./isReactBuiltinCall"));
/**
 * Returns true if the expression is a function call of the form
 * `React.cloneElement(...)`.
 */
function isReactCloneElementCall(path) {
    return (0, isReactBuiltinCall_1.default)(path, 'cloneElement');
}
exports.default = isReactCloneElementCall;
