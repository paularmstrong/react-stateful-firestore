import * as Actions from '../actions';
import { batchMiddleware } from '../middleware/batch';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

window.requestIdleCallback = jest.fn((cb) => cb());
const defaultState = { auth: {}, collections: {}, listeners: {}, queries: {}, storage: {} };

describe('Actions', () => {
  let store;
  let query;
  let firestore;
  let middlewares;
  let mockStore;
  beforeEach(() => {
    query = { id: 'foo', path: 'foo', get: jest.fn(() => Promise.resolve({})), onSnapshot: jest.fn((cb) => cb({})) };
    firestore = {
      doc: (path) => ({ ...query, id: path, path })
    };
    middlewares = [thunk.withExtraArgument({ firestore }), batchMiddleware];
    mockStore = configureStore(middlewares);
    store = mockStore(defaultState);
  });

  describe('addQuery', () => {
    test('adds the query and executes it', () => {
      return store.dispatch(Actions.addQuery(query)).then(() => {
        expect(store.getActions()).toMatchSnapshot();
        expect(query.get).toHaveBeenCalled();
      });
    });

    test('does nothing if the query is already cached', () => {
      store = mockStore({ ...defaultState, queries: { foo: {} } });
      return store.dispatch(Actions.addQuery(query)).then(() => {
        expect(store.getActions()).toEqual([]);
        expect(query.get).not.toHaveBeenCalled();
      });
    });

    test('adds the query with appropriate documentIds if collection query exists (simple)', () => {
      store = mockStore({ ...defaultState, collections: { foo: { '123': { id: '123' } } }, queries: { foo: {} } });
      return store.dispatch(Actions.addQuery({ ...query, id: 'foo/123', path: 'foo/123' })).then(() => {
        expect(store.getActions()).toMatchSnapshot();
        expect(query.get).not.toHaveBeenCalled();
      });
    });

    test('adds the query with appropriate documentIds if collection query exists (filtered)', () => {
      store = mockStore({
        ...defaultState,
        collections: {
          foo: {
            '123': { id: '123' },
            '456': { id: '456', date: new Date(1600000000000) },
            '789': { id: '789', date: new Date(1400000000000) }
          }
        },
        queries: { foo: {} }
      });
      return store
        .dispatch(
          Actions.addQuery({
            _query: {
              id: 'foo',
              path: { segments: ['foo'] },
              filters: [
                {
                  field: { segments: ['date'] },
                  op: { name: '<' },
                  value: {
                    internalValue: {
                      seconds: 1500000000000
                    },
                    toString() {
                      return 'mock date';
                    }
                  }
                }
              ]
            }
          })
        )
        .then(() => {
          expect(store.getActions()).toMatchSnapshot();
          expect(query.get).not.toHaveBeenCalled();
        });
    });

    test('allows prefixing the queryId', () => {
      return store.dispatch(Actions.addQuery(query, 'tacos|')).then(() => {
        const queryIds = store
          .getActions()
          .filter((action) => !!action.meta.queryId)
          .map((action) => action.meta.queryId);
        expect(queryIds).toEqual(['tacos|foo', 'tacos|foo']);
      });
    });
  });

  describe('addListener', () => {
    test('starts the listener, then adds it', () => {
      return store.dispatch(Actions.addListener(query)).then(() => {
        expect(store.getActions()).toMatchSnapshot();
        expect(query.onSnapshot).toHaveBeenCalled();
      });
    });

    test('does nothing if the listener is active', () => {
      store = mockStore({ ...defaultState, listeners: { foo: {} } });
      return store.dispatch(Actions.addListener(query)).then(() => {
        expect(store.getActions()).toEqual([]);
        expect(query.onSnapshot).not.toHaveBeenCalled();
      });
    });

    test('does nothing if a listener for the collection is active', () => {
      store = mockStore({ ...defaultState, listeners: { foo: {} } });
      return store.dispatch(Actions.addListener({ ...query, id: 'foo/123', path: 'foo/123' })).then(() => {
        expect(store.getActions()).toEqual([]);
        expect(query.onSnapshot).not.toHaveBeenCalled();
      });
    });

    test('allows prefixing the queryId', () => {
      return store.dispatch(Actions.addListener(query, 'tacos|')).then(() => {
        const queryIds = store
          .getActions()
          .filter((action) => !!action.meta.queryId)
          .map((action) => action.meta.queryId);
        expect(queryIds).toEqual(['tacos|foo', 'tacos|foo']);
      });
    });
  });

  describe('removeListener', () => {
    test('unsubscribes from the listener before removing', () => {
      const unsubscribe = jest.fn();
      const store = mockStore({ ...defaultState, listeners: { foo: { unsubscribe } } });
      return store.dispatch(Actions.removeListener(query)).then(() => {
        expect(unsubscribe).toHaveBeenCalled();
        expect(store.getActions()).toEqual([{ type: Actions.LISTENERS.REMOVE, meta: { queryId: 'foo' } }]);
      });
    });
  });

  describe('setUser', () => {
    test('adds queries and listeners', () => {
      return store.dispatch(Actions.setUser({ uid: '123' }, 'users')).then(() => {
        expect(store.getActions()).toMatchSnapshot();
      });
    });

    test('triggers only auth change action if no collection', () => {
      return store.dispatch(Actions.setUser({ uid: '123' })).then(() => {
        expect(store.getActions()).toMatchSnapshot();
      });
    });
  });

  describe('unsetUser', () => {
    test('removes queries, listeners, and the user from the collection', () => {
      store = mockStore({ ...defaultState, listeners: { 'auth|users/123': { unsubscribe: jest.fn() } } });
      return store.dispatch(Actions.unsetUser('123', 'users')).then(() => {
        expect(store.getActions()).toMatchSnapshot();
      });
    });

    test('triggers only auth change action if no collection', () => {
      store = mockStore(defaultState);
      return store.dispatch(Actions.unsetUser('123')).then(() => {
        expect(store.getActions()).toMatchSnapshot();
      });
    });
  });

  describe('getStorageDownloadUrl', () => {
    test('requests download URL', () => {
      store = mockStore(defaultState);
      const getDownloadURL = jest.fn(() => Promise.resolve());
      return store.dispatch(Actions.getStorageDownloadUrl({ fullPath: '/thing', getDownloadURL })).then(() => {
        expect(store.getActions()).toMatchSnapshot();
        expect(getDownloadURL).toHaveBeenCalled();
      });
    });

    test('does nothing if already in state', () => {
      store = mockStore({ ...defaultState, storage: { '/thing': { downloadUrl: '/thing' } } });
      const getDownloadURL = jest.fn(() => Promise.resolve());
      return store.dispatch(Actions.getStorageDownloadUrl({ fullPath: '/thing', getDownloadURL })).then(() => {
        expect(store.getActions()).toEqual([]);
        expect(getDownloadURL).not.toHaveBeenCalled();
      });
    });
  });

  describe('getStorageMetadata', () => {
    test('requests metadata', () => {
      store = mockStore(defaultState);
      const getMetadata = jest.fn(() => Promise.resolve());
      return store.dispatch(Actions.getStorageMetadata({ fullPath: '/thing', getMetadata })).then(() => {
        expect(store.getActions()).toMatchSnapshot();
        expect(getMetadata).toHaveBeenCalled();
      });
    });

    test('does nothing if already in state', () => {
      store = mockStore({ ...defaultState, storage: { '/thing': { downloadUrl: '/thing', metadata: {} } } });
      const getMetadata = jest.fn(() => Promise.resolve());
      return store.dispatch(Actions.getStorageMetadata({ fullPath: '/thing', getMetadata })).then(() => {
        expect(store.getActions()).toEqual([]);
        expect(getMetadata).not.toHaveBeenCalled();
      });
    });
  });
});
