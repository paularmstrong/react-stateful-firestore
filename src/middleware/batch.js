// @flow

import type { StoreState } from '../reducers';
import type { FluxStandardAction } from '../reducers/flux-standard-action';
import type { Reducer } from 'redux';

type Action = FluxStandardAction<string, any, {}>;
type Dispatch = (action: Action) => any;
type Next = (action: Action) => any;

const BATCH_ACTION = 'BATCH';

const isPlainAction = (action: { type: string } | string): boolean =>
  typeof action === 'object' && typeof action.type === 'string';

const actionBatch = (actions: Array<Action>) => {
  const meta = actions.reduce((obj, action) => {
    if (typeof action.meta === 'object') {
      Object.assign(obj, action.meta);
    }
    return obj;
  }, {});
  return {
    type: BATCH_ACTION,
    payload: actions,
    meta
  };
};

export const batchMiddleware = ({ dispatch }: { dispatch: Dispatch }) => (next: Next) => (
  actions: Array<Action> | Action
) => {
  if (Array.isArray(actions)) {
    const plainActions = [];
    actions.forEach((action) => {
      if (typeof action === 'function') {
        dispatch(action);
      } else if (isPlainAction(action)) {
        plainActions.push(action);
      }
    });
    return next(actionBatch(plainActions));
  } else {
    return next(actions);
  }
};

export const batchReducer = (reducer: Reducer<StoreState, Action>) => (state: StoreState, action: Action) => {
  return action && action.type === BATCH_ACTION ? action.payload.reduce(reducer, state) : reducer(state, action);
};
