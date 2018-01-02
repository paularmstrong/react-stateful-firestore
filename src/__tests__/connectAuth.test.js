import configureStore from 'redux-mock-store';
import connectAuth from '../connectAuth';
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

class Loading extends Component {
  render() {
    return 'loading';
  }
}

const defaultState = {
  auth: {},
  collections: {},
  listeners: {},
  queries: {}
};

describe('connectAuth', () => {
  let mockGetState;
  let mockFirebase;
  let mockSelectAuth;
  let context;

  beforeEach(() => {
    mockSelectAuth = jest.fn(() => ({ fetchStatus: FetchStatus.NONE, doc: undefined }));
    mockGetState = jest.fn(() => defaultState);
    mockFirebase = {
      auth: {},
      firestore: {},
      messaging: {},
      selectAuth: mockSelectAuth,
      storage: {},
      store: mockStore(mockGetState)
    };
    context = { firebase: mockFirebase };
  });

  test('renders null while loading', () => {
    mockSelectAuth.mockReturnValue({ fetchStatus: FetchStatus.LOADING });
    const ConnectedComponent = connectAuth()(MockComponent);
    const wrapper = shallow(<ConnectedComponent />, { context });
    expect(wrapper.getElement()).toBe(null);
  });

  test('renders a loading component while loading', () => {
    mockSelectAuth.mockReturnValue({ fetchStatus: FetchStatus.LOADING });
    const ConnectedComponent = connectAuth(() => {}, Loading)(MockComponent);
    const wrapper = shallow(<ConnectedComponent />, { context });
    expect(wrapper.is(Loading)).toBe(true);
  });

  test('passes props to the wrapped component', () => {
    const userDoc = { uid: '123', isAdmin: true };
    mockSelectAuth.mockReturnValue({ fetchStatus: FetchStatus.LOADED, doc: userDoc });
    const ConnectedComponent = connectAuth()(MockComponent);
    const wrapper = shallow(<ConnectedComponent foo="bar" />, { context });
    expect(wrapper.find(MockComponent).props()).toEqual({
      foo: 'bar',
      auth: mockFirebase.auth,
      authFetchStatus: FetchStatus.LOADED,
      authUserDoc: userDoc,
      firestore: mockFirebase.firestore,
      messaging: mockFirebase.messaging,
      storage: mockFirebase.storage
    });
  });

  test('updates the component when state changes', () => {
    mockSelectAuth.mockReturnValue({ fetchStatus: FetchStatus.LOADING, doc: {} });
    const userDoc = { uid: '123', isAdmin: true };
    const ConnectedComponent = connectAuth()(MockComponent);
    const wrapper = shallow(<ConnectedComponent foo="bar" />, { context });
    expect(wrapper.getElement()).toBe(null);
    mockSelectAuth.mockReturnValue({ fetchStatus: FetchStatus.LOADED, doc: userDoc });
    mockFirebase.store.dispatch({ type: 'fake' });
    wrapper.update();
    expect(wrapper.is(MockComponent)).toBe(true);
  });

  test('calls the handler function on update if the state has changed', () => {
    mockSelectAuth.mockReturnValue({ fetchStatus: FetchStatus.LOADING, doc: undefined });
    const userDoc = { uid: '123', isAdmin: true };
    const handler = jest.fn();
    const ConnectedComponent = connectAuth(handler)(MockComponent);
    const wrapper = shallow(<ConnectedComponent foo="bar" />, { context });
    expect(handler).not.toHaveBeenCalled();
    mockSelectAuth.mockReturnValue({ fetchStatus: FetchStatus.LOADED, doc: userDoc });
    mockFirebase.store.dispatch({ type: 'fake' });
    wrapper.update();
    expect(handler).toHaveBeenCalledWith(
      {
        action: 'signin',
        doc: userDoc,
        fetchStatus: FetchStatus.LOADED
      },
      mockFirebase.auth,
      { foo: 'bar' }
    );
  });
});
