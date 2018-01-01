import configureStore from 'redux-mock-store';
import { FetchStatus } from '../modules/fetchStatus';
import thunk from 'redux-thunk';
import { initSelect, initSelectAuth } from '../selectors';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const taco = { id: '123', type: 'delicious' };
const mockState = {
  auth: { uid: '123' },
  collections: { tacos: { [taco.id]: taco } },
  queries: { 'tacos/123': { documentIds: ['123'], fetchStatus: FetchStatus.LOADED } },
  listeners: {}
};
window.requestIdleCallback = jest.fn((cb) => cb());

describe('selectors', () => {
  const query = { id: 'tacos', path: 'tacos', get: () => Promise.resolve(), onSnapshot: jest.fn() };
  let store;
  let selector;

  beforeEach(() => {
    store = mockStore(mockState);
    selector = initSelect(store)(query);
  });

  describe('select', () => {
    test('dispatches adding the query and listener', () => {
      selector();
      expect(store.getActions()).toMatchSnapshot();
    });

    test('returns fetchStatus and user doc', () => {
      const selector = initSelect(store)({ ...query, id: `tacos/${taco.id}`, path: `tacos/${taco.id}` });
      const selectData = selector();
      expect(selectData(mockState)).toMatchSnapshot();
    });

    test('memoizes the response', () => {
      const selector = initSelect(store)({ ...query, id: `tacos/${taco.id}`, path: `tacos/${taco.id}` });
      const selectData = selector();
      const firstState = { ...mockState, collections: { ...mockState.collections, foobar: {} } };
      const secondState = { ...mockState, collections: { ...firstState.collections, foobar: { '456': {} } } };
      expect(selectData(firstState)).toBe(selectData(secondState));
    });
  });

  describe('selectAuth', () => {
    test('returns fetchStatus and user doc', () => {
      let currentUserJSON = { uid: '123' };
      const selectData = initSelectAuth({ currentUser: { uid: '123', toJSON: () => currentUserJSON } }, 'tacos')();
      expect(selectData(mockState)).toMatchSnapshot();
    });

    test('memoizes the response', () => {
      let currentUserJSON = { uid: '123' };
      const selectData = initSelectAuth({ currentUser: { uid: '123', toJSON: () => currentUserJSON } }, 'tacos')();
      const firstState = { ...mockState, collections: { ...mockState.collections, foobar: {} } };
      const secondState = { ...mockState, collections: { ...mockState.collections, foobar: { '456': {} } } };
      expect(selectData(firstState)).toBe(selectData(secondState));
    });

    test('current user busts memoization', () => {
      const toJSON = jest.fn(() => {
        uid: '123';
      });
      const selectData = initSelectAuth({ currentUser: { uid: '123', toJSON } }, 'tacos')();
      const firstData = selectData(mockState);
      const secondState = { ...mockState };
      toJSON.mockReturnValueOnce({ uid: '123', foo: 'bar' });
      expect(firstData).not.toBe(selectData(secondState));
    });
  });
});
