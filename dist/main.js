"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.utils = exports.importers = exports.resolver = exports.handlers = exports.defaultHandlers = exports.parse = void 0;
const allHandlers = __importStar(require("./handlers"));
exports.handlers = allHandlers;
const parse_1 = __importDefault(require("./parse"));
const allResolvers = __importStar(require("./resolver"));
exports.resolver = allResolvers;
const allImporters = __importStar(require("./importer"));
exports.importers = allImporters;
const utils = __importStar(require("./utils"));
exports.utils = utils;
const config_1 = require("./config");
Object.defineProperty(exports, "defaultHandlers", { enumerable: true, get: function () { return config_1.defaultHandlers; } });
/**
 * Parse the *src* and scan for react components based on the config
 * that gets supplied.
 *
 * The default resolvers look for *exported* react components.
 *
 * By default all handlers are applied, so that all possible
 * different use cases are covered.
 *
 * The default importer is the fs-importer that tries to resolve
 * files based on the nodejs resolve algorithm.
 */
function defaultParse(src, config = {}) {
    const defaultConfig = (0, config_1.createConfig)(config);
    return (0, parse_1.default)(String(src), defaultConfig);
}
exports.parse = defaultParse;
