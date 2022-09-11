"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns true of the path is an unreachable TypePath
 */
exports.default = (path) => {
    return (path.isIdentifier() || path.isImportDeclaration() || path.isCallExpression());
};
