import { createActionType, createRequestActionTypes } from '../actionTypes';

describe('actions', () => {
  describe('createActionType', () => {
    test('returns a namespaced string', () => {
      expect(createActionType('foobar')).toEqual('firestore/foobar');
    });
  });

  describe('createRequestActionTypes', () => {
    test('returns request action types', () => {
      expect(createRequestActionTypes('foobar')).toEqual({
        REQUEST: 'firestore/foobar/REQUEST',
        SUCCESS: 'firestore/foobar/SUCCESS',
        FAILURE: 'firestore/foobar/FAILURE'
      });
    });
  });
});
