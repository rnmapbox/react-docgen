"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getMemberValuePath_1 = __importDefault(require("../utils/getMemberValuePath"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
const setPropDescription_1 = __importDefault(require("../utils/setPropDescription"));
function resolveDocumentation(documentation, path) {
    if (!path.isObjectExpression()) {
        return;
    }
    path.get('properties').forEach(propertyPath => {
        if (propertyPath.isSpreadElement()) {
            const resolvedValuePath = (0, resolveToValue_1.default)(propertyPath.get('argument'));
            resolveDocumentation(documentation, resolvedValuePath);
        }
        else if (propertyPath.isObjectProperty() ||
            propertyPath.isObjectMethod()) {
            (0, setPropDescription_1.default)(documentation, propertyPath);
        }
    });
}
const propDocBlockHandler = function (documentation, componentDefinition) {
    let propTypesPath = (0, getMemberValuePath_1.default)(componentDefinition, 'propTypes');
    if (!propTypesPath) {
        return;
    }
    propTypesPath = (0, resolveToValue_1.default)(propTypesPath);
    if (!propTypesPath) {
        return;
    }
    resolveDocumentation(documentation, propTypesPath);
};
exports.default = propDocBlockHandler;
