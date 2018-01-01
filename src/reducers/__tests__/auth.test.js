import { AUTH } from '../../actions';
import { reducer } from '../auth';

describe('auth reducer', () => {
  describe(`${AUTH.CHANGE}`, () => {
    test('returns an empty state if no payload', () => {
      const state = {
        uid: '123',
        displayName: 'Tacos'
      };
      const action = { type: AUTH.CHANGE };
      expect(reducer(state, action)).toEqual({});
    });

    test('converts the payload to JSON', () => {
      const newState = { uid: '123', email: 'tacos@test.com' };
      const action = { type: AUTH.CHANGE, payload: { toJSON: () => newState } };
      expect(reducer({}, action)).toEqual(newState);
    });
  });
});
