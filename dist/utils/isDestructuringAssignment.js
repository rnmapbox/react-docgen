"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Checks if the input Identifier is part of a destructuring Assignment
 * and the name of the property key matches the input name
 */
function isDestructuringAssignment(path, name) {
    if (!path.isObjectProperty()) {
        return false;
    }
    const id = path.get('key');
    return (id.isIdentifier() &&
        id.node.name === name &&
        path.parentPath.isObjectPattern());
}
exports.default = isDestructuringAssignment;
