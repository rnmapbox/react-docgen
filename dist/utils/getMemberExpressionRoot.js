"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns the path to the first part of the MemberExpression. I.e. given a
 * path representing
 *
 * foo.bar.baz
 *
 * it returns the path of/to `foo`.
 */
function getMemberExpressionRoot(memberExpressionPath) {
    let path = memberExpressionPath;
    while (path.isMemberExpression()) {
        path = path.get('object');
    }
    return path;
}
exports.default = getMemberExpressionRoot;
