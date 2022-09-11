import type { Resolver } from '.';
/**
 * Given an AST, this function tries to find all object expressions that are
 * passed to `React.createClass` calls, by resolving all references properly.
 */
declare const findAllComponentDefinitions: Resolver;
export default findAllComponentDefinitions;
