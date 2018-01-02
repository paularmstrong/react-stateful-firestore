// @flow
import { FetchStatus } from './modules/fetchStatus';
import { object } from 'prop-types';
import React, { Component } from 'react';

import type firebase from 'firebase';
import type { StoreState } from './reducers';
import type { Store } from 'redux';

type AuthState = { doc: {}, fetchStatus: $Values<typeof FetchStatus> };

type Props = {};
type State = {
  doc: {},
  fetchStatus: $Values<typeof FetchStatus>
};

type AuthStatusHandler = ({ action?: 'signin' | 'signout', ...State }, auth: firebase.auth.Auth, props: any) => void;

const emptyObject = {};

export const connectAuth = (handleAuthStatus?: AuthStatusHandler, WrappedLoadingComponent?: React$ComponentType<*>) => (
  WrappedComponent: React$ComponentType<*>
): React$ComponentType<*> => {
  return class extends Component<Props, State> {
    _unsubscribe: null | (() => void);
    context: {
      firebase: {
        auth: firebase.auth.Auth,
        firestore: firebase.firestore.Firestore,
        messaging: firebase.messaging.Messaging,
        selectAuth: (state: StoreState) => any,
        storage: firebase.storage.Storage,
        store: Store<StoreState, *>
      }
    };

    static displayName = 'ConnectAuth';

    static contextTypes = {
      firebase: object.isRequired
    };

    constructor(props: Props, context: any) {
      super(props, context);
      this.state = { doc: emptyObject, fetchStatus: FetchStatus.LOADING };
    }

    componentWillMount() {
      const { store } = this.context.firebase;
      this._unsubscribe = store.subscribe(this._handleState);
      this._handleState();
    }

    componentWillUnmount() {
      if (this._unsubscribe) {
        this._unsubscribe();
        this._unsubscribe = null;
      }
    }

    componentWillUpdate(nextProps: Props, nextState: State) {
      const prevState = this.state;
      const { auth } = this.context.firebase;
      if (handleAuthStatus && prevState !== nextState) {
        const action =
          prevState.doc && !nextState.doc ? 'signout' : !prevState.doc && nextState.doc ? 'signin' : undefined;
        handleAuthStatus({ action, doc: nextState.doc, fetchStatus: nextState.fetchStatus }, auth, nextProps);
      }
    }

    render() {
      const { auth, firestore, messaging, storage } = this.context.firebase;
      const { fetchStatus, doc } = this.state;
      const props = {
        auth,
        authFetchStatus: fetchStatus,
        authUserDoc: doc,
        firestore,
        messaging,
        storage
      };
      switch (fetchStatus) {
        case FetchStatus.LOADED:
        case FetchStatus.FAILED:
        case FetchStatus.NONE: {
          return <WrappedComponent {...this.props} {...props} />;
        }
        default:
          return WrappedLoadingComponent ? <WrappedLoadingComponent {...this.props} {...props} /> : null;
      }
    }

    _handleState = () => {
      if (this._unsubscribe) {
        const { selectAuth, store } = this.context.firebase;
        const { doc, fetchStatus } = selectAuth(store.getState());
        this.setState(() => ({ doc, fetchStatus }));
      }
    };
  };
};

export default connectAuth;
