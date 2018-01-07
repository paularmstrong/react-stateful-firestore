// @flow
import { createSelector } from 'reselect';
import { FetchStatus } from './modules/fetchStatus';
import { getCollectionQueryPath, getQueryId, getQueryPath } from './modules/query';
import { addListener, addQuery, getStorageDownloadUrl, getStorageMetadata } from './actions';

import type { Auth } from '@firebase/auth';
import type { Query } from '@firebase/firestore';
import type { Reference } from '@firebase/storage';
import type { Store } from 'redux';
import type { StoreState } from './reducers';
import type { QueryState } from './reducers/queries';

type SelectOptions = {
  subscribe?: boolean
};

type StorageOptions = {
  metadata?: boolean
};

const selectOptionDefaults = {
  subscribe: true
};

const stroageOptionDefaults = {
  metadata: false
};

const emptyArray = [];

const singleUndefined = { fetchStatus: FetchStatus.NONE, doc: undefined };
const collectionUndefiend = { fetchStatus: FetchStatus.NONE, docs: emptyArray };

const selectQueries = (state: StoreState) => state.queries;

export const initSelect = (store: Store<*, *, *>) => (query: Query, selectOptions?: SelectOptions) => {
  const options = { ...selectOptionDefaults, ...selectOptions };
  const queryId = getQueryId(query);
  const queryPath = getQueryPath(query);
  const collectionQueryPath = getCollectionQueryPath(query);
  const isDocument = collectionQueryPath !== queryPath;

  const selectStoreQuery = (state: StoreState) => state.queries[queryId];
  const selectCollection = (state: StoreState) => state.collections[collectionQueryPath];

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
    const actions = [addQuery(query)];
    if (options.subscribe) {
      actions.push(addListener(query));
    }
    store.dispatch(actions);
    return selector;
  };
};

export const initSelectAuth = (auth: Auth, userCollection?: string) => {
  const loggedOut = { fetchStatus: FetchStatus.NONE, doc: undefined };
  const selectCollectionName = () => userCollection;
  const selectUid = (state: StoreState) => state.auth.uid;
  const selectStoreQuery = createSelector(
    [selectCollectionName, selectUid, selectQueries],
    (uid, queries) => (userCollection && queries ? queries[`auth|${userCollection}/${uid}`] : undefined)
  );
  const selectUsersCollection = (state: StoreState) => (userCollection ? state.collections[userCollection] : undefined);
  const selectUserData = createSelector(
    [selectUid, selectUsersCollection],
    (uid, users) => (users ? users[uid] : undefined)
  );
  const selectCurrentUser = () => (auth.currentUser ? JSON.stringify(auth.currentUser.toJSON()) : undefined);

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
    return {
      fetchStatus,
      doc: userCollection ? doc : {} // use a new object if no userCollection to cache bust
    };
  });

  return selector;
};

export const initSelectStorage = (store: Store<*, *, *>) => (ref: Reference, storageOptions?: StorageOptions) => {
  const options = {
    ...stroageOptionDefaults,
    ...storageOptions
  };
  const actionCreator = options.metadata ? getStorageMetadata : getStorageDownloadUrl;
  const selector = (state: StoreState) => state.storage[ref.fullPath];
  return () => {
    store.dispatch(actionCreator(ref));
    return selector;
  };
};
