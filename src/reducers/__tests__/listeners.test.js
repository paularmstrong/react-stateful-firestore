import { LISTENERS } from '../../actions';
import { reducer } from '../listeners';

describe('listeners reducer', () => {
  describe(`${LISTENERS.ADD}`, () => {
    test('adds a listener', () => {
      const fn = jest.fn();
      expect(reducer({}, { type: LISTENERS.ADD, payload: fn, meta: { queryId: 'foobar' } })).toEqual({
        foobar: { unsubscribe: fn }
      });
    });
  });

  describe(`${LISTENERS.REMOVE}`, () => {
    test('removes a listener', () => {
      const fn = jest.fn();
      const state = {
        foobar: { unsubscribe: fn },
        tacos: { unsubscribe: fn }
      };
      const newState = { tacos: { unsubscribe: fn } };
      expect(reducer(state, { type: LISTENERS.REMOVE, meta: { queryId: 'foobar' } })).toEqual(newState);
    });
  });
});
