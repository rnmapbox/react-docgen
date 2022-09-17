"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyToTypeProperties = void 0;
const getMemberValuePath_1 = __importDefault(require("./getMemberValuePath"));
const getTypeAnnotation_1 = __importDefault(require("./getTypeAnnotation"));
const getTypeParameters_1 = __importDefault(require("./getTypeParameters"));
const isReactComponentClass_1 = __importDefault(require("./isReactComponentClass"));
const isReactForwardRefCall_1 = __importDefault(require("./isReactForwardRefCall"));
const resolveGenericTypeAnnotation_1 = __importDefault(require("./resolveGenericTypeAnnotation"));
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
const getTypeIdentifier_1 = __importDefault(require("./getTypeIdentifier"));
// TODO TESTME
function getStatelessPropsPath(componentDefinition) {
    const value = (0, resolveToValue_1.default)(componentDefinition);
    if ((0, isReactForwardRefCall_1.default)(value)) {
        const inner = (0, resolveToValue_1.default)(value.get('arguments')[0]);
        return inner.get('params')[0];
    }
    return value.get('params')[0];
}
function isInheritedFromHoc(path) {
    const superClass = path.get('superClass');
    if (superClass.isCallExpression()) {
        return true;
    }
    else
        return false;
}
function propTypeFromInheritedHoc(path) {
    const parent = path.get('superClass.arguments')[0];
    if (parent.hasNode()) {
        const typeParam = parent.get('typeParameters.params.0');
        if (!Array.isArray(typeParam) &&
            typeParam.hasNode() &&
            typeParam.isTSTypeReference()) {
            return typeParam;
        }
    }
    return null;
}
/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns null.
 */
exports.default = (path) => {
    let typePath = null;
    if ((0, isReactComponentClass_1.default)(path)) {
        const superTypes = path.get('superTypeParameters');
        if (superTypes.hasNode()) {
            const params = superTypes.get('params');
            typePath = params[params.length === 3 ? 1 : 0];
        }
        else {
            if (isInheritedFromHoc(path)) {
                typePath = propTypeFromInheritedHoc(path);
                if (typePath) {
                    return typePath;
                }
            }
            const propsMemberPath = (0, getMemberValuePath_1.default)(path, 'props');
            if (!propsMemberPath) {
                return null;
            }
            typePath = (0, getTypeAnnotation_1.default)(propsMemberPath.parentPath);
        }
        return typePath;
    }
    const propsParam = getStatelessPropsPath(path);
    if (propsParam) {
        typePath = (0, getTypeAnnotation_1.default)(propsParam);
    }
    return typePath;
};
function applyToTypeProperties(documentation, path, callback, typeParams) {
    if (path.isObjectTypeAnnotation()) {
        path
            .get('properties')
            .forEach(propertyPath => callback(propertyPath, typeParams));
    }
    else if (path.isTSTypeLiteral()) {
        path
            .get('members')
            .forEach(propertyPath => callback(propertyPath, typeParams));
    }
    else if (path.isInterfaceDeclaration()) {
        if (path.node.extends) {
            applyExtends(documentation, path, callback, typeParams);
        }
        path
            .get('body')
            .get('properties')
            .forEach(propertyPath => callback(propertyPath, typeParams));
    }
    else if (path.isTSInterfaceDeclaration()) {
        if (path.node.extends) {
            applyExtends(documentation, path, callback, typeParams);
        }
        path
            .get('body')
            .get('body')
            .forEach(propertyPath => callback(propertyPath, typeParams));
    }
    else if (path.isIntersectionTypeAnnotation() ||
        path.isTSIntersectionType()) {
        path.get('types').forEach(typesPath => applyToTypeProperties(documentation, typesPath, callback, typeParams));
    }
    else if (!path.isUnionTypeAnnotation()) {
        // The react-docgen output format does not currently allow
        // for the expression of union types
        const typePath = (0, resolveGenericTypeAnnotation_1.default)(path);
        if (typePath) {
            applyToTypeProperties(documentation, typePath, callback, typeParams);
        }
    }
}
exports.applyToTypeProperties = applyToTypeProperties;
function applyExtends(documentation, path, callback, typeParams) {
    path.get('extends').forEach(extendsPath => {
        const resolvedPath = (0, resolveGenericTypeAnnotation_1.default)(extendsPath);
        if (resolvedPath) {
            if (resolvedPath.has('typeParameters') &&
                extendsPath.node.typeParameters) {
                typeParams = (0, getTypeParameters_1.default)(resolvedPath.get('typeParameters'), extendsPath.get('typeParameters'), typeParams);
            }
            applyToTypeProperties(documentation, resolvedPath, callback, typeParams);
        }
        else {
            const idPath = (0, getTypeIdentifier_1.default)(extendsPath);
            if (idPath && idPath.isIdentifier()) {
                documentation.addComposes(idPath.node.name);
            }
        }
    });
}
