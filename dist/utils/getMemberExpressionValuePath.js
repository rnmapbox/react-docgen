"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const traverse_1 = require("@babel/traverse");
const getNameOrValue_1 = __importDefault(require("./getNameOrValue"));
const expressionTo_1 = require("./expressionTo");
const isReactForwardRefCall_1 = __importDefault(require("./isReactForwardRefCall"));
function resolveName(path) {
    if (path.isVariableDeclaration()) {
        const declarations = path.get('declarations');
        if (declarations.length > 1) {
            throw new TypeError('Got unsupported VariableDeclaration. VariableDeclaration must only ' +
                'have a single VariableDeclarator. Got ' +
                declarations.length +
                ' declarations.');
        }
        const id = declarations[0].get('id');
        if (id.isIdentifier()) {
            return id.node.name;
        }
        return;
    }
    if (path.isFunctionDeclaration()) {
        const id = path.get('id');
        if (id.isIdentifier()) {
            return id.node.name;
        }
        return;
    }
    if (path.isFunctionExpression() ||
        path.isArrowFunctionExpression() ||
        path.isTaggedTemplateExpression() ||
        path.isCallExpression() ||
        (0, isReactForwardRefCall_1.default)(path)) {
        let currentPath = path;
        while (currentPath.parentPath) {
            if (currentPath.parentPath.isVariableDeclarator()) {
                const id = currentPath.parentPath.get('id');
                if (id.isIdentifier()) {
                    return id.node.name;
                }
                return;
            }
            currentPath = currentPath.parentPath;
        }
        return;
    }
    throw new TypeError('Attempted to resolveName for an unsupported path. resolveName does not accept ' +
        path.node.type +
        '".');
}
const explodedVisitors = traverse_1.visitors.explode({
    AssignmentExpression: {
        enter: function (path, state) {
            const memberPath = path.get('left');
            if (!memberPath.isMemberExpression()) {
                return;
            }
            const property = memberPath.get('property');
            if ((!memberPath.node.computed || property.isLiteral()) &&
                (0, getNameOrValue_1.default)(property) === state.memberName &&
                (0, expressionTo_1.String)(memberPath.get('object')) === state.localName) {
                state.result = path.get('right');
                path.stop();
            }
        },
    },
});
function getMemberExpressionValuePath(variableDefinition, memberName) {
    const localName = resolveName(variableDefinition);
    if (!localName) {
        // likely an immediately exported and therefore nameless/anonymous node
        // passed in
        return null;
    }
    const state = {
        localName,
        memberName,
        result: null,
    };
    variableDefinition.hub.file.traverse(explodedVisitors, state);
    return state.result;
}
exports.default = getMemberExpressionValuePath;
