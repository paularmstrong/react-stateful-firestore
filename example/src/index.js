import App from './App';
import firebase from 'firebase';
import 'firebase/firestore';
import React from 'react';
import ReactDOM from 'react-dom';
import initFirestore, { Provider } from 'react-stateful-firestore';
import { Route, BrowserRouter as Router } from 'react-router-dom';

const app = firebase.initializeApp({
  apiKey: '<API_KEY>',
  authDomain: '<DOMAIN>',
  databaseURL: '<DB_URL>',
  projectId: '<PROJECT_ID>',
  storageBucket: '<STORAGE_BUCKET>',
  messagingSenderId: '<MESSAGE_ID>'
});

const rootEl = document.getElementById('root');

initFirestore(app).then((firestore) => {
  if (rootEl) {
    ReactDOM.render(
      <Provider firestore={firestore}>
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
