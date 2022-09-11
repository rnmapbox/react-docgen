import type { Node, NodePath } from '@babel/traverse';
/**
 * Returns true of the prop is required, according to its type definition
 */
export default function isRequiredPropType(path: NodePath<Node>): boolean;
