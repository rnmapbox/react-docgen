import type { NodePath } from '@babel/traverse';
import type { ComponentNode } from '../resolver';
export declare function isComponentDefinition(path: NodePath): path is NodePath<ComponentNode>;
export default function resolveComponentDefinition(definition: NodePath<ComponentNode>): NodePath<ComponentNode> | null;
