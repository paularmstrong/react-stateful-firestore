// @flow
import { auth } from 'firebase';
import { AUTH } from '../actions';
import firebase from 'firebase';

import type { FluxStandardAction } from './flux-standard-action';

export type State = {
  uid?: string,
  ...firebase.FirebaseUser
};

type Action = FluxStandardAction<string, firebase.FirebaseUser, *>;

const defaultState = {};

export function reducer(state: State = defaultState, action: Action) {
  switch (action.type) {
    case AUTH.CHANGE:
      return {
        ...state,
        ...action.payload.toJSON()
      };

    default:
      return state;
  }
}
