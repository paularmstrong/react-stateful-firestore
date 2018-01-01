// @flow
import { QUERIES } from '../actions';
import { FetchStatus } from '../modules/fetchStatus';

import type { DocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import type { FluxStandardAction } from './flux-standard-action';

export type QueryState = {
  documentIds: Array<string>,
  error?: Error,
  fetchStatus: $Values<typeof FetchStatus>
};
export type State = {
  [queryId: string]: QueryState
};

type QueryMeta = { queryId: string };
type Action = FluxStandardAction<string, *, QueryMeta>;

const defaultState = {};
const defaultQueryState = {
  documentIds: [],
  error: undefined,
  fetchStatus: FetchStatus.NONE
};

const sortChanges = (a: { doc: { newIndex: number } }, b: { doc: { newIndex: number } }) =>
  a.doc.newIndex - b.doc.newIndex;

const updateMultiple = (state: State, payload: QuerySnapshot, queryId: string): State => {
  const documentIds = payload.docChanges.sort(sortChanges).reduce(
    (memo, change) => {
      const { doc, type: changeType, newIndex } = change;
      switch (changeType) {
        case 'added':
        case 'modified':
          if (memo.indexOf(doc.id) !== -1) {
            return memo;
          }
          if (memo.length === 0) {
            return [doc.id];
          }
          memo.splice(newIndex, 0, doc.id);
          return memo;
        case 'removed':
          memo.splice(newIndex, 1);
          return memo;
        default:
          return memo;
      }
    },
    [...state[queryId].documentIds]
  );
  return {
    ...state,
    [queryId]: {
      ...state[queryId],
      documentIds,
      fetchStatus: FetchStatus.LOADED
    }
  };
};

const updateOne = (state: State, payload: DocumentSnapshot, queryId: string): State => {
  return {
    ...state,
    [queryId]: {
      ...state[queryId],
      documentIds: [payload.id],
      fetchStatus: FetchStatus.LOADED
    }
  };
};

export function reducer(state: State = defaultState, action: Action): State {
  switch (action.type) {
    case QUERIES.REQUEST: {
      const { meta: { queryId } } = action;
      return {
        ...state,
        [queryId]: {
          ...defaultQueryState,
          ...state[queryId],
          fetchStatus: FetchStatus.LOADING
        }
      };
    }

    case QUERIES.SUCCESS: {
      const { meta: { queryId }, payload } = action;
      if (payload.docChanges) {
        return updateMultiple(state, payload, queryId);
      } else {
        return updateOne(state, payload, queryId);
      }
    }

    case QUERIES.FAILURE: {
      const { meta: { queryId }, payload } = action;
      return {
        ...state,
        [queryId]: {
          ...state[queryId],
          error: payload,
          fetchStatus: FetchStatus.FAILED
        }
      };
    }

    case QUERIES.REMOVE: {
      const { meta: { queryId } } = action;
      const newState = { ...state };
      delete newState[queryId];
      return newState;
    }

    default:
      return state;
  }
}
