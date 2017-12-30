// @flow
import { LISTENERS } from '../actions';

import type { FluxStandardAction } from './flux-standard-action';

export type State = {
  [queryId: string]: {
    unsubscribe: () => void
  }
};

type Meta = { queryId: string };
type Action = FluxStandardAction<string, () => void, Meta>;

const defaultState = {};

export function reducer(state: State = defaultState, action: Action) {
  switch (action.type) {
    case LISTENERS.ADD: {
      const { meta: { queryId }, payload } = action;
      return {
        ...state,
        [queryId]: {
          unsubscribe: payload
        }
      };
    }

    case LISTENERS.REMOVE: {
      const { meta: { queryId } } = action;
      return {
        ...state,
        [queryId]: undefined
      };
    }

    default:
      return state;
  }
}
