// @flow
import firebase from 'firebase';
import { FetchStatus } from './modules/fetchStatus';
import { getCollectionQueryPath, getQueryId, getQueryPath } from './modules/query';
import { addListener, addQuery } from './actions';

import type { Store } from 'redux';
import type { StoreState } from './reducers';

type Props = {};

const emptyArray = [];

const singleUndefined = { fetchStatus: FetchStatus.NONE, doc: undefined };
const collectionUndefiend = { fetchStatus: FetchStatus.NONE, docs: emptyArray };

export const initSelect = (store: Store<*, *, *>) => (query: firebase.firestore.Query) => () => {
  store.dispatch(addQuery(query));
  store.dispatch(addListener(query));

  const queryId = getQueryId(query);
  const queryPath = getQueryPath(query);
  const collectionQueryPath = getCollectionQueryPath(query);
  const isDocument = collectionQueryPath !== queryPath;

  return (state: StoreState, props: Props) => {
    const storeQuery = state.queries[queryId];
    if (storeQuery) {
      const { documentIds, fetchStatus } = storeQuery;
      const collection = state.collections[collectionQueryPath];
      if (collection && documentIds) {
        const docs = documentIds.map((id: string) => collection[id]).filter(Boolean);
        return isDocument ? { fetchStatus, doc: docs[0] } : { fetchStatus, docs };
      }
    }
    return isDocument ? singleUndefined : collectionUndefiend;
  };
};

export const initSelectAuth = (auth: firebase.auth.Auth, userCollection: string = 'users') => () => (
  state: StoreState,
  props: Props
) => {
  const { uid } = state.auth;
  if (!uid) {
    return { authUser: undefined, fetchStatus: FetchStatus.LOADING, user: undefined };
  }
  const query = state.queries[`auth|${userCollection}/${uid}`];
  const fetchStatus = query ? query.fetchStatus : FetchStatus.NONE;
  const user = state.collections[userCollection] ? state.collections[userCollection][uid] : undefined;
  const authUser = auth.currentUser;
  return { authUser, fetchStatus, user };
};
