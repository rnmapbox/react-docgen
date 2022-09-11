"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isReactCreateClassCall_1 = __importDefault(require("./isReactCreateClassCall"));
const isReactForwardRefCall_1 = __importDefault(require("./isReactForwardRefCall"));
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
/**
 * If the path is a call expression, it recursively resolves to the
 * rightmost argument, stopping if it finds a React.createClass call expression
 *
 * Else the path itself is returned.
 */
function resolveHOC(path) {
    if (path.isCallExpression() &&
        !(0, isReactCreateClassCall_1.default)(path) &&
        !(0, isReactForwardRefCall_1.default)(path)) {
        const node = path.node;
        const argumentLength = node.arguments.length;
        if (argumentLength && argumentLength > 0) {
            const args = path.get('arguments');
            const firstArg = args[0];
            // If the first argument is one of these types then the component might be the last argument
            // If there are all identifiers then we cannot figure out exactly and have to assume it is the first
            if (argumentLength > 1 &&
                (firstArg.isLiteral() ||
                    firstArg.isObjectExpression() ||
                    firstArg.isArrayExpression() ||
                    firstArg.isSpreadElement())) {
                return resolveHOC((0, resolveToValue_1.default)(args[argumentLength - 1]));
            }
            return resolveHOC((0, resolveToValue_1.default)(firstArg));
        }
    }
    return path;
}
exports.default = resolveHOC;
