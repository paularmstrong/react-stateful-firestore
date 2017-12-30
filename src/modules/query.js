// @flow
import firebase from 'firebase';

type Operation = { name: '<' | '<=' | '==' | '>=' | '>' };
type Value = { internalValue: any };
type RelationalFilter = {
  field: firebase.firestore.FieldPath,
  op: Operation,
  value: Value
};

const filterToString = (filter: RelationalFilter) => {
  const { field, op, value } = filter;
  return `${pathToString(field)}${op.name}${value.toString()}`;
};

// $FlowFixMe Undocumented key/value
const pathToString = (path: firebase.firestore.FieldPath) => path.segments.join('/');

export const getQueryId = (query: firebase.firestore.Query): string => {
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

export const getQueryPath = (query: firebase.firestore.Query): string => {
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

export const getCollectionQueryPath = (query: firebase.firestore.Query): string => {
  const fullPath = getQueryPath(query);
  const pathParts = fullPath.split('/');
  return pathParts.length % 2 ? fullPath : fullPath.replace(/(\/[^\/]+)$/, '');
};
