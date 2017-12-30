// @flow
import firebase from 'firebase';
import { getQueryId } from './modules/query';
import { createActionType, createRequestActionTypes } from './modules/actionTypes';

import type { DispatchAPI } from 'redux';
import type { StoreState } from './reducers';
import type { FluxStandardAction } from './reducers/flux-standard-action';

type Action = FluxStandardAction<string, any, {}>;
type $ThunkAction<R> = (dispatch: Dispatch, getState: GetState, args: ThunkArgs) => R;
type ThunkAction = $ThunkAction<any>;
type Dispatch = (action: Action | ThunkAction) => any;
type GetState = () => StoreState;
type ThunkArgs = { auth: firebase.auth.Auth, firestore: firebase.firestore.Firestore };

export const COLLECTIONS = {
  MODIFY: createActionType('collections/MODIFY'),
  MODIFY_ONE: createActionType('collections/MODIFY_ONE')
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

export const addQuery = (query: firebase.firestore.Query, queryIdPrefix: string = '') => (
  dispatch: Dispatch,
  getState: GetState
): Promise<any> => {
  const queryId = `${queryIdPrefix}${getQueryId(query)}`;
  const { listeners, queries } = getState();
  if (queryId in queries) {
    return Promise.resolve();
  }

  const meta = { queryId };

  dispatch({ type: QUERIES.REQUEST, payload: query, meta });

  return query
    .get()
    .then(_handleReceiveSnapshot(dispatch, query, queryId))
    .catch((error) => {
      dispatch({ error: true, type: QUERIES.FAILED, payload: error, meta });
    });
};

export const removeQuery = (query: firebase.firestore.Query, queryIdPrefix: string = '') => ({
  type: QUERIES.REMOVE,
  payload: query,
  meta: { queryId: `${queryIdPrefix}${getQueryId(query)}` }
});

export const LISTENERS = {
  ADD: createActionType('listeners/ADD'),
  REMOVE: createActionType('listeners/REMOVE')
};
const createAddListenerAction = (query, queryIdPrefix: string = '') => ({
  type: LISTENERS.ADD,
  meta: { query: `${queryIdPrefix}${getQueryId(query)}` },
  payload: query
});

export const addListener = (query: firebase.firestore.Query, queryIdPrefix: string = '') => (
  dispatch: Dispatch,
  getState: GetState
): Promise<any> => {
  const { listeners } = getState();
  const queryId = `${queryIdPrefix}${getQueryId(query)}`;
  if (queryId in listeners) {
    return Promise.resolve();
  }

  const action = createAddListenerAction(query);
  return new Promise((resolve, reject) => {
    window.requestIdleCallback(() => {
      const unsubscribe = query.onSnapshot(_handleReceiveSnapshot(dispatch, query, queryId));
      resolve(dispatch({ type: LISTENERS.ADD, payload: unsubscribe, meta: { queryId } }));
    });
  });
};

export const removeListener = (query: firebase.firestore.Query, queryIdPrefix: string = '') => (
  dispatch: Dispatch,
  getState: GetState
): Promise<any> => {
  const queryId = `${queryIdPrefix}${getQueryId(query)}`;
  const { listeners } = getState();

  if (listeners[queryId]) {
    listeners[queryId].unsubscribe();
    return dispatch({
      type: LISTENERS.REMOVE,
      meta: { queryId }
    });
  }

  return Promise.resolve();
};

const _authQueryPrefix = 'auth|';
export const AUTH = {
  CHANGE: createActionType('auth/CHANGE')
};

export const setUser = (currentUser: { uid: string }) => (
  dispatch: Dispatch,
  getState: GetState,
  { firestore }: ThunkArgs
) => {
  const query = firestore.doc(`users/${currentUser.uid}`);
  dispatch(addQuery(query, _authQueryPrefix));
  dispatch(addListener(query, _authQueryPrefix));
  dispatch({ type: AUTH.CHANGE, payload: currentUser });
};

export const unsetUser = () => (dispatch: Dispatch, getState: GetState, { firestore }: ThunkArgs) => {
  const state = getState();
  const { uid } = state.auth;
  if (uid) {
    const query = firestore.doc(`users/${uid}`);
    dispatch(removeQuery(query, _authQueryPrefix));
    dispatch(removeListener(query, _authQueryPrefix));
    dispatch({ type: AUTH.CHANGE });
  }
};
