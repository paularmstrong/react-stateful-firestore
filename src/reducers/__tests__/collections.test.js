import { COLLECTIONS } from '../../actions';
import { reducer } from '../collections';

const query = { id: 'tacos', path: 'tacos' };

const state = { foo: {}, tacos: { '123': { id: '123', tacos: 2 }, '456': { id: '456' } } };
describe('collections reducer', () => {
  describe(`${COLLECTIONS.MODIFY}`, () => {
    test('returns current state if no docChanges', () => {
      const action = { type: COLLECTIONS.MODIFY, payload: {}, meta: { query } };
      expect(reducer(state, action)).toBe(state);
    });

    test('applies all docChanges', () => {
      const docChanges = [
        { doc: { id: '789', data: () => ({ id: '789', tacos: 3 }) }, type: 'added' },
        { doc: { id: '123', data: () => ({ id: '123', tacos: 4 }) }, type: 'modified' },
        { doc: { id: '456' }, type: 'removed' }
      ];
      const action = { type: COLLECTIONS.MODIFY, payload: { docChanges }, meta: { query } };
      expect(reducer(state, action)).toEqual({
        foo: {},
        tacos: {
          '123': { id: '123', tacos: 4 },
          '789': { id: '789', tacos: 3 }
        }
      });
    });
  });

  describe(`${COLLECTIONS.MODIFY_ONE}`, () => {
    test('replaces the document with the new payload', () => {
      const action = {
        type: COLLECTIONS.MODIFY_ONE,
        payload: { id: '123', data: () => ({ id: '123', tacos: 4 }) },
        meta: { query }
      };
      expect(reducer(state, action)).toEqual({ ...state, tacos: { ...state.tacos, '123': { id: '123', tacos: 4 } } });
    });
  });

  describe(`${COLLECTIONS.REMOVE}`, () => {
    test('removes a document from the collection', () => {
      const action = {
        type: COLLECTIONS.REMOVE,
        payload: { id: '123' },
        meta: { query }
      };
      expect(reducer(state, action).tacos['123']).toBeUndefined();
    });
  });
});
