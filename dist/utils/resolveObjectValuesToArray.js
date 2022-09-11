"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
function isObjectValuesCall(path) {
    if (!path.isCallExpression() || path.node.arguments.length !== 1) {
        return false;
    }
    const callee = path.get('callee');
    if (!callee.isMemberExpression()) {
        return false;
    }
    const object = callee.get('object');
    const property = callee.get('property');
    return (object.isIdentifier() &&
        object.node.name === 'Object' &&
        property.isIdentifier() &&
        property.node.name === 'values');
}
// Resolves an ObjectExpression or an ObjectTypeAnnotation
function resolveObjectToPropMap(object) {
    if (object.isObjectExpression()) {
        const values = new Map();
        let error = false;
        object.get('properties').forEach(propPath => {
            if (error || propPath.isObjectMethod())
                return;
            if (propPath.isObjectProperty()) {
                const key = propPath.get('key');
                let name;
                // Key is either Identifier or Literal
                if (key.isIdentifier()) {
                    name = key.node.name;
                }
                else if (key.isNumericLiteral() || key.isStringLiteral()) {
                    name = `${key.node.value}`;
                }
                else {
                    error = true;
                    return;
                }
                // Identifiers as values are not followed at all
                const valuePath = propPath.get('value');
                const value = valuePath.isStringLiteral()
                    ? `"${valuePath.node.value}"`
                    : valuePath.isNumericLiteral()
                        ? `${valuePath.node.value}`
                        : 'null';
                values.set(name, value);
            }
            else if (propPath.isSpreadElement()) {
                const spreadObject = (0, resolveToValue_1.default)(propPath.get('argument'));
                const spreadValues = resolveObjectToPropMap(spreadObject);
                if (!spreadValues) {
                    error = true;
                    return;
                }
                for (const entry of spreadValues.entries()) {
                    const [key, value] = entry;
                    values.set(key, value);
                }
            }
        });
        if (!error) {
            return values;
        }
    }
    return null;
}
/**
 * Returns an ArrayExpression which contains all the values resolved from an object
 *
 * Ignores setters in objects
 *
 * Returns null in case of
 *  unresolvable spreads
 *  computed identifier values
 */
function resolveObjectValuesToArray(path) {
    if (isObjectValuesCall(path)) {
        const objectExpression = (0, resolveToValue_1.default)(path.get('arguments')[0]);
        const values = resolveObjectToPropMap(objectExpression);
        if (values) {
            return Array.from(values.values());
        }
    }
    return null;
}
exports.default = resolveObjectValuesToArray;
