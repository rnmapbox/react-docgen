"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const printValue_1 = __importDefault(require("./printValue"));
function getParameterName(parameterPath) {
    if (parameterPath.isIdentifier()) {
        return parameterPath.node.name;
    }
    else if (parameterPath.isAssignmentPattern()) {
        return getParameterName(parameterPath.get('left'));
    }
    else if (parameterPath.isObjectPattern() ||
        parameterPath.isArrayPattern()) {
        return (0, printValue_1.default)(parameterPath);
    }
    else if (parameterPath.isRestElement()) {
        return `...${getParameterName(parameterPath.get('argument'))}`;
    }
    else if (parameterPath.isTSParameterProperty()) {
        return getParameterName(parameterPath.get('parameter'));
    }
    throw new TypeError('Parameter name must be one of Identifier, AssignmentPattern, ArrayPattern, ' +
        `ObjectPattern or RestElement, instead got ${parameterPath.node.type}`);
}
exports.default = getParameterName;
