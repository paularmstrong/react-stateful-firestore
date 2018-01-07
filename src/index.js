// @flow
import { batchMiddleware } from './middleware/batch';
import connect from './connect';
import connectAuth from './connectAuth';
import firebase from '@firebase/app';
import '@firebase/auth';
import '@firebase/firestore';
import { FetchStatus } from './modules/fetchStatus';
import Provider from './Provider';
import reducers from './reducers';
import { initSelect, initSelectAuth, initSelectStorage } from './selectors';
import { setUser, unsetUser } from './actions';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';

import type { App } from '@firebase/app';
import type { Error as AuthError } from '@firebase/auth';

let store;

export default function init(app: App, userCollection?: string): Promise<any> {
  if (store) {
    throw new Error('Cannot initialize store more than once.');
  }

  const firestore = firebase.firestore(app);
  const auth = firebase.auth(app);

  const thunkArgs = { auth, firestore };
  const middleware = [thunk.withExtraArgument(thunkArgs), batchMiddleware];

  if (process.env.NODE_ENV !== 'production') {
    const createLogger = require('redux-logger').createLogger;
    const logger = createLogger({ collapsed: true, diff: true });
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
      (error: AuthError) => {
        reject(error);
      }
    );
  });
}

export { connect, connectAuth, FetchStatus, Provider };
