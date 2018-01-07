// @flow
import type { FieldPath, Query } from '@firebase/firestore';

type Operation = { name: '<' | '<=' | '==' | '>=' | '>' };
type Value = { internalValue: any };
type RelationalFilter = {
  field: FieldPath,
  op: Operation,
  value: Value
};

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
    const { filters, path } = query._query;
    const filterString = filters.map(filterToString).join('|');
    return `${pathToString(path)}:${filterString}`;
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
