import type { NodePath } from '@babel/traverse';
/**
 * Returns `true` if the path represents a function which returns a JSXElement
 */
export default function isStatelessComponent(path: NodePath): boolean;
