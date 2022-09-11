"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unwrapUtilityType = exports.isSupportedUtilityType = void 0;
/**
 * See `supportedUtilityTypes` for which types are supported and
 * https://flow.org/en/docs/types/utilities/ for which types are available.
 */
function isSupportedUtilityType(path) {
    if (path.isGenericTypeAnnotation()) {
        const idPath = path.get('id');
        if (idPath.isIdentifier()) {
            const name = idPath.node.name;
            return name === '$Exact' || name === '$ReadOnly';
        }
    }
    return false;
}
exports.isSupportedUtilityType = isSupportedUtilityType;
/**
 * Unwraps well known utility types. For example:
 *
 *   $ReadOnly<T> => T
 */
function unwrapUtilityType(path) {
    while (isSupportedUtilityType(path)) {
        path = path.get('typeParameters').get('params')[0];
    }
    return path;
}
exports.unwrapUtilityType = unwrapUtilityType;
