"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@babel/core");
const node_path_1 = require("node:path");
const TYPESCRIPT_EXTS = {
    '.cts': true,
    '.mts': true,
    '.ts': true,
    '.tsx': true,
};
function getDefaultPlugins(options) {
    return [
        'jsx',
        TYPESCRIPT_EXTS[(0, node_path_1.extname)(options.filename || '')] ? 'typescript' : 'flow',
        'asyncDoExpressions',
        'decimal',
        ['decorators', { decoratorsBeforeExport: false }],
        'decoratorAutoAccessors',
        'destructuringPrivate',
        'doExpressions',
        'exportDefaultFrom',
        'functionBind',
        'importAssertions',
        'moduleBlocks',
        'partialApplication',
        ['pipelineOperator', { proposal: 'minimal' }],
        ['recordAndTuple', { syntaxType: 'bar' }],
        'regexpUnicodeSets',
        'throwExpressions',
    ];
}
function buildPluginList(options) {
    let plugins = [];
    if (options.parserOpts?.plugins) {
        plugins = [...options.parserOpts.plugins];
    }
    // Let's check if babel finds a config file for this source file
    // If babel does find a config file we do not apply our defaults
    const partialConfig = (0, core_1.loadPartialConfig)(options);
    if (plugins.length === 0 &&
        partialConfig &&
        !partialConfig.hasFilesystemConfig()) {
        plugins = getDefaultPlugins(options);
    }
    // Ensure that the estree plugin is never active
    // TODO add test
    return plugins.filter(plugin => plugin !== 'estree');
}
function buildParserOptions(options) {
    const plugins = buildPluginList(options);
    return {
        sourceType: 'unambiguous',
        ...(options.parserOpts || {}),
        plugins,
        tokens: false,
    };
}
function babelParser(src, options = {}) {
    const parserOpts = buildParserOptions(options);
    const opts = {
        ...options,
        parserOpts,
    };
    const ast = (0, core_1.parseSync)(src, opts);
    if (!ast) {
        throw new Error('Unable to parse source code.');
    }
    return ast;
}
exports.default = babelParser;
