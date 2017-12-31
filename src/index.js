// @flow
import connect from './connect';
import connectAuth from './connectAuth';
import Provider from './Provider';
import firebase from 'firebase';
import 'firebase/firestore';
import reducers from './reducers';
import { initSelect, initSelectAuth } from './selectors';
import { setUser, unsetUser } from './actions';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';

let store;

export default function init(app: firebase.app.App, userCollection?: string) {
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

  const currentUser = auth.currentUser;
  let currentUid;
  if (currentUser) {
    currentUid = currentUser.uid;
    store.dispatch(setUser(currentUser));
  }
  auth.onAuthStateChanged((newUser?: any) => {
    store.dispatch(setUser(newUser));
    if (newUser) {
      currentUid = newUser.uid;
    } else {
      store.dispatch(unsetUser(currentUid));
    }
  });

  return { app, select, selectAuth, store };
}

export { connect, connectAuth, Provider };
