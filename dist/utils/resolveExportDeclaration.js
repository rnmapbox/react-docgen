"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
function resolveExportDeclaration(path) {
    const definitions = [];
    if (path.isExportDefaultDeclaration()) {
        definitions.push(path.get('declaration'));
    }
    else if (path.isExportNamedDeclaration()) {
        if (path.has('declaration')) {
            const declaration = path.get('declaration');
            if (declaration.isVariableDeclaration()) {
                declaration
                    .get('declarations')
                    .forEach(declarator => definitions.push(declarator));
            }
            else if (declaration.isDeclaration()) {
                definitions.push(declaration);
            }
        }
        else if (path.has('specifiers')) {
            path
                .get('specifiers')
                .forEach(specifier => definitions.push(specifier.get('local')));
        }
    }
    return definitions.map(definition => (0, resolveToValue_1.default)(definition));
}
exports.default = resolveExportDeclaration;
