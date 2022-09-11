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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _FileState_importer;
Object.defineProperty(exports, "__esModule", { value: true });
const traverse_1 = __importStar(require("@babel/traverse"));
const babelParser_1 = __importDefault(require("./babelParser"));
class FileState {
    constructor(options, { code, ast, importer }) {
        _FileState_importer.set(this, void 0);
        this.hub = {
            // keep it for the usage in babel-core, ex: path.hub.file.opts.filename
            file: this,
            parse: this.parse.bind(this),
            import: this.import.bind(this),
            getCode: () => this.code,
            getScope: () => this.scope,
            addHelper: () => undefined,
            buildError: (node, msg, Error) => {
                const err = new Error(msg);
                err.node = node;
                return err;
            },
        };
        this.opts = options;
        this.code = code;
        this.ast = ast;
        __classPrivateFieldSet(this, _FileState_importer, importer, "f");
        this.path = traverse_1.NodePath.get({
            hub: this.hub,
            parentPath: null,
            parent: this.ast,
            container: this.ast,
            key: 'program',
        }).setContext();
        this.scope = this.path.scope;
    }
    /**
     * Try to resolve and import the ImportPath with the `name`
     */
    import(path, name) {
        return __classPrivateFieldGet(this, _FileState_importer, "f").call(this, path, name, this);
    }
    /**
     * Parse the content of a new file
     * The `filename` is required so that potential imports inside the content can be correctly resolved and
     * the correct babel config file could be loaded. `filename` needs to be an absolute path.
     */
    parse(code, filename) {
        const newOptions = { ...this.opts, filename };
        // We need to build a new parser, because there might be a new
        // babel config file in effect, so we need to load it
        const ast = (0, babelParser_1.default)(code, newOptions);
        return new FileState(newOptions, {
            ast,
            code,
            importer: __classPrivateFieldGet(this, _FileState_importer, "f"),
        });
    }
    /**
     * Traverse the current file
     */
    traverse(visitors, state) {
        (0, traverse_1.default)(this.ast, visitors, this.scope, state);
    }
}
exports.default = FileState;
_FileState_importer = new WeakMap();
