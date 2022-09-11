"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getPropertyName_1 = __importDefault(require("./getPropertyName"));
/**
 * Given an ObjectExpression, this function returns the path of the value of
 * the property with name `propertyName`. if the property is an ObjectMethod we
 * return the ObjectMethod itself.
 */
function getPropertyValuePath(path, propertyName) {
    const property = path
        .get('properties')
        .find(propertyPath => !propertyPath.isSpreadElement() &&
        (0, getPropertyName_1.default)(propertyPath) === propertyName);
    if (property) {
        return property.isObjectMethod()
            ? property
            : property.get('value');
    }
    return null;
}
exports.default = getPropertyValuePath;
