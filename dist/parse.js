"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_MISSING_DEFINITION = void 0;
const Documentation_1 = __importDefault(require("./Documentation"));
const postProcessDocumentation_1 = __importDefault(require("./utils/postProcessDocumentation"));
const babelParser_1 = __importDefault(require("./babelParser"));
const FileState_1 = __importDefault(require("./FileState"));
const ERROR_MISSING_DEFINITION = 'No suitable component definition found.';
exports.ERROR_MISSING_DEFINITION = ERROR_MISSING_DEFINITION;
function executeHandlers(handlers, componentDefinitions) {
    return componentDefinitions.map((componentDefinition) => {
        const documentation = new Documentation_1.default();
        handlers.forEach(handler => handler(documentation, componentDefinition));
        return (0, postProcessDocumentation_1.default)(documentation.toObject());
    });
}
/**
 * Takes JavaScript source code and returns an object with the information
 * extract from it.
 *
 * `resolver` is a strategy to find the AST node(s) of the component
 * definition(s) inside `src`.
 * It is a function that gets passed the program AST node of
 * the source as first argument, and a reference to the parser as second argument.
 *
 * This allows you define your own strategy for finding component definitions.
 *
 * `handlers` is an array of functions which are passed a reference to the
 * component definitions (extracted by `resolver`) so that they can extract
 * information from it. They get also passed a reference to a `Documentation`
 * object to attach the information to. A reference to the parser is parsed as the
 * last argument.
 */
function parse(code, config) {
    const { babelOptions, handlers, importer, resolver } = config;
    const ast = (0, babelParser_1.default)(code, babelOptions);
    const fileState = new FileState_1.default(babelOptions, {
        ast,
        code,
        importer,
    });
    const componentDefinitions = resolver(fileState);
    if (componentDefinitions.length === 0) {
        throw new Error(ERROR_MISSING_DEFINITION);
    }
    return executeHandlers(handlers, componentDefinitions);
}
exports.default = parse;
