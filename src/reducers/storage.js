// @flow
import { FetchStatus } from '../modules/fetchStatus';
import { STORAGE } from '../actions';

import type { FullMetadata, Reference } from 'firebase/storage';
import type { FluxStandardAction } from './flux-standard-action';

export type State = {
  [referencePath: string]: {
    downloadUrl?: string,
    error?: Error,
    fetchStatus: $Values<typeof FetchStatus>,
    metadata?: FullMetadata
  }
};

type Meta = {
  reference: Reference
};
type Payload = FullMetadata | string;
type Action = FluxStandardAction<string, Payload, Meta>;

const defaultState = {};

export function reducer(state: State = defaultState, action: Action): State {
  switch (action.type) {
    case STORAGE.URL.REQUEST: {
      const { meta: { reference }, payload } = action;
      return {
        ...state,
        [reference.fullPath]: { ...state[reference.fullPath], fetchStatus: FetchStatus.LOADING }
      };
    }

    case STORAGE.URL.SUCCESS: {
      const { meta: { reference }, payload } = action;
      return {
        ...state,
        [reference.fullPath]: { fetchStatus: FetchStatus.LOADED, downloadUrl: payload }
      };
    }

    case STORAGE.URL.REQUEST: {
      const { meta: { reference }, payload } = action;
      return {
        ...state,
        [reference.fullPath]: { ...state[reference.fullPath], fetchStatus: FetchStatus.FAILED }
      };
    }

    case STORAGE.METADATA.REQUEST: {
      const { meta: { reference }, payload } = action;
      return {
        ...state,
        [reference.fullPath]: { ...state[reference.fullPath], fetchStatus: FetchStatus.LOADING }
      };
    }

    case STORAGE.METADATA.SUCCESS: {
      const { meta: { reference }, payload } = action;
      return {
        ...state,
        [reference.fullPath]: {
          ...state[reference.fullPath],
          downloadUrl: state[reference.fullPath].downloadUrl || payload.downloadUrls[0],
          fetchStatus: FetchStatus.LOADED,
          metadata: payload
        }
      };
    }

    case STORAGE.METADATA.REQUEST: {
      const { meta: { reference }, payload } = action;
      return {
        ...state,
        [reference.fullPath]: { ...state[reference.fullPath], fetchStatus: FetchStatus.FAILED }
      };
    }

    default:
      return state;
  }
}
