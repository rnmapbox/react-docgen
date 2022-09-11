"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getPropertyValuePath_1 = __importDefault(require("./getPropertyValuePath"));
const isReactCreateElementCall_1 = __importDefault(require("./isReactCreateElementCall"));
const isReactCloneElementCall_1 = __importDefault(require("./isReactCloneElementCall"));
const isReactChildrenElementCall_1 = __importDefault(require("./isReactChildrenElementCall"));
const resolveToValue_1 = __importDefault(require("./resolveToValue"));
const traverse_1 = require("@babel/traverse");
const traverse_2 = require("./traverse");
const validPossibleStatelessComponentTypes = [
    'ArrowFunctionExpression',
    'FunctionDeclaration',
    'FunctionExpression',
    'ObjectMethod',
];
function isJSXElementOrReactCall(path) {
    return (path.isJSXElement() ||
        path.isJSXFragment() ||
        (path.isCallExpression() &&
            ((0, isReactCreateElementCall_1.default)(path) ||
                (0, isReactCloneElementCall_1.default)(path) ||
                (0, isReactChildrenElementCall_1.default)(path))));
}
function resolvesToJSXElementOrReactCall(path, seen) {
    // avoid returns with recursive function calls
    if (seen.has(path)) {
        return false;
    }
    seen.add(path);
    // Is the path is already a JSX element or a call to one of the React.* functions
    if (isJSXElementOrReactCall(path)) {
        return true;
    }
    const resolvedPath = (0, resolveToValue_1.default)(path);
    // If the path points to a conditional expression, then we need to look only at
    // the two possible paths
    if (resolvedPath.isConditionalExpression()) {
        return (resolvesToJSXElementOrReactCall(resolvedPath.get('consequent'), seen) ||
            resolvesToJSXElementOrReactCall(resolvedPath.get('alternate'), seen));
    }
    // If the path points to a logical expression (AND, OR, ...), then we need to look only at
    // the two possible paths
    if (resolvedPath.isLogicalExpression()) {
        return (resolvesToJSXElementOrReactCall(resolvedPath.get('left'), seen) || resolvesToJSXElementOrReactCall(resolvedPath.get('right'), seen));
    }
    // Is the resolved path is already a JSX element or a call to one of the React.* functions
    // Only do this if the resolvedPath actually resolved something as otherwise we did this check already
    if (resolvedPath !== path && isJSXElementOrReactCall(resolvedPath)) {
        return true;
    }
    // If we have a call expression, lets try to follow it
    if (resolvedPath.isCallExpression()) {
        let calleeValue = (0, resolveToValue_1.default)(resolvedPath.get('callee'));
        if (returnsJSXElementOrReactCall(calleeValue, seen)) {
            return true;
        }
        if (calleeValue.isMemberExpression()) {
            let resolvedValue;
            const namesToResolve = [];
            const calleeObj = calleeValue.get('object');
            if (calleeObj.isIdentifier()) {
                namesToResolve.push(calleeValue.get('property'));
                resolvedValue = (0, resolveToValue_1.default)(calleeObj);
            }
            else {
                do {
                    namesToResolve.unshift(calleeValue.get('property'));
                    calleeValue = calleeValue.get('object');
                } while (calleeValue.isMemberExpression());
                resolvedValue = (0, resolveToValue_1.default)(calleeValue);
            }
            if (resolvedValue && resolvedValue.isObjectExpression()) {
                const resolvedMemberExpression = namesToResolve.reduce((result, nodePath) => {
                    if (result) {
                        if ((!nodePath.isIdentifier() && !nodePath.isStringLiteral()) ||
                            !result.isObjectExpression()) {
                            return null;
                        }
                        result = (0, getPropertyValuePath_1.default)(result, nodePath.isIdentifier()
                            ? nodePath.node.name
                            : nodePath.node.value);
                        if (result && result.isIdentifier()) {
                            return (0, resolveToValue_1.default)(result);
                        }
                    }
                    return result;
                }, resolvedValue);
                if (!resolvedMemberExpression ||
                    returnsJSXElementOrReactCall(resolvedMemberExpression, seen)) {
                    return true;
                }
            }
        }
    }
    return false;
}
const explodedVisitors = traverse_1.visitors.explode({
    Function: { enter: traverse_2.ignore },
    Class: { enter: traverse_2.ignore },
    ObjectExpression: { enter: traverse_2.ignore },
    ReturnStatement: {
        enter: function (path, state) {
            // Only check return statements which are part of the checked function scope
            if (path.scope.getFunctionParent() !== state.initialScope) {
                path.skip();
                return;
            }
            if (path.node.argument &&
                resolvesToJSXElementOrReactCall(path.get('argument'), state.seen)) {
                state.isStatelessComponent = true;
                path.stop();
            }
        },
    },
});
function returnsJSXElementOrReactCall(path, seen = new WeakSet()) {
    if (path.isObjectProperty()) {
        path = path.get('value');
    }
    if (!path.isFunction()) {
        return false;
    }
    // early exit for ArrowFunctionExpressions
    if (path.isArrowFunctionExpression() &&
        !path.get('body').isBlockStatement() &&
        resolvesToJSXElementOrReactCall(path.get('body'), seen)) {
        return true;
    }
    const state = {
        initialScope: path.scope,
        isStatelessComponent: false,
        seen,
    };
    path.traverse(explodedVisitors, state);
    return state.isStatelessComponent;
}
/**
 * Returns `true` if the path represents a function which returns a JSXElement
 */
function isStatelessComponent(path) {
    if (!path.inType(...validPossibleStatelessComponentTypes)) {
        return false;
    }
    return returnsJSXElementOrReactCall(path);
}
exports.default = isStatelessComponent;
