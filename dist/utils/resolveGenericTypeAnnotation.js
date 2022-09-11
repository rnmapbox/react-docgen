"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const isUnreachableFlowType_1 = __importDefault(require("../utils/isUnreachableFlowType"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
const flowUtilityTypes_1 = require("./flowUtilityTypes");
const getTypeIdentifier_1 = __importDefault(require("./getTypeIdentifier"));
function tryResolveGenericTypeAnnotation(path) {
    let typePath = (0, flowUtilityTypes_1.unwrapUtilityType)(path);
    const idPath = (0, getTypeIdentifier_1.default)(typePath);
    if (idPath) {
        typePath = (0, resolveToValue_1.default)(idPath);
        if ((0, isUnreachableFlowType_1.default)(typePath)) {
            return;
        }
        if (typePath.isTypeAlias()) {
            return tryResolveGenericTypeAnnotation(typePath.get('right'));
        }
        else if (typePath.isTSTypeAliasDeclaration()) {
            return tryResolveGenericTypeAnnotation(typePath.get('typeAnnotation'));
        }
        return typePath;
    }
    return typePath;
}
/**
 * Given an React component (stateless or class) tries to find the
 * flow or ts type for the props. If not found or not one of the supported
 * component types returns undefined.
 */
function resolveGenericTypeAnnotation(path) {
    const typePath = tryResolveGenericTypeAnnotation(path);
    if (!typePath || typePath === path)
        return;
    return typePath;
}
exports.default = resolveGenericTypeAnnotation;
