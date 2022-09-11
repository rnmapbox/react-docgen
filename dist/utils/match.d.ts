import type { Node } from '@babel/traverse';
declare type Pattern = {
    [key: string]: Pattern | number | string;
};
/**
 * This function takes an AST node and matches it against "pattern". Pattern
 * is simply a (nested) object literal and it is traversed to see whether node
 * contains those (nested) properties with the provided values.
 */
export default function match(node: Node, pattern: Pattern): boolean;
export {};
