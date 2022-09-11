"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFsImporter = exports.makeIgnoreImports = void 0;
const makeIgnoreImports_1 = __importDefault(require("./makeIgnoreImports"));
exports.makeIgnoreImports = makeIgnoreImports_1.default;
const makeFsImporter_1 = __importDefault(require("./makeFsImporter"));
exports.makeFsImporter = makeFsImporter_1.default;
