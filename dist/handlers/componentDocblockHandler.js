"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const docblock_1 = require("../utils/docblock");
const isReactForwardRefCall_1 = __importDefault(require("../utils/isReactForwardRefCall"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
function getDocblockFromComponent(path) {
    let description = null;
    if (path.isClassDeclaration() || path.isClassExpression()) {
        // If we have a class declaration or expression, then the comment might be
        // attached to the last decorator instead as trailing comment.
        if (path.node.decorators && path.node.decorators.length > 0) {
            description = (0, docblock_1.getDocblock)(path.get('decorators')[path.node.decorators.length - 1], true);
        }
    }
    if (description == null) {
        // Find parent statement (e.g. var Component = React.createClass(<path>);)
        let searchPath = path;
        while (searchPath && !searchPath.isStatement()) {
            searchPath = searchPath.parentPath;
        }
        if (searchPath) {
            // If the parent is an export statement, we have to traverse one more up
            if (searchPath.parentPath.isExportNamedDeclaration() ||
                searchPath.parentPath.isExportDefaultDeclaration()) {
                searchPath = searchPath.parentPath;
            }
            description = (0, docblock_1.getDocblock)(searchPath);
        }
    }
    if (!description) {
        const searchPath = (0, isReactForwardRefCall_1.default)(path)
            ? path.get('arguments')[0]
            : path;
        const inner = (0, resolveToValue_1.default)(searchPath);
        if (inner.node !== path.node) {
            return getDocblockFromComponent(inner);
        }
    }
    return description;
}
/**
 * Finds the nearest block comment before the component definition.
 */
const componentDocblockHandler = function (documentation, componentDefinition) {
    documentation.set('description', getDocblockFromComponent(componentDefinition) || '');
};
exports.default = componentDocblockHandler;
