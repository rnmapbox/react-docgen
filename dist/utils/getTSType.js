"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getPropertyName_1 = __importDefault(require("./getPropertyName"));
const printValue_1 = __importDefault(require("./printValue"));
const getTypeAnnotation_1 = __importDefault(require("../utils/getTypeAnnotation"));
const resolveToValue_1 = __importDefault(require("../utils/resolveToValue"));
const resolveObjectKeysToArray_1 = require("../utils/resolveObjectKeysToArray");
const getTypeParameters_1 = __importDefault(require("../utils/getTypeParameters"));
const docblock_1 = require("./docblock");
const tsTypes = {
    TSAnyKeyword: 'any',
    TSBooleanKeyword: 'boolean',
    TSUnknownKeyword: 'unknown',
    TSNeverKeyword: 'never',
    TSNullKeyword: 'null',
    TSUndefinedKeyword: 'undefined',
    TSNumberKeyword: 'number',
    TSStringKeyword: 'string',
    TSSymbolKeyword: 'symbol',
    TSThisType: 'this',
    TSObjectKeyword: 'object',
    TSVoidKeyword: 'void',
};
const namedTypes = {
    TSArrayType: handleTSArrayType,
    TSTypeReference: handleTSTypeReference,
    TSTypeLiteral: handleTSTypeLiteral,
    TSInterfaceDeclaration: handleTSInterfaceDeclaration,
    TSUnionType: handleTSUnionType,
    TSFunctionType: handleTSFunctionType,
    TSIntersectionType: handleTSIntersectionType,
    TSMappedType: handleTSMappedType,
    TSTupleType: handleTSTupleType,
    TSTypeQuery: handleTSTypeQuery,
    TSTypeOperator: handleTSTypeOperator,
    TSIndexedAccessType: handleTSIndexedAccessType,
};
function handleTSArrayType(path, typeParams) {
    return {
        name: 'Array',
        elements: [getTSTypeWithResolvedTypes(path.get('elementType'), typeParams)],
        raw: (0, printValue_1.default)(path),
    };
}
function handleTSTypeReference(path, typeParams) {
    let type;
    const typeName = path.get('typeName');
    if (typeName.isTSQualifiedName()) {
        const left = typeName.get('left');
        const right = typeName.get('right');
        if (left.isIdentifier() &&
            left.node.name === 'React' &&
            right.isIdentifier()) {
            type = {
                name: `${left.node.name}${right.node.name}`,
                raw: (0, printValue_1.default)(typeName),
            };
        }
        else {
            type = { name: (0, printValue_1.default)(typeName).replace(/<.*>$/, '') };
        }
    }
    else {
        type = { name: typeName.node.name };
    }
    const resolvedPath = (typeParams && typeParams[type.name]) ||
        (0, resolveToValue_1.default)(path.get('typeName'));
    const typeParameters = path.get('typeParameters');
    const resolvedTypeParameters = resolvedPath.get('typeParameters');
    if (typeParameters.hasNode() && resolvedTypeParameters.hasNode()) {
        typeParams = (0, getTypeParameters_1.default)(resolvedTypeParameters, typeParameters, typeParams);
    }
    if (typeParams && typeParams[type.name]) {
        // Open question: Why is this `null` instead of `typeParams`
        type = getTSTypeWithResolvedTypes(resolvedPath, null);
    }
    const resolvedTypeAnnotation = resolvedPath.get('typeAnnotation');
    if (resolvedTypeAnnotation.hasNode()) {
        type = getTSTypeWithResolvedTypes(resolvedTypeAnnotation, typeParams);
    }
    else if (typeParameters.hasNode()) {
        const params = typeParameters.get('params');
        type = {
            ...type,
            elements: params.map(param => getTSTypeWithResolvedTypes(param, typeParams)),
            raw: (0, printValue_1.default)(path),
        };
    }
    return type;
}
function getTSTypeWithRequirements(path, typeParams) {
    const type = getTSTypeWithResolvedTypes(path, typeParams);
    type.required =
        !('optional' in path.parentPath.node) || !path.parentPath.node.optional;
    return type;
}
function handleTSTypeLiteral(path, typeParams) {
    const type = {
        name: 'signature',
        type: 'object',
        raw: (0, printValue_1.default)(path),
        signature: { properties: [] },
    };
    path.get('members').forEach(param => {
        const typeAnnotation = param.get('typeAnnotation');
        if ((param.isTSPropertySignature() || param.isTSMethodSignature()) &&
            typeAnnotation.hasNode()) {
            const propName = (0, getPropertyName_1.default)(param);
            if (!propName) {
                return;
            }
            const docblock = (0, docblock_1.getDocblock)(param);
            let doc = {};
            if (docblock) {
                doc = { description: docblock };
            }
            type.signature.properties.push({
                key: propName,
                value: getTSTypeWithRequirements(typeAnnotation, typeParams),
                ...doc,
            });
        }
        else if (param.isTSCallSignatureDeclaration()) {
            type.signature.constructor = handleTSFunctionType(param, typeParams);
        }
        else if (param.isTSIndexSignature() && typeAnnotation.hasNode()) {
            const idTypeAnnotation = param
                .get('parameters')[0]
                .get('typeAnnotation');
            if (idTypeAnnotation.hasNode()) {
                type.signature.properties.push({
                    key: getTSTypeWithResolvedTypes(idTypeAnnotation, typeParams),
                    value: getTSTypeWithRequirements(typeAnnotation, typeParams),
                });
            }
        }
    });
    return type;
}
function handleTSInterfaceDeclaration(path) {
    // Interfaces are handled like references which would be documented separately,
    // rather than inlined like type aliases.
    return {
        name: path.node.id.name,
    };
}
function handleTSUnionType(path, typeParams) {
    return {
        name: 'union',
        raw: (0, printValue_1.default)(path),
        elements: path
            .get('types')
            .map(subType => getTSTypeWithResolvedTypes(subType, typeParams)),
    };
}
function handleTSIntersectionType(path, typeParams) {
    return {
        name: 'intersection',
        raw: (0, printValue_1.default)(path),
        elements: path
            .get('types')
            .map(subType => getTSTypeWithResolvedTypes(subType, typeParams)),
    };
}
function handleTSMappedType(path, typeParams) {
    const key = getTSTypeWithResolvedTypes(path.get('typeParameter').get('constraint'), typeParams);
    key.required = !path.node.optional;
    const typeAnnotation = path.get('typeAnnotation');
    let value;
    if (typeAnnotation.hasNode()) {
        value = getTSTypeWithResolvedTypes(typeAnnotation, typeParams);
    }
    else {
        value = { name: 'any' }; //TODO test
        /**
         type OptionsFlags<Type> = {
      [Property in keyof Type];
    };
         */
    }
    return {
        name: 'signature',
        type: 'object',
        raw: (0, printValue_1.default)(path),
        signature: {
            properties: [
                {
                    key,
                    value,
                },
            ],
        },
    };
}
function handleTSFunctionType(path, typeParams) {
    let returnType;
    const annotation = path.get('typeAnnotation');
    if (annotation.hasNode()) {
        returnType = getTSTypeWithResolvedTypes(annotation, typeParams);
    }
    const type = {
        name: 'signature',
        type: 'function',
        raw: (0, printValue_1.default)(path),
        signature: {
            arguments: [],
            return: returnType,
        },
    };
    path.get('parameters').forEach(param => {
        const typeAnnotation = (0, getTypeAnnotation_1.default)(param);
        const arg = {
            type: typeAnnotation
                ? getTSTypeWithResolvedTypes(typeAnnotation, typeParams)
                : undefined,
            name: '',
        };
        if (param.isIdentifier()) {
            arg.name = param.node.name;
            if (param.node.name === 'this') {
                type.signature.this = arg.type;
                return;
            }
        }
        else {
            const restArgument = param.get('argument');
            if (restArgument.isIdentifier()) {
                arg.name = restArgument.node.name;
            }
            else {
                arg.name = (0, printValue_1.default)(restArgument);
            }
            arg.rest = true;
        }
        type.signature.arguments.push(arg);
    });
    return type;
}
function handleTSTupleType(path, typeParams) {
    const type = {
        name: 'tuple',
        raw: (0, printValue_1.default)(path),
        elements: [],
    };
    path.get('elementTypes').forEach(param => {
        type.elements.push(getTSTypeWithResolvedTypes(param, typeParams));
    });
    return type;
}
function handleTSTypeQuery(path, typeParams) {
    const resolvedPath = (0, resolveToValue_1.default)(path.get('exprName'));
    if ('typeAnnotation' in resolvedPath.node) {
        return getTSTypeWithResolvedTypes(resolvedPath.get('typeAnnotation'), typeParams);
    }
    // @ts-ignore Do we need to handle TsQualifiedName here TODO
    return { name: path.node.exprName.name };
}
function handleTSTypeOperator(path) {
    if (path.node.operator !== 'keyof') {
        return null;
    }
    let value = path.get('typeAnnotation');
    if (value.isTSTypeQuery()) {
        value = value.get('exprName');
    }
    else if ('id' in value.node) {
        value = value.get('id');
    }
    const resolvedPath = (0, resolveToValue_1.default)(value);
    if (resolvedPath &&
        (resolvedPath.isObjectExpression() || resolvedPath.isTSTypeLiteral())) {
        const keys = (0, resolveObjectKeysToArray_1.resolveObjectToNameArray)(resolvedPath, true);
        if (keys) {
            return {
                name: 'union',
                raw: (0, printValue_1.default)(path),
                elements: keys.map(key => ({ name: 'literal', value: key })),
            };
        }
    }
    return null;
}
function handleTSIndexedAccessType(path, typeParams) {
    const objectType = getTSTypeWithResolvedTypes(path.get('objectType'), typeParams);
    const indexType = getTSTypeWithResolvedTypes(path.get('indexType'), typeParams);
    // We only get the signature if the objectType is a type (vs interface)
    if (!objectType.signature)
        return {
            name: `${objectType.name}[${indexType.value ? indexType.value.toString() : indexType.name}]`,
            raw: (0, printValue_1.default)(path),
        };
    const resolvedType = objectType.signature.properties.find(p => {
        // indexType.value = "'foo'"
        return indexType.value && p.key === indexType.value.replace(/['"]+/g, '');
    });
    if (!resolvedType) {
        return { name: 'unknown' };
    }
    return {
        name: resolvedType.value.name,
        raw: (0, printValue_1.default)(path),
    };
}
let visitedTypes = {};
function getTSTypeWithResolvedTypes(path, typeParams) {
    if (path.isTSTypeAnnotation()) {
        path = path.get('typeAnnotation');
    }
    const node = path.node;
    let type;
    let typeAliasName = null;
    if (path.parentPath.isTSTypeAliasDeclaration()) {
        typeAliasName = path.parentPath.node.id.name;
    }
    // When we see a typealias mark it as visited so that the next
    // call of this function does not run into an endless loop
    if (typeAliasName) {
        if (visitedTypes[typeAliasName] === true) {
            // if we are currently visiting this node then just return the name
            // as we are starting to endless loop
            return { name: typeAliasName };
        }
        else if (typeof visitedTypes[typeAliasName] === 'object') {
            // if we already resolved the type simple return it
            return visitedTypes[typeAliasName];
        }
        // mark the type as visited
        visitedTypes[typeAliasName] = true;
    }
    if (node.type in tsTypes) {
        type = { name: tsTypes[node.type] };
    }
    else if (path.isTSLiteralType()) {
        const literal = path.get('literal');
        type = {
            name: 'literal',
            value: (0, printValue_1.default)(literal),
        };
    }
    else if (node.type in namedTypes) {
        type = namedTypes[node.type](path, typeParams);
    }
    else {
        type = { name: 'unknown' };
    }
    if (typeAliasName) {
        // mark the type as unvisited so that further calls can resolve the type again
        visitedTypes[typeAliasName] = type;
    }
    return type;
}
/**
 * Tries to identify the typescript type by inspecting the path for known
 * typescript type names. This method doesn't check whether the found type is actually
 * existing. It simply assumes that a match is always valid.
 *
 * If there is no match, "unknown" is returned.
 */
function getTSType(path, typeParamMap = null) {
    // Empty visited types before an after run
    // Before: in case the detection threw and we rerun again
    // After: cleanup memory after we are done here
    visitedTypes = {};
    const type = getTSTypeWithResolvedTypes(path, typeParamMap);
    visitedTypes = {};
    return type;
}
exports.default = getTSType;
