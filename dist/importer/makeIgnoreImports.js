"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ignoreImports = function () {
    return null;
};
// Needs to be a factory because it has to be the exact same API as makeFsImport as
// we replace makeFsImport in browsers with this file
exports.default = () => ignoreImports;
