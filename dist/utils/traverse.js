"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowIgnoreVisitors = exports.ignore = void 0;
function ignore(path) {
    path.skip();
}
exports.ignore = ignore;
exports.shallowIgnoreVisitors = {
    FunctionDeclaration: { enter: ignore },
    FunctionExpression: { enter: ignore },
    Class: { enter: ignore },
    IfStatement: { enter: ignore },
    WithStatement: { enter: ignore },
    SwitchStatement: { enter: ignore },
    CatchClause: { enter: ignore },
    Loop: { enter: ignore },
    ExportNamedDeclaration: { enter: ignore },
    ExportDefaultDeclaration: { enter: ignore },
    ConditionalExpression: { enter: ignore },
};
