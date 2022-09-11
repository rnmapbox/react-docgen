"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getPropertyValuePath_1 = __importDefault(require("./getPropertyValuePath"));
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
function resolveToObjectExpression(path) {
    if (path.isVariableDeclarator()) {
        const init = path.get('init');
        if (init.hasNode()) {
            return (0, resolveToValue_1.default)(init);
        }
    }
    else if (path.isAssignmentExpression()) {
        if (path.node.operator === '=') {
            return (0, resolveToValue_1.default)(path.get('right'));
        }
    }
    return null;
}
/**
 * Resolve and ObjectProperty inside an ObjectPattern to its value if possible
 * If not found `null` is returned
 */
function resolveObjectPatternPropertyToValue(path) {
    if (!path.parentPath.isObjectPattern()) {
        return null;
    }
    const resolved = resolveToObjectExpression(path.parentPath.parentPath);
    if (resolved && resolved.isObjectExpression()) {
        const propertyPath = (0, getPropertyValuePath_1.default)(resolved, 
        // Always id in ObjectPattern
        path.get('key').node.name);
        if (propertyPath) {
            return (0, resolveToValue_1.default)(propertyPath);
        }
    }
    return null;
}
exports.default = resolveObjectPatternPropertyToValue;
