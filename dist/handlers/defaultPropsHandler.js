"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getPropertyName_1 = __importDefault(require("../utils/getPropertyName"));
const getMemberValuePath_1 = __importDefault(require("../utils/getMemberValuePath"));
const printValue_1 = __importDefault(require("../utils/printValue"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
const resolveFunctionDefinitionToReturnValue_1 = __importDefault(require("../utils/resolveFunctionDefinitionToReturnValue"));
const isReactComponentClass_1 = __importDefault(require("../utils/isReactComponentClass"));
const isReactForwardRefCall_1 = __importDefault(require("../utils/isReactForwardRefCall"));
function getDefaultValue(path) {
    let defaultValue;
    let resolvedPath = path;
    let valuePath = path;
    if (path.isBooleanLiteral()) {
        defaultValue = `${path.node.value}`;
    }
    else if (path.isNullLiteral()) {
        defaultValue = 'null';
    }
    else if (path.isLiteral()) {
        defaultValue = path.node.extra?.raw;
    }
    else {
        if (path.isAssignmentPattern()) {
            resolvedPath = (0, resolveToValue_1.default)(path.get('right'));
        }
        else {
            resolvedPath = (0, resolveToValue_1.default)(path);
        }
        if (resolvedPath.isImportDeclaration() && path.isIdentifier()) {
            defaultValue = path.node.name;
        }
        else {
            valuePath = resolvedPath;
            defaultValue = (0, printValue_1.default)(resolvedPath);
        }
    }
    if (typeof defaultValue !== 'undefined') {
        return {
            value: defaultValue,
            computed: valuePath.isCallExpression() ||
                valuePath.isMemberExpression() ||
                valuePath.isIdentifier(),
        };
    }
    return null;
}
function getStatelessPropsPath(componentDefinition) {
    let value = (0, resolveToValue_1.default)(componentDefinition);
    if ((0, isReactForwardRefCall_1.default)(value)) {
        value = (0, resolveToValue_1.default)(value.get('arguments')[0]);
    }
    return value.get('params')[0];
}
function getDefaultPropsPath(componentDefinition) {
    let defaultPropsPath = (0, getMemberValuePath_1.default)(componentDefinition, 'defaultProps');
    if (!defaultPropsPath) {
        return null;
    }
    defaultPropsPath = (0, resolveToValue_1.default)(defaultPropsPath);
    if (!defaultPropsPath) {
        return null;
    }
    if (defaultPropsPath.isFunctionExpression() ||
        defaultPropsPath.isFunctionDeclaration() ||
        defaultPropsPath.isClassMethod() ||
        defaultPropsPath.isObjectMethod()) {
        // Find the value that is returned from the function and process it if it is
        // an object literal.
        const returnValue = (0, resolveFunctionDefinitionToReturnValue_1.default)(defaultPropsPath);
        if (returnValue && returnValue.isObjectExpression()) {
            defaultPropsPath = returnValue;
        }
    }
    return defaultPropsPath;
}
function getDefaultValuesFromProps(properties, documentation, isStateless) {
    properties.forEach(propertyPath => {
        if (propertyPath.isObjectProperty()) {
            const propName = (0, getPropertyName_1.default)(propertyPath);
            if (!propName)
                return;
            let valuePath = propertyPath.get('value');
            if (isStateless) {
                if (valuePath.isAssignmentPattern()) {
                    valuePath = valuePath.get('right');
                }
                else {
                    // Don't evaluate property if component is functional and the node is not an AssignmentPattern
                    return;
                }
            }
            // Initialize the prop descriptor here after the early return from above
            const propDescriptor = documentation.getPropDescriptor(propName);
            const defaultValue = getDefaultValue(valuePath);
            if (defaultValue) {
                propDescriptor.defaultValue = defaultValue;
            }
        }
        else if (propertyPath.isSpreadElement()) {
            const resolvedValuePath = (0, resolveToValue_1.default)(propertyPath.get('argument'));
            if (resolvedValuePath.isObjectExpression()) {
                getDefaultValuesFromProps(resolvedValuePath.get('properties'), documentation, isStateless);
            }
        }
    });
}
const defaultPropsHandler = function (documentation, componentDefinition) {
    let statelessProps = null;
    const defaultPropsPath = getDefaultPropsPath(componentDefinition);
    /**
     * function, lazy, memo, forwardRef etc components can resolve default props as well
     */
    if (!(0, isReactComponentClass_1.default)(componentDefinition)) {
        statelessProps = getStatelessPropsPath(componentDefinition);
    }
    // Do both statelessProps and defaultProps if both are available so defaultProps can override
    if (statelessProps && statelessProps.isObjectPattern()) {
        getDefaultValuesFromProps(statelessProps.get('properties'), documentation, true);
    }
    if (defaultPropsPath && defaultPropsPath.isObjectExpression()) {
        getDefaultValuesFromProps(defaultPropsPath.get('properties'), documentation, false);
    }
};
exports.default = defaultPropsHandler;
