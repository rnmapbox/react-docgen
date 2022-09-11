export interface DocumentationObject {
    props?: Record<string, PropDescriptor>;
    context?: Record<string, PropDescriptor>;
    childContext?: Record<string, PropDescriptor>;
    composes?: string[];
    methods?: MethodDescriptor[];
}
export interface MethodParameter {
    name: string;
    type?: TypeDescriptor<FunctionSignatureType> | null;
    optional: boolean;
}
export interface MethodReturn {
    type: TypeDescriptor<FunctionSignatureType> | undefined;
}
export declare type MethodModifier = 'async' | 'generator' | 'get' | 'set' | 'static';
export interface MethodDescriptor {
    name: string;
    description?: string | null;
    docblock: string | null;
    modifiers: MethodModifier[];
    params: MethodParameter[];
    returns: MethodReturn | null;
}
export interface PropTypeDescriptor {
    name: 'any' | 'array' | 'arrayOf' | 'bool' | 'custom' | 'element' | 'elementType' | 'enum' | 'exact' | 'func' | 'instanceOf' | 'node' | 'number' | 'object' | 'objectOf' | 'shape' | 'string' | 'symbol' | 'union';
    value?: unknown;
    raw?: string;
    computed?: boolean;
    description?: string;
    required?: boolean;
}
export interface DefaultValueDescriptor {
    value: unknown;
    computed: boolean;
}
export interface BaseType {
    required?: boolean;
    nullable?: boolean;
    alias?: string;
}
export interface SimpleType extends BaseType {
    name: string;
    raw?: string;
}
export interface LiteralType extends BaseType {
    name: 'literal';
    value: string;
}
export interface ElementsType<T = FunctionSignatureType> extends BaseType {
    name: string;
    raw: string;
    elements: Array<TypeDescriptor<T>>;
}
export interface FunctionArgumentType<T> {
    name: string;
    type?: TypeDescriptor<T>;
    rest?: boolean;
}
export interface FunctionSignatureType extends BaseType {
    name: 'signature';
    type: 'function';
    raw: string;
    signature: {
        arguments: Array<FunctionArgumentType<FunctionSignatureType>>;
        return?: TypeDescriptor<FunctionSignatureType>;
    };
}
export interface TSFunctionSignatureType extends FunctionSignatureType {
    signature: {
        arguments: Array<FunctionArgumentType<TSFunctionSignatureType>>;
        return?: TypeDescriptor<TSFunctionSignatureType>;
        this?: TypeDescriptor<TSFunctionSignatureType>;
    };
}
export interface ObjectSignatureType<T = FunctionSignatureType> extends BaseType {
    name: 'signature';
    type: 'object';
    raw: string;
    signature: {
        properties: Array<{
            key: TypeDescriptor<T> | string;
            value: TypeDescriptor<T>;
        }>;
        constructor?: TypeDescriptor<T>;
    };
}
export declare type TypeDescriptor<T = FunctionSignatureType> = ElementsType<T> | LiteralType | ObjectSignatureType<T> | SimpleType | T;
export interface PropDescriptor {
    type?: PropTypeDescriptor;
    flowType?: TypeDescriptor<FunctionSignatureType>;
    tsType?: TypeDescriptor<TSFunctionSignatureType>;
    required?: boolean;
    defaultValue?: DefaultValueDescriptor;
    description?: string;
}
export default class Documentation {
    #private;
    constructor();
    addComposes(moduleName: string): void;
    set(key: string, value: unknown): void;
    get(key: string): unknown;
    getPropDescriptor(propName: string): PropDescriptor;
    getContextDescriptor(propName: string): PropDescriptor;
    getChildContextDescriptor(propName: string): PropDescriptor;
    toObject(): DocumentationObject;
}
