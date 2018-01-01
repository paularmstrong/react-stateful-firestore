import configureStore from 'redux-mock-store';
import { FetchStatus } from '../modules/fetchStatus';
import thunk from 'redux-thunk';
import { initSelect, initSelectAuth } from '../selectors';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
window.requestIdleCallback = jest.fn((cb) => cb());

describe('selectors', () => {
  const query = { id: 'foo', path: 'foo', get: () => Promise.resolve(), onSnapshot: jest.fn() };
  let store;
  let selector;

  beforeEach(() => {
    store = mockStore({ queries: {}, listeners: {} });
    selector = initSelect(store)(query);
  });

  describe('select', () => {
    test('dispatches adding the query and listener', () => {
      selector();
      expect(store.getActions()).toMatchSnapshot();
    });
  });
});
