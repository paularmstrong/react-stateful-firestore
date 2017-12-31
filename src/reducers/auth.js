// @flow
import { AUTH } from '../actions';

import type { FirebaseUser } from 'firebase';
import type { FluxStandardAction } from './flux-standard-action';

export type State = {
  uid?: string,
  ...FirebaseUser
};

type Action = FluxStandardAction<string, FirebaseUser, *>;

const defaultState = {};

export function reducer(state: State = defaultState, action: Action) {
  switch (action.type) {
    case AUTH.CHANGE:
      return action.payload
        ? {
            ...state,
            ...action.payload.toJSON()
          }
        : defaultState;

    default:
      return state;
  }
}
