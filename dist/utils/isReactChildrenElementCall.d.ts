import type { NodePath } from '@babel/traverse';
/**
 * Returns true if the expression is a function call of the form
 * `React.Children.only(...)`.
 */
export default function isReactChildrenElementCall(path: NodePath): boolean;
