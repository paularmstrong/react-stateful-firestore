// @flow
import { combineReducers } from 'redux';
import { reducer as auth } from './auth';
import { reducer as collections } from './collections';
import { reducer as listeners } from './listeners';
import { reducer as queries } from './queries';

import type { State as AuthState } from './auth';
import type { State as CollectionsState } from './collections';
import type { State as ListenersState } from './listeners';
import type { State as QueriesState } from './queries';

export type StoreState = {
  auth: AuthState,
  collections: CollectionsState,
  listeners: ListenersState,
  queries: QueriesState
};

const reducer = combineReducers({
  auth,
  collections,
  listeners,
  queries
});

export default reducer;
