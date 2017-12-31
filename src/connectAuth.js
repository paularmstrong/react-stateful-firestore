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

const connectAuth = (handleAuthStatus: AuthStatusHandler, WrappedLoadingComponent?: React$ComponentType<*>) => (
  WrappedComponent: React$ComponentType<*>
): React$ComponentType<*> => {
  class ConnectAuth extends Component<Props> {
    static displayName = 'ConnectAuth';

    componentWillUpdate(nextProps: Props) {
      const { authUser: prevAuth } = this.props;
      const { authUser: nextAuth } = nextProps;
      if (nextAuth.authUser !== prevAuth.authUser || nextAuth.user !== prevAuth.user) {
        const action =
          prevAuth.authUser && !nextAuth.authUser
            ? 'signout'
            : !prevAuth.authUser && nextAuth.authUser ? 'signin' : undefined;
        handleAuthStatus({ ...nextAuth, action }, nextProps);
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
