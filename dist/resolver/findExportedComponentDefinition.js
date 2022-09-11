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
const isExportsOrModuleAssignment_1 = __importDefault(require("../utils/isExportsOrModuleAssignment"));
const resolveExportDeclaration_1 = __importDefault(require("../utils/resolveExportDeclaration"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
const resolveHOC_1 = __importDefault(require("../utils/resolveHOC"));
const traverse_1 = require("@babel/traverse");
const traverse_2 = require("../utils/traverse");
const resolveComponentDefinition_1 = __importStar(require("../utils/resolveComponentDefinition"));
const ERROR_MULTIPLE_DEFINITIONS = 'Multiple exported component definitions found.';
function exportDeclaration(path, state) {
    const definitions = (0, resolveExportDeclaration_1.default)(path).reduce((acc, definition) => {
        if ((0, resolveComponentDefinition_1.isComponentDefinition)(definition)) {
            acc.push(definition);
        }
        else {
            const resolved = (0, resolveToValue_1.default)((0, resolveHOC_1.default)(definition));
            if ((0, resolveComponentDefinition_1.isComponentDefinition)(resolved)) {
                acc.push(resolved);
            }
        }
        return acc;
    }, []);
    if (definitions.length === 0) {
        return path.skip();
    }
    if (definitions.length > 1 || state.foundDefinition) {
        // If a file exports multiple components, ... complain!
        throw new Error(ERROR_MULTIPLE_DEFINITIONS);
    }
    const definition = (0, resolveComponentDefinition_1.default)(definitions[0]);
    if (definition) {
        state.foundDefinition = definition;
    }
    return path.skip();
}
const explodedVisitors = traverse_1.visitors.explode({
    ...traverse_2.shallowIgnoreVisitors,
    ExportNamedDeclaration: { enter: exportDeclaration },
    ExportDefaultDeclaration: { enter: exportDeclaration },
    AssignmentExpression: {
        enter: function (path, state) {
            // Ignore anything that is not `exports.X = ...;` or
            // `module.exports = ...;`
            if (!(0, isExportsOrModuleAssignment_1.default)(path)) {
                return path.skip();
            }
            // Resolve the value of the right hand side. It should resolve to a call
            // expression, something like React.createClass
            let resolvedPath = (0, resolveToValue_1.default)(path.get('right'));
            if (!(0, resolveComponentDefinition_1.isComponentDefinition)(resolvedPath)) {
                resolvedPath = (0, resolveToValue_1.default)((0, resolveHOC_1.default)(resolvedPath));
                if (!(0, resolveComponentDefinition_1.isComponentDefinition)(resolvedPath)) {
                    return path.skip();
                }
            }
            if (state.foundDefinition) {
                // If a file exports multiple components, ... complain!
                throw new Error(ERROR_MULTIPLE_DEFINITIONS);
            }
            const definition = (0, resolveComponentDefinition_1.default)(resolvedPath);
            if (definition) {
                state.foundDefinition = definition;
            }
            return path.skip();
        },
    },
});
/**
 * Given an AST, this function tries to find the exported component definition.
 *
 * The component definition is either the ObjectExpression passed to
 * `React.createClass` or a `class` definition extending `React.Component` or
 * having a `render()` method.
 *
 * If a definition is part of the following statements, it is considered to be
 * exported:
 *
 * modules.exports = Definition;
 * exports.foo = Definition;
 * export default Definition;
 * export var Definition = ...;
 */
const findExportedComponentDefinition = function (file) {
    const state = {
        foundDefinition: null,
    };
    file.traverse(explodedVisitors, state);
    if (state.foundDefinition) {
        return [state.foundDefinition];
    }
    return [];
};
exports.default = findExportedComponentDefinition;
