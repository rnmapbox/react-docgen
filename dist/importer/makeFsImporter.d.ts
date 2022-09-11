import type { Importer } from '.';
import type FileState from '../FileState';
export default function makeFsImporter(lookupModule?: (filename: string, basedir: string) => string, cache?: Map<string, FileState>): Importer;
