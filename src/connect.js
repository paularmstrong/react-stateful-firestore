// @flow
import firebase from 'firebase';
import React, { Component } from 'react';
import { object } from 'prop-types';

import type { StoreState } from './reducers';
import type { Store } from 'redux';

type Props = {};
type State = { [key: string]: any };

type SelectorQueryMap = {
  [key: string]: () => (state: any, props: Props) => any
};

export const connect = (
  getSelectors: (select: any, firestore: firebase.firestore.Firestore, props: Props) => SelectorQueryMap
) => (WrappedComponent: React$ComponentType<*>): React$ComponentType<*> => {
  return class extends Component<Props, State> {
    _unsubscribe: null | (() => void);
    _selectors: { [key: string]: (state: any, props: Props) => any };
    context: {
      firebase: {
        firestore: firebase.firestore.Firestore,
        select: (
          ref: typeof firebase.firestore.DocumentReference | typeof firebase.firestore.CollectionReference
        ) => any,
        selectAuth: () => any,
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
      const { firestore, select, selectAuth, store } = this.context.firebase;
      const querySelectors = getSelectors({ select, selectAuth }, firestore, this.props);
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
      const { firestore } = this.context.firebase;
      return <WrappedComponent {...this.props} {...this.state} firestore={firestore} />;
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
