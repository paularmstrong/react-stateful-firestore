// @flow
import connect from './connect';
import { FetchStatus } from './modules/fetchStatus';
import { object } from 'prop-types';
import React, { Component } from 'react';

import type firebase from 'firebase';

type AuthUser = { authUser: firebase.FirebaseUser, fetchStatus: $Values<typeof FetchStatus>, user: {} };

type Props = {
  auth: firebase.auth.Auth,
  authUser: AuthUser
};

type AuthStatusHandler = (auth: { ...AuthUser, action?: 'signin' | 'signout' }, props: any) => void;

/**
 * Connect a React component to your Firebase & Firestore auth instance
 * @param  {function} handleAuthStatus  Function to handle authentication changes
 * @return {function}
 */
const connectAuth = (handleAuthStatus: AuthStatusHandler, WrappedLoadingComponent?: React$ComponentType<*>) => (
  WrappedComponent: React$ComponentType<*>
): React$ComponentType<*> => {
  class ConnectAuth extends Component<Props> {
    static displayName = 'ConnectAuth';

    componentWillUpdate(nextProps: Props) {
      const { authUser: prevAuthUser } = this.props;
      const { authUser: nextAuthUser } = nextProps;
      if (prevAuthUser !== nextAuthUser) {
        const action =
          prevAuthUser.doc && !nextAuthUser.doc
            ? 'signout'
            : !prevAuthUser.doc && nextAuthUser.doc ? 'signin' : undefined;
        handleAuthStatus({ ...nextAuthUser, action }, nextProps);
      }
    }

    render() {
      const { authUser: { fetchStatus } } = this.props;
      switch (fetchStatus) {
        case FetchStatus.LOADED:
        case FetchStatus.FAILED:
        case FetchStatus.NONE: {
          return <WrappedComponent {...this.props} />;
        }
        default:
          return WrappedLoadingComponent ? <WrappedLoadingComponent {...this.props} /> : null;
      }
    }
  }

  return connect(({ selectAuth }) => ({
    authUser: selectAuth
  }))(ConnectAuth);
};

export default connectAuth;
