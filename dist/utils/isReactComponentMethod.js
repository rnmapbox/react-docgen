"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getPropertyName_1 = __importDefault(require("./getPropertyName"));
const componentMethods = [
    'componentDidMount',
    'componentDidReceiveProps',
    'componentDidUpdate',
    'componentWillMount',
    'UNSAFE_componentWillMount',
    'componentWillReceiveProps',
    'UNSAFE_componentWillReceiveProps',
    'componentWillUnmount',
    'componentWillUpdate',
    'UNSAFE_componentWillUpdate',
    'getChildContext',
    'getDefaultProps',
    'getInitialState',
    'render',
    'shouldComponentUpdate',
    'getDerivedStateFromProps',
    'getDerivedStateFromError',
    'getSnapshotBeforeUpdate',
    'componentDidCatch',
];
/**
 * Returns if the method path is a Component method.
 */
function default_1(methodPath) {
    if (!methodPath.isClassMethod() && !methodPath.isObjectMethod()) {
        return false;
    }
    const name = (0, getPropertyName_1.default)(methodPath);
    return Boolean(name && componentMethods.indexOf(name) !== -1);
}
exports.default = default_1;
