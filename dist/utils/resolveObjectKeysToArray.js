"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveObjectToNameArray = void 0;
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
function isObjectKeysCall(path) {
    if (!path.isCallExpression() || path.get('arguments').length !== 1) {
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
        property.node.name === 'keys');
}
function isWhitelistedObjectProperty(path) {
    if (path.isSpreadElement())
        return true;
    if (path.isObjectProperty() ||
        (path.isObjectMethod() &&
            (path.node.kind === 'get' || path.node.kind === 'set'))) {
        const key = path.get('key');
        return ((key.isIdentifier() && !path.node.computed) ||
            key.isStringLiteral() ||
            key.isNumericLiteral());
    }
    return false;
}
function isWhiteListedObjectTypeProperty(path) {
    return (path.isObjectTypeProperty() ||
        path.isObjectTypeSpreadProperty() ||
        path.isTSPropertySignature());
}
// Resolves an ObjectExpression or an ObjectTypeAnnotation
function resolveObjectToNameArray(objectPath, raw = false) {
    if ((objectPath.isObjectExpression() &&
        objectPath.get('properties').every(isWhitelistedObjectProperty)) ||
        (objectPath.isObjectTypeAnnotation() &&
            objectPath.get('properties').every(isWhiteListedObjectTypeProperty)) ||
        (objectPath.isTSTypeLiteral() &&
            objectPath.get('members').every(isWhiteListedObjectTypeProperty))) {
        let values = [];
        let error = false;
        const properties = objectPath.isTSTypeLiteral()
            ? objectPath.get('members')
            : objectPath.get('properties');
        properties.forEach(propPath => {
            if (error)
                return;
            if (propPath.isObjectProperty() ||
                propPath.isObjectMethod() ||
                propPath.isObjectTypeProperty() ||
                propPath.isTSPropertySignature()) {
                const key = propPath.get('key');
                // Key is either Identifier or Literal
                const name = key.isIdentifier()
                    ? key.node.name
                    : raw
                        ? key.node.extra?.raw
                        : `${key.node.value}`;
                values.push(name);
            }
            else if (propPath.isSpreadElement() ||
                propPath.isObjectTypeSpreadProperty()) {
                let spreadObject = (0, resolveToValue_1.default)(propPath.get('argument'));
                if (spreadObject.isGenericTypeAnnotation()) {
                    const typeAliasRight = (0, resolveToValue_1.default)(spreadObject.get('id')).get('right');
                    if (typeAliasRight.isObjectTypeAnnotation()) {
                        spreadObject = (0, resolveToValue_1.default)(typeAliasRight);
                    }
                }
                const spreadValues = resolveObjectToNameArray(spreadObject);
                if (!spreadValues) {
                    error = true;
                    return;
                }
                values = [...values, ...spreadValues];
            }
        });
        if (!error) {
            return values;
        }
    }
    return null;
}
exports.resolveObjectToNameArray = resolveObjectToNameArray;
/**
 * Returns an ArrayExpression which contains all the keys resolved from an object
 *
 * Ignores setters in objects
 *
 * Returns null in case of
 *  unresolvable spreads
 *  computed identifier keys
 */
function resolveObjectKeysToArray(path) {
    if (isObjectKeysCall(path)) {
        const objectExpression = (0, resolveToValue_1.default)(path.get('arguments')[0]);
        const values = resolveObjectToNameArray(objectExpression);
        if (values) {
            const nodes = values
                //filter duplicates
                .filter((value, index, array) => array.indexOf(value) === index)
                .map(value => `"${value}"`);
            return nodes;
        }
    }
    return null;
}
exports.default = resolveObjectKeysToArray;
