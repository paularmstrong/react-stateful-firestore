// @flow
import { RequestAction } from '../modules/requestAction';

const NAMESPACE = 'firestore';

export const createActionType = (action: string) => `${NAMESPACE}/${action}`;

type RequestActionTypes = {
  REQUEST: string,
  SUCCESS: string,
  FAILURE: string
};

export const createRequestActionTypes = (request: string): RequestActionTypes => {
  return Object.keys(RequestAction).reduce(
    (memo: RequestActionTypes, key: $Keys<RequestActionTypes>) => {
      memo[key] = createActionType(`${request}/${key}`);
      return memo;
    },
    { REQUEST: '', SUCCESS: '', FAILURE: '' }
  );
};
