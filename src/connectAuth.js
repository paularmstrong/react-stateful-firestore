// @flow
import connect from './connect';
import { FetchStatus } from './modules/fetchStatus';
import { object } from 'prop-types';
import React, { Component } from 'react';

import type { FirebaseUser } from 'firebase';

type AuthUser = { authUser: FirebaseUser, fetchStatus: $Values<typeof FetchStatus>, user: {} };

type Props = {
  auth: AuthUser
};

type AuthStatusHandler = (auth: { ...AuthUser, logged?: 'in' | 'out' }, props: any) => void;

const connectAuth = (handleAuthStatus: AuthStatusHandler, WrappedLoadingComponent?: React$ComponentType<*>) => (
  WrappedComponent: React$ComponentType<*>
): React$ComponentType<*> => {
  class ConnectAuth extends Component<Props> {
    componentWillReceiveProps(nextProps: Props) {
      const { auth: prevAuth } = this.props;
      const { auth: nextAuth } = nextProps;
      if (nextAuth.authUser !== prevAuth.authUser || nextAuth.user !== prevAuth.user) {
        const logged =
          prevAuth.authUser && !nextAuth.authUser ? 'out' : !prevAuth.authUser && nextAuth.authUser ? 'in' : undefined;
        handleAuthStatus({ ...nextAuth, logged }, nextProps);
      }
    }

    render() {
      const { fetchStatus } = this.props.auth;
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
    auth: selectAuth
  }))(ConnectAuth);
};

export default connectAuth;
