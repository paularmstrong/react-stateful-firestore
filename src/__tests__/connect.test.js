import configureStore from 'redux-mock-store';
import connect from '../connect';
import { FetchStatus } from '../modules/fetchStatus';
import { initSelectAuth } from '../selectors';
import { shallow } from 'enzyme';
import React, { Component } from 'react';

const mockStore = configureStore();

class MockComponent extends Component {
  render() {
    return 'mock';
  }
}

const defaultState = {
  auth: {},
  collections: {},
  listeners: {},
  queries: {},
  storage: {}
};

describe('connect', () => {
  let mockGetState;
  let mockFirebase;
  let mockSelect;
  let mockSelectStorage;
  let context;

  beforeEach(() => {
    mockSelect = jest.fn(() => () => (state, props) => ({
      fetchStatus: FetchStatus.NONE,
      doc: undefined
    }));
    mockSelectStorage = jest.fn(() => () => (state, props) => ({
      fetchStatus: FetchStatus.NONE,
      downloadUrl: undefined
    }));
    mockGetState = jest.fn(() => defaultState);
    mockFirebase = {
      auth: {},
      firestore: { doc: (path) => ({ path, firestore: true }), collection: (path) => ({ path, firestore: true }) },
      messaging: {},
      select: mockSelect,
      selectStorage: mockSelectStorage,
      storage: { ref: (path) => ({ path, storage: true }) },
      store: mockStore(mockGetState)
    };
    context = { firebase: mockFirebase };
  });

  test('passes props to the wrapped component', () => {
    const user = { fetchStatus: FetchStatus.LOADED, doc: { uid: '123', isAdmin: true } };
    const things = { fetchStatus: FetchStatus.LOADED, docs: [] };
    mockSelect.mockReturnValueOnce(() => () => user).mockReturnValueOnce(() => () => things);
    const ConnectedComponent = connect((select, { firestore }, props) => ({
      user: select(firestore.doc(`users/${props.uid}`)),
      things: select(firestore.collection('things'))
    }))(MockComponent);

    const wrapper = shallow(<ConnectedComponent foo="bar" uid="123" />, { context });

    expect(wrapper.find(MockComponent).props()).toEqual({
      foo: 'bar',
      auth: mockFirebase.auth,
      firestore: mockFirebase.firestore,
      messaging: mockFirebase.messaging,
      storage: mockFirebase.storage,
      uid: '123',
      user,
      things
    });
  });

  test('updates the component when state changes', () => {
    const things = { fetchStatus: FetchStatus.LOADING, docs: [] };
    const selector = jest.fn(() => things);
    mockSelect.mockReturnValue(() => selector);
    const ConnectedComponent = connect((select, { firestore }, props) => ({
      things: select(firestore.collection('things'))
    }))(MockComponent);
    const wrapper = shallow(<ConnectedComponent />, { context });
    expect(wrapper.find(MockComponent).prop('things')).toEqual(things);
    const newThings = { fetchStatus: FetchStatus.LOADED, docs: ['123'] };
    selector.mockReturnValue(newThings);
    mockFirebase.store.dispatch({ type: 'fake' });
    wrapper.update();
    expect(wrapper.find(MockComponent).prop('things')).toEqual(newThings);
  });

  test('calls appropriate selector depending on type given', () => {
    const userOptions = { a: 1 };
    const thingOptions = { b: 2 };
    const imageOptions = { c: 3 };
    const ConnectedComponent = connect((select, { firestore, storage }, props) => ({
      user: select(firestore.doc('user'), userOptions),
      things: select(firestore.collection('things'), thingOptions),
      image: select(storage.ref('image'), imageOptions)
    }))(MockComponent);

    shallow(<ConnectedComponent />, { context });
    expect(mockSelect).toHaveBeenCalledWith({ firestore: true, path: 'user' }, userOptions);
    expect(mockSelect).toHaveBeenCalledWith({ firestore: true, path: 'things' }, thingOptions);
    expect(mockSelectStorage).toHaveBeenCalledWith({ storage: true, path: 'image' }, imageOptions);
  });
});
