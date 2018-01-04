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
  selectStorage: () => any,
  store: any
};

type Props = {
  children: React$Node,
  store: FirestoreContext
};

export default class Provider extends Component<Props> {
  static childContextTypes = {
    firebase: any
  };

  getChildContext() {
    const { app, select, selectAuth, selectStorage, store } = this.props.store;
    return {
      firebase: {
        app,
        auth: firebase.auth(app),
        firestore: firebase.firestore(app),
        messaging: firebase.messaging(app),
        select,
        selectAuth,
        selectStorage,
        storage: firebase.storage(app),
        store
      }
    };
  }

  render() {
    return this.props.children;
  }
}
