"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Gets the most inner valuable TypeAnnotation from path. If no TypeAnnotation
 * can be found null is returned
 */
function getTypeAnnotation(path) {
    if (!path.has('typeAnnotation'))
        return null;
    let resultPath = path;
    do {
        resultPath = resultPath.get('typeAnnotation');
    } while (resultPath.has('typeAnnotation') &&
        !resultPath.isFlowType() &&
        !resultPath.isTSType());
    // @ts-ignore
    return resultPath;
}
exports.default = getTypeAnnotation;
