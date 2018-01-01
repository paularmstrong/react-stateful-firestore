# React Stateful Firestore

Provides bindings for authentication, Firestore, messaging, and storage data in React. Caches Firestore and authentication with Redux to prevent lag on data that has already been queried. Updates in real-time by default.

## Key Goals

* No new query language: uses Firestore queries, collections, etc.
* Minimal setup
* Speed
* Stateful cache with real-time updating
* Secure

## Quick Start

```js
import firebase from 'firebase';
import 'firebase/firestore';
import React from 'react';
import ReactDOM from 'react-dom';
import initFirestore, { Provider } from 'react-stateful-firestore';

const app = firebase.initializeApp({
  apiKey: '<API_KEY>',
  authDomain: '<DOMAIN>',
  databaseURL: '<DB_URL>',
  projectId: '<PROJECT_ID>',
  storageBucket: '<STORAGE_BUCKET>',
  messagingSenderId: '<MESSAGE_ID>'
});

initFirestore(app).then((firestore) => {
  ReactDOM.render(
    <Provider firestore={firestore}>
      <App />
    </Provider>,
    document.getElementById('root')
  );
});
```

```js
class App extends Component {
  static propTypes = {
    menu: shape({ error: any, fetchStatus: string, docs: arrayOf(object) })
  };

  render() {
    const { menu } = this.props;
    return menu.fetchStatus === 'loading' ? (
      <Loading />
    ) : (
      <div>{menu.docs.map((menuItem) => <MenuItem data={menuItem} key={menuItem.id} />)}</div>
    );
  }
}

export default connect(({ select }, firestore) => ({
  menu: firestore.collection('menu')
}))(App);
```
