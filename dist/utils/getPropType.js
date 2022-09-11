"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const docblock_1 = require("../utils/docblock");
const getMembers_1 = __importDefault(require("./getMembers"));
const getPropertyName_1 = __importDefault(require("./getPropertyName"));
const isRequiredPropType_1 = __importDefault(require("../utils/isRequiredPropType"));
const printValue_1 = __importDefault(require("./printValue"));
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
const resolveObjectKeysToArray_1 = __importDefault(require("./resolveObjectKeysToArray"));
const resolveObjectValuesToArray_1 = __importDefault(require("./resolveObjectValuesToArray"));
function getEnumValuesFromArrayExpression(path) {
    const values = [];
    path.get('elements').forEach(elementPath => {
        // Array holes TODO test
        if (elementPath.node == null)
            return;
        if (elementPath.isSpreadElement()) {
            const value = (0, resolveToValue_1.default)(elementPath.get('argument'));
            if (value.isArrayExpression()) {
                // if the SpreadElement resolved to an Array, add all their elements too
                return values.push(...getEnumValuesFromArrayExpression(value));
            }
            else {
                // otherwise we'll just print the SpreadElement itself
                return values.push({
                    value: (0, printValue_1.default)(elementPath),
                    computed: !elementPath.isLiteral(),
                });
            }
        }
        // try to resolve the array element to it's value
        const value = (0, resolveToValue_1.default)(elementPath);
        return values.push({
            value: (0, printValue_1.default)(value),
            computed: !value.isLiteral(),
        });
    });
    return values;
}
function getPropTypeOneOf(argumentPath) {
    const type = { name: 'enum' };
    const value = (0, resolveToValue_1.default)(argumentPath);
    if (!value.isArrayExpression()) {
        const objectValues = (0, resolveObjectKeysToArray_1.default)(value) || (0, resolveObjectValuesToArray_1.default)(value);
        if (objectValues) {
            type.value = objectValues.map(objectValue => ({
                value: objectValue,
                computed: false,
            }));
        }
        else {
            // could not easily resolve to an Array, let's print the original value
            type.computed = true;
            type.value = (0, printValue_1.default)(argumentPath);
        }
    }
    else {
        type.value = getEnumValuesFromArrayExpression(value);
    }
    return type;
}
function getPropTypeOneOfType(argumentPath) {
    const type = { name: 'union' };
    if (!argumentPath.isArrayExpression()) {
        type.computed = true;
        type.value = (0, printValue_1.default)(argumentPath);
    }
    else {
        type.value = argumentPath.get('elements').map(elementPath => {
            // Array holes TODO test
            if (!elementPath.hasNode())
                return;
            const descriptor = getPropType(elementPath);
            const docs = (0, docblock_1.getDocblock)(elementPath);
            if (docs) {
                descriptor.description = docs;
            }
            return descriptor;
        });
    }
    return type;
}
function getPropTypeArrayOf(argumentPath) {
    const type = { name: 'arrayOf' };
    const docs = (0, docblock_1.getDocblock)(argumentPath);
    if (docs) {
        type.description = docs;
    }
    const subType = getPropType(argumentPath);
    // @ts-ignore
    if (subType.name === 'unknown') {
        type.value = (0, printValue_1.default)(argumentPath);
        type.computed = true;
    }
    else {
        type.value = subType;
    }
    return type;
}
function getPropTypeObjectOf(argumentPath) {
    const type = { name: 'objectOf' };
    const docs = (0, docblock_1.getDocblock)(argumentPath);
    if (docs) {
        type.description = docs;
    }
    const subType = getPropType(argumentPath);
    // @ts-ignore
    if (subType.name === 'unknown') {
        type.value = (0, printValue_1.default)(argumentPath);
        type.computed = true;
    }
    else {
        type.value = subType;
    }
    return type;
}
/**
 * Handles shape and exact prop types
 */
function getPropTypeShapish(name, argumentPath) {
    const type = { name };
    if (!argumentPath.isObjectExpression()) {
        argumentPath = (0, resolveToValue_1.default)(argumentPath);
    }
    if (argumentPath.isObjectExpression()) {
        const value = {};
        argumentPath.get('properties').forEach(propertyPath => {
            if (propertyPath.isSpreadElement() || propertyPath.isObjectMethod()) {
                // It is impossible to resolve a name for a spread element
                return;
            }
            const propertyName = (0, getPropertyName_1.default)(propertyPath);
            if (!propertyName)
                return;
            const valuePath = propertyPath.get('value');
            const descriptor = getPropType(valuePath);
            const docs = (0, docblock_1.getDocblock)(propertyPath);
            if (docs) {
                descriptor.description = docs;
            }
            descriptor.required = (0, isRequiredPropType_1.default)(valuePath);
            value[propertyName] = descriptor;
        });
        type.value = value;
    }
    if (!type.value) {
        type.value = (0, printValue_1.default)(argumentPath);
        type.computed = true;
    }
    return type;
}
function getPropTypeInstanceOf(argumentPath) {
    return {
        name: 'instanceOf',
        value: (0, printValue_1.default)(argumentPath),
    };
}
const simplePropTypes = [
    'array',
    'bool',
    'func',
    'number',
    'object',
    'string',
    'any',
    'element',
    'node',
    'symbol',
    'elementType',
];
function isSimplePropType(name) {
    return simplePropTypes.includes(name);
}
const propTypes = new Map([
    ['oneOf', getPropTypeOneOf],
    ['oneOfType', getPropTypeOneOfType],
    ['instanceOf', getPropTypeInstanceOf],
    ['arrayOf', getPropTypeArrayOf],
    ['objectOf', getPropTypeObjectOf],
    ['shape', getPropTypeShapish.bind(null, 'shape')],
    ['exact', getPropTypeShapish.bind(null, 'exact')],
]);
/**
 * Tries to identify the prop type by inspecting the path for known
 * prop type names. This method doesn't check whether the found type is actually
 * from React.PropTypes. It simply assumes that a match has the same meaning
 * as the React.PropTypes one.
 *
 * If there is no match, "custom" is returned.
 */
function getPropType(path) {
    let descriptor = null;
    (0, getMembers_1.default)(path, true).some(member => {
        const memberPath = member.path;
        let name = null;
        if (memberPath.isStringLiteral()) {
            name = memberPath.node.value;
        }
        else if (memberPath.isIdentifier() && !member.computed) {
            name = memberPath.node.name;
        }
        if (name) {
            if (isSimplePropType(name)) {
                descriptor = { name };
                return true;
            }
            const propTypeHandler = propTypes.get(name);
            if (propTypeHandler && member.argumentPaths.length) {
                descriptor = propTypeHandler(member.argumentPaths[0]);
                return true;
            }
        }
        return;
    });
    if (descriptor) {
        return descriptor;
    }
    if (path.isIdentifier() && isSimplePropType(path.node.name)) {
        return { name: path.node.name };
    }
    if (path.isCallExpression()) {
        const callee = path.get('callee');
        if (callee.isIdentifier()) {
            const propTypeHandler = propTypes.get(callee.node.name);
            if (propTypeHandler) {
                return propTypeHandler(path.get('arguments')[0]);
            }
        }
    }
    return { name: 'custom', raw: (0, printValue_1.default)(path) };
}
exports.default = getPropType;
