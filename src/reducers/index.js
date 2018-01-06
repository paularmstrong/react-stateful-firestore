// @flow
import { batchReducer } from '../middleware/batch';
import { combineReducers } from 'redux';
import { reducer as auth } from './auth';
import { reducer as collections } from './collections';
import { reducer as listeners } from './listeners';
import { reducer as queries } from './queries';
import { reducer as storage } from './storage';

import type { State as AuthState } from './auth';
import type { State as CollectionsState } from './collections';
import type { State as ListenersState } from './listeners';
import type { State as QueriesState } from './queries';
import type { State as StorageState } from './storage';

export type StoreState = {
  auth: AuthState,
  collections: CollectionsState,
  listeners: ListenersState,
  queries: QueriesState,
  storage: StorageState
};

const reducer = batchReducer(
  combineReducers({
    auth,
    collections,
    listeners,
    queries,
    storage
  })
);

export default reducer;
