"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@babel/types");
const getMemberExpressionRoot_1 = __importDefault(require("../utils/getMemberExpressionRoot"));
const getMembers_1 = __importDefault(require("../utils/getMembers"));
const traverse_1 = require("@babel/traverse");
const traverse_2 = require("./traverse");
const explodedVisitors = traverse_1.visitors.explode({
    Function: { enter: traverse_2.ignore },
    Class: { enter: traverse_2.ignore },
    Loop: { enter: traverse_2.ignore },
    AssignmentExpression(path, state) {
        const left = path.get('left');
        if (left.isMemberExpression()) {
            const first = (0, getMemberExpressionRoot_1.default)(left);
            if (first.isIdentifier() && first.node.name === state.variableName) {
                const [member] = (0, getMembers_1.default)(left);
                if (member &&
                    !member.path.has('computed') &&
                    !member.path.isPrivateName()) {
                    const property = (0, types_1.classProperty)(member.path.node, path.node.right, null, null, false, true);
                    state.classDefinition.get('body').unshiftContainer('body', property);
                    path.skip();
                    path.remove();
                }
            }
        }
        else {
            path.skip();
        }
    },
});
/**
 * Given a class definition (i.e. `class` declaration or expression), this
 * function "normalizes" the definition, by looking for assignments of static
 * properties and converting them to ClassProperties.
 *
 * Example:
 *
 * class MyComponent extends React.Component {
 *   // ...
 * }
 * MyComponent.propTypes = { ... };
 *
 * is converted to
 *
 * class MyComponent extends React.Component {
 *   // ...
 *   static propTypes = { ... };
 * }
 */
function normalizeClassDefinition(classDefinition) {
    let variableName;
    if (classDefinition.isClassDeclaration()) {
        // Class declarations may not have an id, e.g.: `export default class extends React.Component {}`
        if (classDefinition.node.id) {
            variableName = classDefinition.node.id.name;
        }
    }
    else if (classDefinition.isClassExpression()) {
        let parentPath = classDefinition.parentPath;
        while (parentPath &&
            parentPath.node !== classDefinition.scope.block &&
            !parentPath.isBlockStatement()) {
            if (parentPath.isVariableDeclarator()) {
                const idPath = parentPath.get('id');
                if (idPath.isIdentifier()) {
                    variableName = idPath.node.name;
                    break;
                }
            }
            else if (parentPath.isAssignmentExpression()) {
                const leftPath = parentPath.get('left');
                if (leftPath.isIdentifier()) {
                    variableName = leftPath.node.name;
                    break;
                }
            }
            parentPath = parentPath.parentPath;
        }
    }
    if (!variableName) {
        return;
    }
    const state = {
        variableName,
        classDefinition,
    };
    classDefinition.parentPath.scope.path.traverse(explodedVisitors, state);
}
exports.default = normalizeClassDefinition;
