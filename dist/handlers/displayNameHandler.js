"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getMemberValuePath_1 = __importDefault(require("../utils/getMemberValuePath"));
const getNameOrValue_1 = __importDefault(require("../utils/getNameOrValue"));
const isReactForwardRefCall_1 = __importDefault(require("../utils/isReactForwardRefCall"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
const resolveFunctionDefinitionToReturnValue_1 = __importDefault(require("../utils/resolveFunctionDefinitionToReturnValue"));
const displayNameHandler = function (documentation, componentDefinition) {
    let displayNamePath = (0, getMemberValuePath_1.default)(componentDefinition, 'displayName');
    if (!displayNamePath) {
        // Function and class declarations need special treatment. The name of the
        // function / class is the displayName
        if ((componentDefinition.isClassDeclaration() ||
            componentDefinition.isFunctionDeclaration()) &&
            componentDefinition.has('id')) {
            documentation.set('displayName', (0, getNameOrValue_1.default)(componentDefinition.get('id')));
        }
        else if (componentDefinition.isArrowFunctionExpression() ||
            componentDefinition.isFunctionExpression() ||
            (0, isReactForwardRefCall_1.default)(componentDefinition)) {
            let currentPath = componentDefinition;
            while (currentPath.parentPath) {
                if (currentPath.parentPath.isVariableDeclarator()) {
                    documentation.set('displayName', (0, getNameOrValue_1.default)(currentPath.parentPath.get('id')));
                    return;
                }
                else if (currentPath.parentPath.isAssignmentExpression()) {
                    const leftPath = currentPath.parentPath.get('left');
                    if (leftPath.isIdentifier() || leftPath.isLiteral()) {
                        documentation.set('displayName', (0, getNameOrValue_1.default)(leftPath));
                        return;
                    }
                }
                currentPath = currentPath.parentPath;
            }
        }
        return;
    }
    displayNamePath = (0, resolveToValue_1.default)(displayNamePath);
    // If display name is defined as function somehow (getter, property with function)
    // we resolve the return value of the function
    if (displayNamePath.isFunction()) {
        displayNamePath = (0, resolveFunctionDefinitionToReturnValue_1.default)(displayNamePath);
    }
    if (!displayNamePath ||
        (!displayNamePath.isStringLiteral() && !displayNamePath.isNumericLiteral())) {
        return;
    }
    documentation.set('displayName', displayNamePath.node.value);
};
exports.default = displayNameHandler;
