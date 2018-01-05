// @flow

import React, { Component } from 'react';
import { object } from 'prop-types';

import type firebase from 'firebase';
import type { StoreState } from './reducers';
import type { Store } from 'redux';

type Props = {};
type State = { [key: string]: any };

type Select = (
  ref: firebase.firestore.DocumentReference | firebase.firestore.CollectionReference | firebase.storage.Reference,
  options: {}
) => any;
type SelectFirestore = (
  ref: firebase.firestore.DocumentReference | firebase.firestore.CollectionReference,
  options: {}
) => any;
type SelectStorage = (ref: firebase.storage.Reference, options: {}) => any;
type SelectorQueryMap = {
  [key: string]: () => (state: any, props: Props) => any
};

type Apis = {
  auth: firebase.auth.Auth,
  firestore: firebase.firestore.Firestore,
  storage: firebase.storage.Storage
};

export const connect = (getSelectors: (select: Select, apis: Apis, props: Props) => SelectorQueryMap) => (
  WrappedComponent: React$ComponentType<*>
): React$ComponentType<*> => {
  return class extends Component<Props, State> {
    _unsubscribe: null | (() => void);
    _selectors: { [key: string]: (state: any, props: Props) => any };
    context: {
      firebase: {
        auth: firebase.auth.Auth,
        firestore: firebase.firestore.Firestore,
        messaging: firebase.messaging.Messaging,
        select: SelectFirestore,
        selectStorage: SelectStorage,
        storage: firebase.storage.Storage,
        store: Store<StoreState, *>
      }
    };

    static displayName = 'Connect';

    static contextTypes = {
      firebase: object.isRequired
    };

    constructor(props: Props, context: any) {
      super(props, context);
      this.state = {};
    }

    componentWillMount() {
      const { auth, firestore, select, selectStorage, storage, store } = this.context.firebase;
      const selector: Select = (ref, options) => {
        if ('firestore' in ref) {
          // $FlowFixMe
          return select(ref, options);
        } else if ('storage' in ref) {
          // $FlowFixMe
          return selectStorage(ref, options);
        }
        throw new Error('Invalid object sent to select.');
      };
      const querySelectors = getSelectors(selector, { auth, firestore, storage }, this.props);
      this._selectors = Object.keys(querySelectors).reduce((memo, propName: string) => {
        memo[propName] = querySelectors[propName]();
        return memo;
      }, {});
      this._unsubscribe = store.subscribe(this._handleState);
      const storeState = store.getState();
      this.setState((state) => this._reduceSelectors(storeState, state));
    }

    componentWillUnmount() {
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
    }

    render() {
      const { auth, firestore, messaging, storage } = this.context.firebase;
      return (
        <WrappedComponent
          {...this.props}
          {...this.state}
          auth={auth}
          firestore={firestore}
          messaging={messaging}
          storage={storage}
        />
      );
    }

    _handleState = () => {
      if (this._unsubscribe) {
        const { store } = this.context.firebase;
        const storeState = store.getState();
        this.setState((state) => this._reduceSelectors(storeState, state));
      }
    };

    _reduceSelectors = (storeState: StoreState, state: State) =>
      Object.keys(this._selectors).reduce((memo, key: string) => {
        state[key] = this._selectors[key](storeState, this.props);
        return state;
      }, state);
  };
};

export default connect;
