// @flow
import { createSelector } from 'reselect';
import { FetchStatus } from './modules/fetchStatus';
import { getCollectionQueryPath, getQueryId, getQueryPath } from './modules/query';
import { addListener, addQuery } from './actions';

import type { Auth } from 'firebase/auth';
import type { Query } from 'firebase/firestore';
import type { Store } from 'redux';
import type { StoreState } from './reducers';
import type { QueryState } from './reducers/queries';

type Props = {};

const emptyArray = [];

const singleUndefined = { fetchStatus: FetchStatus.NONE, doc: undefined };
const collectionUndefiend = { fetchStatus: FetchStatus.NONE, docs: emptyArray };

const selectQueries = (state) => state.queries;

/**
 * @callback select
 * @example
 * // A single doc
 * select(firestore.doc('mydocs/123'))
 * @example
 * // A collection
 * select(firestore.collection('mydocs'))
 * @example
 * // A filtered collection
 * select(firestore.collection('mydocs').where('comments', '>', 4))
 * @param {CollectionReference|DocumentReference} query A firestore query.
 */

/**
 * @namespace DocumentReference
 * @description
 * A firestore {@link https://firebase.google.com/docs/reference/js/firebase.firestore.DocumentReference DocumentReference}
 */

/**
 * @namespace CollectionReference
 * @description
 * A firestore {@link https://firebase.google.com/docs/reference/js/firebase.firestore.CollectionReference CollectionReference}
 */

/**
 * @namespace selectAuth
 */

/**
 * Initializes selectors with the internal redux store
 * @param {object} store
 * @return {select}
 */
export function initSelect(store: Store<*, *, *>) {
  return (query: Query) => {
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
}

export const initSelectAuth = (auth: Auth, userCollection: string = 'users') => {
  const loggedOut = { fetchStatus: FetchStatus.NONE, doc: undefined };
  const selectUid = (state) => state.auth.uid;
  const selectStoreQuery = createSelector(
    [selectUid, selectQueries],
    (uid, queries) => queries[`auth|${userCollection}/${uid}`]
  );
  const selectUsersCollection = (state) => state.collections[userCollection];
  const selectUserData = createSelector(
    [selectUid, selectUsersCollection],
    (uid, users) => (users ? users[uid] : undefined)
  );
  const selectCurrentUser = (state) => (auth.currentUser ? JSON.stringify(auth.currentUser.toJSON()) : undefined);

  const selector = createSelector([selectUid, selectCurrentUser, selectStoreQuery, selectUserData], (
    uid: string,
    currentUser?: string, // used for selector cache busting. Use auth.currentUser with connectAuth.
    storeQuery?: QueryState,
    doc: {}
  ) => {
    if (!uid) {
      return loggedOut;
    }
    const fetchStatus = storeQuery ? storeQuery.fetchStatus : FetchStatus.LOADED;
    return { fetchStatus, doc };
  });

  return () => selector;
};
