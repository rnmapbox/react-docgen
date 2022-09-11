"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isReactModuleName_1 = __importDefault(require("./isReactModuleName"));
const match_1 = __importDefault(require("./match"));
const resolveToModule_1 = __importDefault(require("./resolveToModule"));
// TODO unit tests
/**
 * Returns true if the expression is a function call of the form
 * `React.Children.only(...)`.
 */
function isReactChildrenElementCall(path) {
    if (path.isExpressionStatement()) {
        path = path.get('expression');
    }
    if (!(0, match_1.default)(path.node, { callee: { property: { name: 'only' } } })) {
        return false;
    }
    const calleeObj = path.get('callee').get('object');
    if (!(0, match_1.default)(calleeObj.node, { property: { name: 'Children' } })) {
        return false;
    }
    const module = (0, resolveToModule_1.default)(calleeObj);
    return Boolean(module && (0, isReactModuleName_1.default)(module));
}
exports.default = isReactChildrenElementCall;
