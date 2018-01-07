import App from './App';
import app from '@firebase/app';
import React from 'react';
import ReactDOM from 'react-dom';
import initFirestore, { Provider } from 'react-stateful-firestore';
import { Route, BrowserRouter as Router } from 'react-router-dom';

const myApp = app.initializeApp({
  apiKey: '<API_KEY>',
  authDomain: '<DOMAIN>',
  databaseURL: '<DB_URL>',
  projectId: '<PROJECT_ID>',
  storageBucket: '<STORAGE_BUCKET>',
  messagingSenderId: '<MESSAGE_ID>'
});

const rootEl = document.getElementById('root');

initFirestore(myApp).then((store) => {
  if (rootEl) {
    ReactDOM.render(
      <Provider store={store}>
        <Router>
          <Route component={App} />
        </Router>
      </Provider>,
      rootEl,
      () => {
        registerServiceWorker();
      }
    );
  }
});
