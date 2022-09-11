import type { NodePath } from '@babel/traverse';
import type Documentation from '../Documentation';
import type { ObjectMethod, ObjectProperty, ObjectTypeProperty, TSPropertySignature } from '@babel/types';
export default function setPropDescription(documentation: Documentation, propertyPath: NodePath<ObjectMethod | ObjectProperty | ObjectTypeProperty | TSPropertySignature>): void;
