"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const traverse_1 = require("@babel/traverse");
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
const traverse_2 = require("./traverse");
const explodedVisitors = traverse_1.visitors.explode({
    ...traverse_2.shallowIgnoreVisitors,
    Function: { enter: traverse_2.ignore },
    ReturnStatement: {
        enter: function (nodePath, state) {
            const argument = nodePath.get('argument');
            if (argument.hasNode()) {
                state.returnPath = (0, resolveToValue_1.default)(argument);
                return nodePath.stop();
            }
            nodePath.skip();
        },
    },
});
// TODO needs unit test
function resolveFunctionDefinitionToReturnValue(path) {
    const body = path.get('body');
    const state = {};
    body.traverse(explodedVisitors, state);
    return state.returnPath || null;
}
exports.default = resolveFunctionDefinitionToReturnValue;
