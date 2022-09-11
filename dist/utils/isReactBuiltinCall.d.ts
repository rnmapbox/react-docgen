import type { NodePath } from '@babel/traverse';
/**
 * Returns true if the expression is a function call of the form
 * `React.foo(...)`.
 */
export default function isReactBuiltinCall(path: NodePath, name: string): boolean;
