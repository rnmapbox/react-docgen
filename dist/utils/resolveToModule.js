"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getMemberExpressionRoot_1 = __importDefault(require("./getMemberExpressionRoot"));
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
/**
 * Given a path (e.g. call expression, member expression or identifier),
 * this function tries to find the name of module from which the "root value"
 * was imported.
 */
function resolveToModule(path) {
    if (path.isVariableDeclarator()) {
        if (path.node.init) {
            return resolveToModule(path.get('init'));
        }
    }
    else if (path.isCallExpression()) {
        const callee = path.get('callee');
        if (callee.isIdentifier() && callee.node.name === 'require') {
            return path.node.arguments[0].value;
        }
        return resolveToModule(callee);
    }
    else if (path.isIdentifier() || path.isJSXIdentifier()) {
        const valuePath = (0, resolveToValue_1.default)(path);
        if (valuePath !== path) {
            return resolveToModule(valuePath);
        }
        if (path.parentPath.isObjectProperty()) {
            return resolveToModule(path.parentPath);
        }
    }
    else if (path.isObjectProperty() || path.isObjectPattern()) {
        return resolveToModule(path.parentPath);
    }
    else if (path.isImportDeclaration()) {
        return path.node.source.value;
    }
    else if (path.isMemberExpression()) {
        path = (0, getMemberExpressionRoot_1.default)(path);
        return resolveToModule(path);
    }
    return null;
}
exports.default = resolveToModule;
