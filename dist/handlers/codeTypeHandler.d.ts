import type { Handler } from '.';
/**
 * This handler tries to find flow Type annotated react components and extract
 * its types to the documentation. It also extracts docblock comments which are
 * inlined in the type definition.
 */
declare const codeTypeHandler: Handler;
export default codeTypeHandler;
