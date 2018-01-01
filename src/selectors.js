// @flow
import { createSelector } from 'reselect';
import { FetchStatus } from './modules/fetchStatus';
import { getCollectionQueryPath, getQueryId, getQueryPath } from './modules/query';
import { addListener, addQuery } from './actions';

import type { Auth } from 'firebase/auth';
import type { Query } from 'firebase/firestore';
import type { Store } from 'redux';
import type { StoreState } from './reducers';

type Props = {};

const emptyArray = [];

const singleUndefined = { fetchStatus: FetchStatus.NONE, doc: undefined };
const collectionUndefiend = { fetchStatus: FetchStatus.NONE, docs: emptyArray };

const selectQueries = (state) => state.queries;

export const initSelect = (store: Store<*, *, *>) => (query: Query) => {
  const queryId = getQueryId(query);
  const queryPath = getQueryPath(query);
  const collectionQueryPath = getCollectionQueryPath(query);
  const isDocument = collectionQueryPath !== queryPath;

  const selectStoreQuery = (state) => state.queries[queryId];
  const selectCollection = (state) => state.collections[collectionQueryPath];

  const selector = createSelector([selectStoreQuery, selectCollection], (storeQuery, collection) => {
    if (storeQuery && collection) {
      const { documentIds, fetchStatus } = storeQuery;
      if (documentIds) {
        const docs = documentIds.map((id: string) => collection[id]).filter(Boolean);
        return isDocument ? { fetchStatus, doc: docs[0] } : { fetchStatus, docs };
      }
    }
    return isDocument ? singleUndefined : collectionUndefiend;
  });

  return () => {
    store.dispatch(addQuery(query));
    store.dispatch(addListener(query));

    return selector;
  };
};

const loggedOut = { authUser: undefined, fetchStatus: FetchStatus.NONE, user: undefined };
export const initSelectAuth = (auth: Auth, userCollection: string = 'users') => {
  const selectUid = (state) => state.auth.uid;
  const selectStoreQuery = createSelector(
    [selectUid, selectQueries],
    (uid, queries) => queries[`auth|${userCollection}/${uid}`]
  );
  const selectUsersCollection = (state) => state.collections[userCollection];
  const selectUser = createSelector(
    [selectUid, selectUsersCollection],
    (uid, users) => (users ? users[uid] : undefined)
  );

  const selector = createSelector([selectUid, selectStoreQuery, selectUser], (uid, storeQuery, user) => {
    if (!uid) {
      return loggedOut;
    }
    const authUser = auth.currentUser;
    const fetchStatus = storeQuery ? storeQuery.fetchStatus : FetchStatus.LOADED;
    return { authUser, fetchStatus, user };
  });

  return () => selector;
};
