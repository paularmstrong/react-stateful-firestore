import configureStore from 'redux-mock-store';
import { FetchStatus } from '../modules/fetchStatus';
import thunk from 'redux-thunk';
import { initSelect, initSelectAuth } from '../selectors';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const taco = { id: '123', type: 'delicious' };
const mockState = { auth: { uid: '123' }, collections: { tacos: { [taco.id]: taco } }, queries: {}, listeners: {} };
window.requestIdleCallback = jest.fn((cb) => cb());

describe('selectors', () => {
  const query = { id: 'foo', path: 'foo', get: () => Promise.resolve(), onSnapshot: jest.fn() };
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

    test('memoizes the response', () => {
      const selector = initSelect(store)({ ...query, id: `tacos/${taco.id}`, path: `tacos/${taco.id}` });
      const selectData = selector();
      const firstState = { ...mockState, collections: { foobar: {} } };
      const secondState = { ...mockState, collections: { ...firstState.collections, foobar: { '456': {} } } };
      expect(selectData(firstState)).toBe(selectData(secondState));
    });
  });

  describe('selectAuth', () => {
    test('memoizes the response', () => {
      const selectData = initSelectAuth({ currentUser: { uid: '123' } }, 'tacos')();
      const firstState = { ...mockState, collections: { foobar: {} } };
      const secondState = { ...mockState, collections: { ...firstState.collections, foobar: { '456': {} } } };
      expect(selectData(firstState)).toBe(selectData(secondState));
    });
  });
});
