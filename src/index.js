// @flow
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
  store = createStore(reducers, applyMiddleware(thunk.withExtraArgument(thunkArgs)));
  if (process.env.NODE_ENV !== 'production') {
    window.redux = store;
  }

  const select = initSelect(store);
  const selectAuth = initSelectAuth(auth, userCollection);

  const currentUser = auth.currentUser;
  if (currentUser) {
    store.dispatch(setUser(currentUser));
  }
  auth.onAuthStateChanged((auth, currentUser?: any) => {
    store.dispatch(unsetUser());
    if (currentUser) {
      store.dispatch(setUser(currentUser));
    }
  });

  return { app, select, selectAuth, store };
}
