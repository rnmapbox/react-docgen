import type { TransformOptions } from '@babel/core';
import type { Handler } from './handlers';
import type { Importer } from './importer';
import type { Resolver } from './resolver';
export interface Config {
    handlers?: Handler[];
    importer?: Importer;
    resolver?: Resolver;
    /**
     * shortcut for `babelOptions.filename`
     * Set to an absolute path (recommended) to the file currently being parsed or
     * to an relative path that is relative to the `babelOptions.cwd`.
     */
    filename?: string;
    babelOptions?: TransformOptions;
}
export declare type InternalConfig = Omit<Required<Config>, 'filename'>;
export declare const defaultHandlers: Handler[];
export declare function createConfig(inputConfig: Config): InternalConfig;
