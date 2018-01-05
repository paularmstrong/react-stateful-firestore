// @flow
import { getQueryId } from './modules/query';
import { createActionType, createRequestActionTypes } from './modules/actionTypes';

import type { Auth } from 'firebase/auth';
import type { Firestore, Query } from 'firebase/firestore';
import type { Reference } from 'firebase/storage';
import type { StoreState } from './reducers';
import type { FluxStandardAction } from './reducers/flux-standard-action';

type Action = FluxStandardAction<string, any, {}>;
type $ThunkAction<R> = (dispatch: Dispatch, getState: GetState, args: ThunkArgs) => R;
type ThunkAction = $ThunkAction<any>;
type Dispatch = (action: Action | ThunkAction) => any;
type GetState = () => StoreState;
type ThunkArgs = { auth: Auth, firestore: Firestore };

export const COLLECTIONS = {
  MODIFY: createActionType('collections/MODIFY'),
  MODIFY_ONE: createActionType('collections/MODIFY_ONE'),
  REMOVE: createActionType('collections/REMOVE')
};

export const QUERIES = {
  ...createRequestActionTypes('queries'),
  REMOVE: createActionType('queries/REMOVE')
};

const _handleReceiveSnapshot = (dispatch: Dispatch, query, queryId) => (snapshot) => {
  if (snapshot.docChanges) {
    dispatch({ type: COLLECTIONS.MODIFY, payload: snapshot, meta: { query } });
  } else {
    dispatch({ type: COLLECTIONS.MODIFY_ONE, payload: snapshot, meta: { query } });
  }
  dispatch({ type: QUERIES.SUCCESS, payload: snapshot, meta: { queryId } });
};

export const addQuery = (query: Query, queryIdPrefix: string = '') => (
  dispatch: Dispatch,
  getState: GetState
): Promise<any> => {
  const queryId = `${queryIdPrefix}${getQueryId(query)}`;
  const { queries } = getState();
  if (queryId in queries) {
    return Promise.resolve();
  }

  const meta = { queryId };

  dispatch({ type: QUERIES.REQUEST, payload: query, meta });

  return query
    .get()
    .then(_handleReceiveSnapshot(dispatch, query, queryId))
    .catch((error) => {
      dispatch({ error: true, type: QUERIES.FAILURE, payload: error, meta });
    });
};

export const removeQuery = (query: Query, queryIdPrefix: string = '') => ({
  type: QUERIES.REMOVE,
  payload: query,
  meta: { queryId: `${queryIdPrefix}${getQueryId(query)}` }
});

export const LISTENERS = {
  ADD: createActionType('listeners/ADD'),
  REMOVE: createActionType('listeners/REMOVE')
};

export const addListener = (query: Query, queryIdPrefix: string = '') => (
  dispatch: Dispatch,
  getState: GetState
): Promise<any> => {
  const { listeners } = getState();
  const queryId = `${queryIdPrefix}${getQueryId(query)}`;
  if (queryId in listeners) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    window.requestIdleCallback(() => {
      const unsubscribe = query.onSnapshot(_handleReceiveSnapshot(dispatch, query, queryId));
      resolve(dispatch({ type: LISTENERS.ADD, payload: unsubscribe, meta: { queryId } }));
    });
  });
};

export const removeListener = (query: Query, queryIdPrefix: string = '') => (
  dispatch: Dispatch,
  getState: GetState
): Promise<any> => {
  const queryId = `${queryIdPrefix}${getQueryId(query)}`;
  const { listeners } = getState();

  if (listeners[queryId]) {
    listeners[queryId].unsubscribe();
    return Promise.resolve(
      dispatch({
        type: LISTENERS.REMOVE,
        meta: { queryId }
      })
    );
  }

  return Promise.resolve();
};

const _authQueryPrefix = 'auth|';
export const AUTH = {
  CHANGE: createActionType('auth/CHANGE')
};

export const setUser = (currentUser?: { uid: string }, userCollection?: string) => (
  dispatch: Dispatch,
  getState: GetState,
  { firestore }: ThunkArgs
): Promise<any> => {
  if (currentUser && userCollection) {
    const query = firestore.doc(`${userCollection}/${currentUser.uid}`);
    dispatch(addQuery(query, _authQueryPrefix));
    dispatch(addListener(query, _authQueryPrefix));
  }
  dispatch({ type: AUTH.CHANGE, payload: currentUser });
  return Promise.resolve();
};

export const unsetUser = (uid?: string, userCollection?: string) => (
  dispatch: Dispatch,
  getState: GetState,
  { firestore }: ThunkArgs
): Promise<any> => {
  if (uid) {
    if (userCollection) {
      const query = firestore.doc(`${userCollection}/${uid}`);
      dispatch(removeQuery(query, _authQueryPrefix));
      dispatch(removeListener(query, _authQueryPrefix));
      dispatch({ type: COLLECTIONS.REMOVE, payload: { id: uid }, meta: { query } });
    }
    dispatch({ type: AUTH.CHANGE });
  }
  return Promise.resolve();
};

export const STORAGE = {
  URL: createRequestActionTypes('storage/downloadUrl'),
  METADATA: createRequestActionTypes('storage/metadata')
};

export const getStorageDownloadUrl = (reference: Reference) => (dispatch: Dispatch): Promise<any> => {
  const meta = { reference };
  dispatch({ type: STORAGE.URL.REQUEST, meta });
  return reference
    .getDownloadURL()
    .then((url) => {
      return dispatch({ type: STORAGE.URL.SUCCESS, payload: url, meta });
    })
    .catch((error) => {
      dispatch({ error: true, type: STORAGE.URL.FAILURE, payload: error, meta });
      throw error;
    });
};

export const getStorageMetadata = (reference: Reference) => (dispatch: Dispatch): Promise<any> => {
  const meta = { reference };
  dispatch({ type: STORAGE.METADATA.REQUEST, meta });
  return reference
    .getMetadata()
    .then((data) => {
      return dispatch({ type: STORAGE.METADATA.SUCCESS, payload: data, meta });
    })
    .catch((error) => {
      dispatch({ error: true, type: STORAGE.METADATA.FAILURE, payload: error, meta });
      throw error;
    });
};
