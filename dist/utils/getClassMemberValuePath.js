"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getNameOrValue_1 = __importDefault(require("./getNameOrValue"));
function getClassMemberValuePath(classDefinition, memberName) {
    const classMember = classDefinition
        .get('body')
        .get('body')
        .find(memberPath => {
        if ((memberPath.isClassMethod() && memberPath.node.kind !== 'set') ||
            memberPath.isClassProperty()) {
            const key = memberPath.get('key');
            return ((!memberPath.node.computed || key.isLiteral()) &&
                (0, getNameOrValue_1.default)(key) === memberName);
        }
        return false;
    });
    if (classMember) {
        // For ClassProperty we return the value and for ClassMethod
        // we return itself
        return classMember.isClassMethod()
            ? classMember
            : classMember.get('value');
    }
    return null;
}
exports.default = getClassMemberValuePath;
