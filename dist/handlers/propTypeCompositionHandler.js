"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getMemberValuePath_1 = __importDefault(require("../utils/getMemberValuePath"));
const resolveToModule_1 = __importDefault(require("../utils/resolveToModule"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
/**
 * It resolves the path to its module name and adds it to the "composes" entry
 * in the documentation.
 */
function amendComposes(documentation, path) {
    const moduleName = (0, resolveToModule_1.default)(path);
    if (moduleName) {
        documentation.addComposes(moduleName);
    }
}
function processObjectExpression(documentation, path) {
    path.get('properties').forEach(propertyPath => {
        if (propertyPath.isSpreadElement()) {
            amendComposes(documentation, (0, resolveToValue_1.default)(propertyPath.get('argument')));
        }
    });
}
const propTypeCompositionHandler = function (documentation, componentDefinition) {
    let propTypesPath = (0, getMemberValuePath_1.default)(componentDefinition, 'propTypes');
    if (!propTypesPath) {
        return;
    }
    propTypesPath = (0, resolveToValue_1.default)(propTypesPath);
    if (!propTypesPath) {
        return;
    }
    if (propTypesPath.isObjectExpression()) {
        processObjectExpression(documentation, propTypesPath);
        return;
    }
    amendComposes(documentation, propTypesPath);
};
exports.default = propTypeCompositionHandler;
