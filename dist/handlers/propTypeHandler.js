"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.childContextTypeHandler = exports.contextTypeHandler = exports.propTypeHandler = void 0;
const getPropType_1 = __importDefault(require("../utils/getPropType"));
const getPropertyName_1 = __importDefault(require("../utils/getPropertyName"));
const getMemberValuePath_1 = __importDefault(require("../utils/getMemberValuePath"));
const isReactModuleName_1 = __importDefault(require("../utils/isReactModuleName"));
const isRequiredPropType_1 = __importDefault(require("../utils/isRequiredPropType"));
const printValue_1 = __importDefault(require("../utils/printValue"));
const resolveToModule_1 = __importDefault(require("../utils/resolveToModule"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
function isPropTypesExpression(path) {
    const moduleName = (0, resolveToModule_1.default)(path);
    if (moduleName) {
        return (0, isReactModuleName_1.default)(moduleName) || moduleName === 'ReactPropTypes';
    }
    return false;
}
function amendPropTypes(getDescriptor, path) {
    if (!path.isObjectExpression()) {
        return;
    }
    path.get('properties').forEach(propertyPath => {
        if (propertyPath.isObjectProperty()) {
            const propName = (0, getPropertyName_1.default)(propertyPath);
            if (!propName)
                return;
            const propDescriptor = getDescriptor(propName);
            const valuePath = (0, resolveToValue_1.default)(propertyPath.get('value'));
            const type = isPropTypesExpression(valuePath)
                ? (0, getPropType_1.default)(valuePath)
                : { name: 'custom', raw: (0, printValue_1.default)(valuePath) };
            if (type) {
                propDescriptor.type = type;
                propDescriptor.required =
                    type.name !== 'custom' && (0, isRequiredPropType_1.default)(valuePath);
            }
        }
        if (propertyPath.isSpreadElement()) {
            const resolvedValuePath = (0, resolveToValue_1.default)(propertyPath.get('argument'));
            if (resolvedValuePath.isObjectExpression()) {
                // normal object literal
                amendPropTypes(getDescriptor, resolvedValuePath);
            }
        }
    });
}
function getPropTypeHandler(propName) {
    return function (documentation, componentDefinition) {
        let propTypesPath = (0, getMemberValuePath_1.default)(componentDefinition, propName);
        if (!propTypesPath) {
            return;
        }
        propTypesPath = (0, resolveToValue_1.default)(propTypesPath);
        if (!propTypesPath) {
            return;
        }
        let getDescriptor;
        switch (propName) {
            case 'childContextTypes':
                getDescriptor = documentation.getChildContextDescriptor;
                break;
            case 'contextTypes':
                getDescriptor = documentation.getContextDescriptor;
                break;
            default:
                getDescriptor = documentation.getPropDescriptor;
        }
        amendPropTypes(getDescriptor.bind(documentation), propTypesPath);
    };
}
exports.propTypeHandler = getPropTypeHandler('propTypes');
exports.contextTypeHandler = getPropTypeHandler('contextTypes');
exports.childContextTypeHandler = getPropTypeHandler('childContextTypes');
