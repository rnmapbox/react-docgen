"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPUTED_PREFIX = void 0;
const getNameOrValue_1 = __importDefault(require("./getNameOrValue"));
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
exports.COMPUTED_PREFIX = '@computed#';
/**
 * In an ObjectExpression, the name of a property can either be an identifier
 * or a literal (or dynamic, but we don't support those). This function simply
 * returns the value of the literal or name of the identifier.
 */
function getPropertyName(propertyPath) {
    if (propertyPath.isObjectTypeSpreadProperty()) {
        const argument = propertyPath.get('argument');
        if (argument.isGenericTypeAnnotation()) {
            return (0, getNameOrValue_1.default)(argument.get('id'));
        }
        return null;
    }
    else if (propertyPath.has('computed')) {
        const key = propertyPath.get('key');
        // Try to resolve variables and member expressions
        if (key.isIdentifier() || key.isMemberExpression()) {
            const valuePath = (0, resolveToValue_1.default)(key);
            if (valuePath.isStringLiteral() || valuePath.isNumericLiteral()) {
                return `${valuePath.node.value}`;
            }
        }
        // generate name for identifier
        if (key.isIdentifier()) {
            return `${exports.COMPUTED_PREFIX}${key.node.name}`;
        }
        if (key.isStringLiteral() || key.isNumericLiteral()) {
            return `${key.node.value}`;
        }
        return null;
    }
    return `${(0, getNameOrValue_1.default)(propertyPath.get('key'))}`;
}
exports.default = getPropertyName;
