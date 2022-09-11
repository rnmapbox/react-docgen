import type { NodePath } from '@babel/traverse';
/**
 * Returns true if the expression is a function call of the form
 * `React.forwardRef(...)`.
 */
export default function isReactForwardRefCall(path: NodePath): boolean;
