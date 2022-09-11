import type { NodePath } from '@babel/traverse';
import type Documentation from '../Documentation';
import type { TypeParameters } from './getTypeParameters';
/**
 * Given an React component (stateless or class) tries to find the
 * flow type for the props. If not found or not one of the supported
 * component types returns null.
 */
declare const _default: (path: NodePath) => NodePath | null;
export default _default;
export declare function applyToTypeProperties(documentation: Documentation, path: NodePath, callback: (propertyPath: NodePath, params: TypeParameters | null) => void, typeParams: TypeParameters | null): void;
