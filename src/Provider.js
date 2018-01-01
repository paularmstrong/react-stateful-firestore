// @flow
import { Component } from 'react';
import firebase from 'firebase';
import 'firebase/firestore';
import { any } from 'prop-types';

import type { App } from 'firebase/app';

type FirestoreContext = {
  app: App,
  select: () => any,
  selectAuth: () => any,
  store: any
};

type Props = {
  children: React$Node,
  firestore: FirestoreContext
};

/**
 * Provide your firebase instance to the application
 * @class Provider
 * @param {Object} firebase The react-stateful-firebase instance
 */
export default class Provider extends Component<Props> {
  static childContextTypes = {
    firebase: any
  };

  getChildContext() {
    const { app, select, selectAuth, store } = this.props.firestore;
    return {
      firebase: {
        app,
        auth: firebase.auth(app),
        firestore: firebase.firestore(app),
        messaging: firebase.messaging(app),
        select,
        selectAuth,
        storage: firebase.storage(app),
        store
      }
    };
  }

  render() {
    return this.props.children;
  }
}
