// @flow
import connect from './connect';
import connectAuth from './connectAuth';
import Provider from './Provider';
import { FetchStatus } from './modules/fetchStatus';
import firebase from 'firebase';
import 'firebase/firestore';
import reducers from './reducers';
import { initSelect, initSelectAuth, initSelectStorage } from './selectors';
import { setUser, unsetUser } from './actions';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';

import type { App } from 'firebase/app';

let store;

export default function init(app: App, userCollection?: string): Promise<any> {
  if (store) {
    throw new Error('Cannot initialize store more than once.');
  }

  const firestore = firebase.firestore(app);
  const auth = firebase.auth(app);

  const thunkArgs = { auth, firestore };
  const middleware = [thunk.withExtraArgument(thunkArgs)];
  if (process.env.NODE_ENV !== 'production') {
    const createLogger = require('redux-logger').createLogger;
    const logger = createLogger({ collapsed: true });
    middleware.push(logger);
  }
  store = createStore(reducers, applyMiddleware(...middleware));
  if (process.env.NODE_ENV !== 'production') {
    window.redux = store;
  }

  const select = initSelect(store);
  const selectAuth = initSelectAuth(auth, userCollection);
  const selectStorage = initSelectStorage(store);

  const currentUser = auth.currentUser;
  let currentUid;
  if (currentUser) {
    currentUid = currentUser.uid;
    store.dispatch(setUser(currentUser, userCollection));
  }

  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged(
      (newUser?: any) => {
        store
          .dispatch(setUser(newUser, userCollection))
          .then(() => {
            resolve({ app, select, selectAuth, selectStorage, store });
          })
          .catch((error) => {
            reject(error);
          });
        if (newUser) {
          currentUid = newUser.uid;
        } else {
          store.dispatch(unsetUser(currentUid, userCollection));
        }
      },
      (error: typeof firebase.auth.Error) => {
        reject(error);
      }
    );
  });
}

export { connect, connectAuth, FetchStatus, Provider };
