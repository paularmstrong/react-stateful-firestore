// @flow
import { getCollectionQueryPath } from '../modules/query';
import { COLLECTIONS } from '../actions';

import type { DocumentSnapshot, QuerySnapshot, Query } from '@firebase/firestore';
import type { FluxStandardAction } from './flux-standard-action';

export type State = {
  [collectionPath: string]: { [id: string]: { id: string } }
};

type Meta = {
  query: Query
};
type Payload = DocumentSnapshot | QuerySnapshot;
type Action = FluxStandardAction<string, Payload, Meta>;

const defaultState = {};
const emptyObject = {};

export function reducer(state: State = defaultState, action: Action) {
  switch (action.type) {
    case COLLECTIONS.MODIFY_ONE: {
      const { meta, payload } = action;
      if (!(payload && payload.id)) {
        return state;
      }

      const path = getCollectionQueryPath(meta.query);
      return {
        ...state,
        [path]: {
          ...state[path],
          // $FlowFixMe
          [payload.id]: { id: payload.id, ...payload.data() }
        }
      };
    }

    case COLLECTIONS.MODIFY: {
      const { meta, payload } = action;
      if (!meta || !(payload && payload.docChanges)) {
        return state;
      }

      const path = getCollectionQueryPath(meta.query);

      // $FlowFixMe
      const newPathState = payload.docChanges.reduce((newState, change) => {
        const { doc, type: changeType } = change;
        const oldData = newState[doc.id] || emptyObject;
        switch (changeType) {
          case 'added': {
            if (!(doc.id in newState)) {
              newState[doc.id] = {
                id: doc.id,
                ...change.doc.data()
              };
            }
            break;
          }

          case 'modified':
            newState[doc.id] = {
              ...oldData,
              id: doc.id,
              ...change.doc.data()
            };
            break;

          case 'removed':
            delete newState[doc.id];
            break;
          // no default
        }
        return newState;
      }, state[path] || {});
      return {
        ...state,
        [path]: newPathState
      };
    }

    case COLLECTIONS.REMOVE: {
      const { meta, payload: { id } } = action;
      const path = getCollectionQueryPath(meta.query);
      const pathDocs = { ...state[path] };
      delete pathDocs[id];
      return {
        ...state,
        [path]: pathDocs
      };
    }

    default:
      return state;
  }
}
