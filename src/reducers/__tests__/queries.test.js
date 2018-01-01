import { FetchStatus } from '../../modules/fetchStatus';
import { QUERIES } from '../../actions';
import { reducer } from '../queries';

const state = {
  barfoo: { documentIds: [], fetchStatus: FetchStatus.NONE },
  'foobar/123': {
    documentIds: ['123', '456'],
    fetchStatus: FetchStatus.LOADED
  }
};

describe('queries reducer', () => {
  describe(`${QUERIES.REQUEST}`, () => {
    test('adds the query and sets fetchStatus', () => {
      const action = { type: QUERIES.REQUEST, meta: { queryId: 'tacos' } };
      expect(reducer(state, action)).toEqual({
        ...state,
        tacos: { documentIds: [], fetchStatus: FetchStatus.LOADING }
      });
    });
  });

  describe(`${QUERIES.SUCCESS}`, () => {
    test('modifies a single document', () => {
      const action = { type: QUERIES.SUCCESS, payload: { id: '456' }, meta: { queryId: 'barfoo' } };
      expect(reducer(state, action)).toEqual({
        ...state,
        barfoo: { documentIds: ['456'], fetchStatus: FetchStatus.LOADED }
      });
    });

    test('modifies multiple documents', () => {
      const docChanges = [
        { doc: { id: '456', newIndex: 1 }, type: 'modified' },
        { doc: { id: '123', newIndex: -1 }, type: 'removed' },
        { doc: { id: '789', newIndex: 0 }, type: 'added' }
      ];
      const action = { type: QUERIES.SUCCESS, payload: { docChanges }, meta: { queryId: 'foobar/123' } };
      expect(reducer(state, action)).toEqual({
        ...state,
        'foobar/123': {
          documentIds: ['789', '456'],
          fetchStatus: FetchStatus.LOADED
        }
      });
    });
  });

  describe(`${QUERIES.FAILURE}`, () => {
    test('sets the error and fetchStatus', () => {
      const error = new Error();
      const action = { type: QUERIES.FAILURE, payload: error, meta: { queryId: 'foobar/123' } };
      expect(reducer(state, action)).toEqual({
        ...state,
        'foobar/123': { documentIds: ['123', '456'], error, fetchStatus: FetchStatus.FAILED }
      });
    });
  });

  describe(`${QUERIES.REMOVE}`, () => {
    test('removes a query', () => {
      const action = { type: QUERIES.REMOVE, meta: { queryId: 'foobar/123' } };
      expect(reducer(state, action)).toEqual({ barfoo: state.barfoo });
    });
  });
});
