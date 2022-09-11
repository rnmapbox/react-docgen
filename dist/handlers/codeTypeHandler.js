"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const flowUtilityTypes_1 = require("../utils/flowUtilityTypes");
const getFlowType_1 = __importDefault(require("../utils/getFlowType"));
const getTypeFromReactComponent_1 = __importStar(require("../utils/getTypeFromReactComponent"));
const getPropertyName_1 = __importDefault(require("../utils/getPropertyName"));
const getTSType_1 = __importDefault(require("../utils/getTSType"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
const setPropDescription_1 = __importDefault(require("../utils/setPropDescription"));
function setPropDescriptor(documentation, path, typeParams) {
    if (path.isObjectTypeSpreadProperty()) {
        const argument = (0, flowUtilityTypes_1.unwrapUtilityType)(path.get('argument'));
        if (argument.isObjectTypeAnnotation()) {
            (0, getTypeFromReactComponent_1.applyToTypeProperties)(documentation, argument, (propertyPath, innerTypeParams) => {
                setPropDescriptor(documentation, propertyPath, innerTypeParams);
            }, typeParams);
            return;
        }
        // TODO what about other types here
        const id = argument.get('id');
        if (!id.hasNode() || !id.isIdentifier()) {
            return;
        }
        const resolvedPath = (0, resolveToValue_1.default)(id);
        if (resolvedPath.isTypeAlias()) {
            const right = resolvedPath.get('right');
            (0, getTypeFromReactComponent_1.applyToTypeProperties)(documentation, right, (propertyPath, innerTypeParams) => {
                setPropDescriptor(documentation, propertyPath, innerTypeParams);
            }, typeParams);
        }
        else if (!argument.has('typeParameters')) {
            documentation.addComposes(id.node.name);
        }
    }
    else if (path.isObjectTypeProperty()) {
        const type = (0, getFlowType_1.default)(path.get('value'), typeParams);
        const propName = (0, getPropertyName_1.default)(path);
        if (!propName)
            return;
        const propDescriptor = documentation.getPropDescriptor(propName);
        propDescriptor.required = !path.node.optional;
        propDescriptor.flowType = type;
        // We are doing this here instead of in a different handler
        // to not need to duplicate the logic for checking for
        // imported types that are spread in to props.
        (0, setPropDescription_1.default)(documentation, path);
    }
    else if (path.isTSPropertySignature()) {
        const typeAnnotation = path.get('typeAnnotation');
        if (!typeAnnotation.hasNode()) {
            return;
        }
        const type = (0, getTSType_1.default)(typeAnnotation, typeParams);
        const propName = (0, getPropertyName_1.default)(path);
        if (!propName)
            return;
        const propDescriptor = documentation.getPropDescriptor(propName);
        propDescriptor.required = !path.node.optional;
        propDescriptor.tsType = type;
        // We are doing this here instead of in a different handler
        // to not need to duplicate the logic for checking for
        // imported types that are spread in to props.
        (0, setPropDescription_1.default)(documentation, path);
    }
}
/**
 * This handler tries to find flow Type annotated react components and extract
 * its types to the documentation. It also extracts docblock comments which are
 * inlined in the type definition.
 */
const codeTypeHandler = function (documentation, componentDefinition) {
    const typesPath = (0, getTypeFromReactComponent_1.default)(componentDefinition);
    if (!typesPath) {
        return;
    }
    (0, getTypeFromReactComponent_1.applyToTypeProperties)(documentation, typesPath, (propertyPath, typeParams) => {
        setPropDescriptor(documentation, propertyPath, typeParams);
    }, null);
};
exports.default = codeTypeHandler;
