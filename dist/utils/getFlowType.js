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
const flowTypes = {
    AnyTypeAnnotation: 'any',
    BooleanTypeAnnotation: 'boolean',
    MixedTypeAnnotation: 'mixed',
    NullLiteralTypeAnnotation: 'null',
    NumberTypeAnnotation: 'number',
    StringTypeAnnotation: 'string',
    VoidTypeAnnotation: 'void',
    EmptyTypeAnnotation: 'empty',
};
const flowLiteralTypes = {
    BooleanLiteralTypeAnnotation: 1,
    NumberLiteralTypeAnnotation: 1,
    StringLiteralTypeAnnotation: 1,
};
const namedTypes = {
    ArrayTypeAnnotation: handleArrayTypeAnnotation,
    GenericTypeAnnotation: handleGenericTypeAnnotation,
    ObjectTypeAnnotation: handleObjectTypeAnnotation,
    InterfaceDeclaration: handleInterfaceDeclaration,
    UnionTypeAnnotation: handleUnionTypeAnnotation,
    NullableTypeAnnotation: handleNullableTypeAnnotation,
    FunctionTypeAnnotation: handleFunctionTypeAnnotation,
    IntersectionTypeAnnotation: handleIntersectionTypeAnnotation,
    TupleTypeAnnotation: handleTupleTypeAnnotation,
    TypeofTypeAnnotation: handleTypeofTypeAnnotation,
};
function getFlowTypeWithRequirements(path, typeParams) {
    const type = getFlowTypeWithResolvedTypes(path, typeParams);
    type.required =
        'optional' in path.parentPath.node ? !path.parentPath.node.optional : true;
    return type;
}
function handleKeysHelper(path) {
    let value = path.get('typeParameters').get('params')[0];
    if (value.isTypeofTypeAnnotation()) {
        value = value.get('argument').get('id');
    }
    else if (!value.isObjectTypeAnnotation()) {
        value = value.get('id');
    }
    const resolvedPath = (0, resolveToValue_1.default)(value);
    if (resolvedPath &&
        (resolvedPath.isObjectExpression() || resolvedPath.isObjectTypeAnnotation())) {
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
function handleArrayTypeAnnotation(path, typeParams) {
    return {
        name: 'Array',
        elements: [
            getFlowTypeWithResolvedTypes(path.get('elementType'), typeParams),
        ],
        raw: (0, printValue_1.default)(path),
    };
}
function handleGenericTypeAnnotation(path, typeParams) {
    const id = path.get('id');
    const typeParameters = path.get('typeParameters');
    if (id.isIdentifier() &&
        id.node.name === '$Keys' &&
        typeParameters.hasNode()) {
        return handleKeysHelper(path);
    }
    let type;
    if (id.isQualifiedTypeIdentifier()) {
        const qualification = id.get('qualification');
        if (qualification.isIdentifier() && qualification.node.name === 'React') {
            type = {
                name: `${qualification.node.name}${id.node.id.name}`,
                raw: (0, printValue_1.default)(id),
            };
        }
        else {
            type = { name: (0, printValue_1.default)(id).replace(/<.*>$/, '') };
        }
    }
    else {
        type = { name: id.node.name };
    }
    const resolvedPath = (typeParams && typeParams[type.name]) || (0, resolveToValue_1.default)(path.get('id'));
    if (typeParameters.hasNode() && resolvedPath.has('typeParameters')) {
        typeParams = (0, getTypeParameters_1.default)(resolvedPath.get('typeParameters'), typeParameters, typeParams);
    }
    if (typeParams &&
        typeParams[type.name] &&
        typeParams[type.name].isGenericTypeAnnotation()) {
        return type;
    }
    if (typeParams && typeParams[type.name]) {
        type = getFlowTypeWithResolvedTypes(resolvedPath, typeParams);
    }
    if (resolvedPath && resolvedPath.has('right')) {
        type = getFlowTypeWithResolvedTypes(resolvedPath.get('right'), typeParams);
    }
    else if (typeParameters.hasNode()) {
        const params = typeParameters.get('params');
        type = {
            ...type,
            elements: params.map(param => getFlowTypeWithResolvedTypes(param, typeParams)),
            raw: (0, printValue_1.default)(path),
        };
    }
    return type;
}
function handleObjectTypeAnnotation(path, typeParams) {
    const type = {
        name: 'signature',
        type: 'object',
        raw: (0, printValue_1.default)(path),
        signature: { properties: [] },
    };
    const callProperties = path.get('callProperties');
    if (Array.isArray(callProperties)) {
        callProperties.forEach(param => {
            type.signature.constructor = getFlowTypeWithResolvedTypes(param.get('value'), typeParams);
        });
    }
    const indexers = path.get('indexers');
    if (Array.isArray(indexers)) {
        indexers.forEach(param => {
            type.signature.properties.push({
                key: getFlowTypeWithResolvedTypes(param.get('key'), typeParams),
                value: getFlowTypeWithRequirements(param.get('value'), typeParams),
            });
        });
    }
    path.get('properties').forEach(param => {
        if (param.isObjectTypeProperty()) {
            type.signature.properties.push({
                // For ObjectTypeProperties `getPropertyName` always returns string
                key: (0, getPropertyName_1.default)(param),
                value: getFlowTypeWithRequirements(param.get('value'), typeParams),
            });
        }
        else if (param.isObjectTypeSpreadProperty()) {
            let spreadObject = (0, resolveToValue_1.default)(param.get('argument'));
            if (spreadObject.isGenericTypeAnnotation()) {
                const typeAlias = (0, resolveToValue_1.default)(spreadObject.get('id'));
                if (typeAlias.isTypeAlias() &&
                    typeAlias.get('right').isObjectTypeAnnotation()) {
                    spreadObject = (0, resolveToValue_1.default)(typeAlias.get('right'));
                }
            }
            if (spreadObject.isObjectTypeAnnotation()) {
                const props = handleObjectTypeAnnotation(spreadObject, typeParams);
                type.signature.properties.push(...props.signature.properties);
            }
        }
    });
    return type;
}
function handleInterfaceDeclaration(path) {
    // Interfaces are handled like references which would be documented separately,
    // rather than inlined like type aliases.
    return {
        name: path.node.id.name,
    };
}
function handleUnionTypeAnnotation(path, typeParams) {
    return {
        name: 'union',
        raw: (0, printValue_1.default)(path),
        elements: path
            .get('types')
            .map(subType => getFlowTypeWithResolvedTypes(subType, typeParams)),
    };
}
function handleIntersectionTypeAnnotation(path, typeParams) {
    return {
        name: 'intersection',
        raw: (0, printValue_1.default)(path),
        elements: path
            .get('types')
            .map(subType => getFlowTypeWithResolvedTypes(subType, typeParams)),
    };
}
function handleNullableTypeAnnotation(path, typeParams) {
    const typeAnnotation = (0, getTypeAnnotation_1.default)(path);
    if (!typeAnnotation)
        return null;
    const type = getFlowTypeWithResolvedTypes(typeAnnotation, typeParams);
    type.nullable = true;
    return type;
}
function handleFunctionTypeAnnotation(path, typeParams) {
    const type = {
        name: 'signature',
        type: 'function',
        raw: (0, printValue_1.default)(path),
        signature: {
            arguments: [],
            return: getFlowTypeWithResolvedTypes(path.get('returnType'), typeParams),
        },
    };
    path.get('params').forEach(param => {
        const typeAnnotation = (0, getTypeAnnotation_1.default)(param);
        type.signature.arguments.push({
            name: param.node.name ? param.node.name.name : '',
            type: typeAnnotation
                ? getFlowTypeWithResolvedTypes(typeAnnotation, typeParams)
                : undefined,
        });
    });
    const rest = path.get('rest');
    if (rest.hasNode()) {
        const typeAnnotation = (0, getTypeAnnotation_1.default)(rest);
        type.signature.arguments.push({
            name: rest.node.name ? rest.node.name.name : '',
            type: typeAnnotation
                ? getFlowTypeWithResolvedTypes(typeAnnotation, typeParams)
                : undefined,
            rest: true,
        });
    }
    return type;
}
function handleTupleTypeAnnotation(path, typeParams) {
    const type = {
        name: 'tuple',
        raw: (0, printValue_1.default)(path),
        elements: [],
    };
    path.get('types').forEach(param => {
        type.elements.push(getFlowTypeWithResolvedTypes(param, typeParams));
    });
    return type;
}
function handleTypeofTypeAnnotation(path, typeParams) {
    return getFlowTypeWithResolvedTypes(path.get('argument'), typeParams);
}
let visitedTypes = {};
function getFlowTypeWithResolvedTypes(path, typeParams) {
    let type = null;
    const parent = path.parentPath;
    const isTypeAlias = parent.isTypeAlias();
    // When we see a typealias mark it as visited so that the next
    // call of this function does not run into an endless loop
    if (isTypeAlias) {
        if (visitedTypes[parent.node.id.name] === true) {
            // if we are currently visiting this node then just return the name
            // as we are starting to endless loop
            return { name: parent.node.id.name };
        }
        else if (typeof visitedTypes[parent.node.id.name] === 'object') {
            // if we already resolved the type simple return it
            return visitedTypes[parent.node.id.name];
        }
        // mark the type as visited
        visitedTypes[parent.node.id.name] = true;
    }
    if (path.node.type in flowTypes) {
        type = { name: flowTypes[path.node.type] };
    }
    else if (path.node.type in flowLiteralTypes) {
        type = {
            name: 'literal',
            value: path.node.extra?.raw ||
                `${path.node.value}`,
        };
    }
    else if (path.node.type in namedTypes) {
        type = namedTypes[path.node.type](path, typeParams);
    }
    if (!type) {
        type = { name: 'unknown' };
    }
    if (isTypeAlias) {
        // mark the type as unvisited so that further calls can resolve the type again
        visitedTypes[parent.node.id.name] = type;
    }
    return type;
}
/**
 * Tries to identify the flow type by inspecting the path for known
 * flow type names. This method doesn't check whether the found type is actually
 * existing. It simply assumes that a match is always valid.
 *
 * If there is no match, "unknown" is returned.
 */
function getFlowType(path, typeParams = null) {
    // Empty visited types before an after run
    // Before: in case the detection threw and we rerun again
    // After: cleanup memory after we are done here
    visitedTypes = {};
    const type = getFlowTypeWithResolvedTypes(path, typeParams);
    visitedTypes = {};
    return type;
}
exports.default = getFlowType;
