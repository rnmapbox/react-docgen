"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const traverse_1 = require("../utils/traverse");
const resolve_1 = __importDefault(require("resolve"));
const node_path_1 = require("node:path");
const node_fs_1 = __importDefault(require("node:fs"));
const traverse_2 = require("@babel/traverse");
const utils_1 = require("../utils");
function defaultLookupModule(filename, basedir) {
    return resolve_1.default.sync(filename, {
        basedir,
        extensions: ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
    });
}
// Factory for the resolveImports importer
function makeFsImporter(lookupModule = defaultLookupModule, cache = new Map()) {
    function resolveImportedValue(path, name, file, seen = new Set()) {
        // Bail if no filename was provided for the current source file.
        // Also never traverse into react itself.
        const source = path.node.source?.value;
        const { filename } = file.opts;
        if (!source || !filename || source === 'react') {
            return null;
        }
        // Resolve the imported module using the Node resolver
        const basedir = (0, node_path_1.dirname)(filename);
        let resolvedSource;
        try {
            resolvedSource = lookupModule(source, basedir);
        }
        catch (err) {
            return null;
        }
        // Prevent recursive imports
        if (seen.has(resolvedSource)) {
            return null;
        }
        seen.add(resolvedSource);
        let nextFile = cache.get(resolvedSource);
        if (!nextFile) {
            // Read and parse the code
            const src = node_fs_1.default.readFileSync(resolvedSource, 'utf8');
            nextFile = file.parse(src, resolvedSource);
            cache.set(resolvedSource, nextFile);
        }
        return findExportedValue(nextFile, name, seen);
    }
    const explodedVisitors = traverse_2.visitors.explode({
        ...traverse_1.shallowIgnoreVisitors,
        ExportNamedDeclaration: {
            enter: function (path, state) {
                const { file, name, seen } = state;
                const declaration = path.get('declaration');
                // export const/var ...
                if (declaration.hasNode() && declaration.isVariableDeclaration()) {
                    for (const declPath of declaration.get('declarations')) {
                        const id = declPath.get('id');
                        const init = declPath.get('init');
                        if (id.isIdentifier() && id.node.name === name && init.hasNode()) {
                            // export const/var a = <init>
                            state.resultPath = init;
                            break;
                        }
                        else if (id.isObjectPattern()) {
                            // export const/var { a } = <init>
                            state.resultPath = id.get('properties').find(prop => {
                                if (prop.isObjectProperty()) {
                                    const value = prop.get('value');
                                    return value.isIdentifier() && value.node.name === name;
                                }
                                // We don't handle RestElement here yet as complicated
                                return false;
                            });
                            if (state.resultPath) {
                                state.resultPath = (0, utils_1.resolveObjectPatternPropertyToValue)(state.resultPath);
                                break;
                            }
                        }
                        // ArrayPattern not handled yet
                    }
                }
                else if (declaration.hasNode() &&
                    declaration.has('id') &&
                    declaration.get('id').isIdentifier() &&
                    declaration.get('id').node.name === name) {
                    // export function/class/type/interface/enum ...
                    state.resultPath = declaration;
                }
                else if (path.has('specifiers')) {
                    // export { ... } or export x from ... or export * as x from ...
                    for (const specifierPath of path.get('specifiers')) {
                        if (specifierPath.isExportNamespaceSpecifier()) {
                            continue;
                        }
                        const exported = specifierPath.get('exported');
                        if (exported.isIdentifier() && exported.node.name === name) {
                            // export ... from ''
                            if (path.has('source')) {
                                const local = specifierPath.isExportSpecifier()
                                    ? specifierPath.node.local.name
                                    : 'default';
                                state.resultPath = resolveImportedValue(path, local, file, seen);
                                if (state.resultPath) {
                                    break;
                                }
                            }
                            else {
                                state.resultPath = specifierPath.get('local');
                                break;
                            }
                        }
                    }
                }
                state.resultPath ? path.stop() : path.skip();
            },
        },
        ExportDefaultDeclaration: {
            enter: function (path, state) {
                const { name } = state;
                if (name === 'default') {
                    state.resultPath = path.get('declaration');
                    return path.stop();
                }
                path.skip();
            },
        },
        ExportAllDeclaration: {
            enter: function (path, state) {
                const { name, file, seen } = state;
                const resolvedPath = resolveImportedValue(path, name, file, seen);
                if (resolvedPath) {
                    state.resultPath = resolvedPath;
                    return path.stop();
                }
                path.skip();
            },
        },
    });
    // Traverses the program looking for an export that matches the requested name
    function findExportedValue(file, name, seen) {
        const state = {
            file,
            name,
            seen,
        };
        file.traverse(explodedVisitors, state);
        return state.resultPath || null;
    }
    return resolveImportedValue;
}
exports.default = makeFsImporter;
