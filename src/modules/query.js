// @flow
import type { FieldPath, Query } from '@firebase/firestore';
import type { StoreState } from '../reducers';

type Operation = { name: '<' | '<=' | '==' | '>=' | '>' };
type Value = { internalValue: any };
type RelationalFilter = {
  field: FieldPath,
  op: Operation,
  value: Value
};

const emptyArray = [];

// $FlowFixMe Undocumented key/value
const pathToString = (path: FieldPath) => path.segments.join('/');

const filterToString = (filter: RelationalFilter) => {
  const { field, op, value } = filter;
  return `${pathToString(field)}${op.name}${value.toString()}`;
};

export const getQueryId = (query: Query): string => {
  // $FlowFixMe Undocumented key/value
  if (query.id && query.id === query.path) {
    // $FlowFixMe Undocumented key/value
    return query.id;
  }

  if (query.path && typeof query.path === 'string') {
    // $FlowFixMe Undocumented key/value
    return query.path;
  }

  if (query._query) {
    // $FlowFixMe Grabbing private value
    const { filters, limit, path } = query._query;
    const filterString = filters.map(filterToString).join('|');
    return `${pathToString(path)}${filterString ? `:${filterString}` : ''}${limit ? `:${limit}` : ''}`;
  }

  throw new Error('Unknown query type');
};

export const getQueryPath = (query: Query): string => {
  if (query.path) {
    // $FlowFixMe Undocumented key/value
    return query.path;
  }

  if (query._query) {
    // $FlowFixMe Grabbing private value
    const { path } = query._query;
    return pathToString(path);
  }

  throw new Error('Unknown query type');
};

export const getCollectionQueryPath = (query: Query): string => {
  const fullPath = getQueryPath(query);
  const pathParts = fullPath.split('/');
  return pathParts.length % 2 ? fullPath : fullPath.replace(/(\/[^/]+)$/, '');
};

const _getValueFromFieldPath = (doc, fieldPath: FieldPath) => {
  let value = doc;
  // $FlowFixMe Undocumented key/value
  for (let i = 0; i < fieldPath.segments.length; i++) {
    // $FlowFixMe Undocumented key/value
    const segment = fieldPath.segments[i];
    value = value && typeof value === 'object' ? value[segment] : undefined;
    if (typeof value === undefined) {
      return undefined;
    }
  }
  return value;
};

export const getDocumentIdsForQuery = (query: Query, state: StoreState): Array<string> => {
  const collectionPath = getCollectionQueryPath(query);
  const queryPath = getQueryPath(query);
  const pathParts = queryPath.split('/');
  const documents = state.collections[collectionPath];
  if (!(pathParts.length % 2)) {
    const documentId = pathParts[pathParts.length - 1];
    return Object.keys(documents).indexOf(documentId) >= 0 ? [documentId] : [];
  }

  if (query._query) {
    // $FlowFixMe Undocumented key/value
    const { filters, limit, orderBy } = query._query;
    let docs = Object.values(documents).filter((doc) => {
      return filters.every(({ field, op, value }) => {
        const docValue = _getValueFromFieldPath(doc, field);
        const { internalValue } = value;
        const normValue =
          typeof internalValue === 'object'
            ? internalValue.seconds ? new Date(internalValue.seconds) : internalValue
            : internalValue;
        switch (op.name) {
          case '<':
            return docValue < normValue;
          case '<=':
            return docValue <= normValue;
          case '==':
            return docValue == normValue;
          case '>':
            return docValue > normValue;
          case '>=':
            return docValue >= normValue;
          default:
            return true;
        }
      });
    });

    if (orderBy && orderBy.length > 0) {
      orderBy.forEach((order) => {
        const { dir: { name: dir }, field } = order;
        docs = docs.sort((a, b) => {
          const aValue = _getValueFromFieldPath(a, field);
          const bValue = _getValueFromFieldPath(b, field);
          if (!aValue || !bValue) {
            return 0;
          }
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return dir === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          }
          if (aValue instanceof Date && bValue instanceof Date) {
            return dir === 'asc' ? aValue.valueOf() - bValue.valueOf() : bValue.valueOf() - aValue.valueOf();
          }
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return dir === 'asc' ? aValue - bValue : bValue - aValue;
          }
          return 0;
        });
      });
    }

    return docs
      .map((doc) => (typeof doc === 'object' && doc && typeof doc.id === 'string' ? doc.id : undefined))
      .filter(Boolean)
      .slice(0, limit);
  }
  return emptyArray;
};
