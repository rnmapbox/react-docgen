import type { Node, NodePath } from '@babel/traverse';
/**
 * Splits a MemberExpression or CallExpression into parts.
 * E.g. foo.bar.baz becomes ['foo', 'bar', 'baz']
 */
declare function toArray(path: NodePath<Node | null>): string[];
/**
 * Creates a string representation of a member expression.
 */
declare function toString(path: NodePath<Node | null>): string;
export { toString as String, toArray as Array };
