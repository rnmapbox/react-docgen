"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConfig = exports.defaultHandlers = void 0;
const handlers_1 = require("./handlers");
const importer_1 = require("./importer");
const resolver_1 = require("./resolver");
const defaultResolver = resolver_1.findExportedComponentDefinition;
const defaultImporter = (0, importer_1.makeFsImporter)();
exports.defaultHandlers = [
    handlers_1.propTypeHandler,
    handlers_1.contextTypeHandler,
    handlers_1.childContextTypeHandler,
    handlers_1.propTypeCompositionHandler,
    handlers_1.propDocBlockHandler,
    handlers_1.codeTypeHandler,
    handlers_1.defaultPropsHandler,
    handlers_1.componentDocblockHandler,
    handlers_1.displayNameHandler,
    handlers_1.componentMethodsHandler,
    handlers_1.componentMethodsJsDocHandler,
];
function createConfig(inputConfig) {
    const { babelOptions, filename, handlers, importer, resolver } = inputConfig;
    const config = {
        babelOptions: { ...babelOptions },
        handlers: handlers ?? exports.defaultHandlers,
        importer: importer ?? defaultImporter,
        resolver: resolver ?? defaultResolver,
    };
    if (filename) {
        config.babelOptions.filename = filename;
    }
    return config;
}
exports.createConfig = createConfig;
