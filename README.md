# React Stateful Firestore [![build status](https://img.shields.io/travis/paularmstrong/react-stateful-firestore/master.svg?style=flat-square)](https://travis-ci.org/paularmstrong/react-stateful-firestore) [![npm version](https://img.shields.io/npm/v/react-stateful-firestore.svg?style=flat-square)](https://www.npmjs.com/package/react-stateful-firestore) [![npm downloads](https://img.shields.io/npm/dm/react-stateful-firestore.svg?style=flat-square)](https://www.npmjs.com/package/react-stateful-firestore)

Provides bindings for authentication, Firestore, messaging, and storage data in React. Caches Firestore and authentication with Redux to prevent lag on data that has already been queried. Updates in real-time by default.

## Key Goals

* No new query language: uses Firestore queries, collections, etc.
* Minimal setup
* Speed
* Stateful cache with real-time updating
* Secure

## Quick Start

```sh
npm install react-stateful-firestore
# or
yarn add react-stateful-firestore
```

#### Set up Firebase

First import Firebase, Firestore, and initialize your Firebase app.

```js
import firebase from 'firebase';
import 'firebase/firestore';

const app = firebase.initializeApp({
  apiKey: '<API_KEY>',
  authDomain: '<DOMAIN>',
  databaseURL: '<DB_URL>',
  projectId: '<PROJECT_ID>',
  storageBucket: '<STORAGE_BUCKET>',
  messagingSenderId: '<MESSAGE_ID>'
});
```

#### Provide the store

Next, initialize the React-Stateful-Firestore instance and render it in the Provider component.

```js
import initReactFirestore, { Provider } from 'react-stateful-firestore';

initReactFirestore(app).then((store) => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('#root')
  );
});
```

## API

Default Export: [`initReactFirestore`](#initreactfirestoreapp)
Other Exports:

* [`connect`](#connectgetselectors)
* [`connectAuth`](#connectauthhandleauthstate)
* [`FetchStatus`](#fetchstatus)
* [`Provider`](#providerstore-store)

```js
import initReactFirestore, { connect, connectAuth, FetchStatus, Provider } from 'react-stateful-firestore';
```

### initReactFirestore(app)

This method initializes the backing store and authentication handling for your firebase/firestore application.

|         | argument | type             | description                                                            |
| ------- | -------- | ---------------- | ---------------------------------------------------------------------- |
| @param  | `app`    | firebase.app.App | Your firebase app, created with `firebase.initializeApp`               |
| @return |          | `Promise<store>` | A promise providing a store object to send to the `Provider` component |

**Example:**

```js
import initReactFirestore, { Provider } from 'react-stateful-firestore';

initReactFirestore(app).then((store) => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('#root')
  );
});
```

### &lt;Provider store={store}&gt;

This component is necessary to use [`connect`](#connectgetselectors) and [`connectAuth`](#connectauthhandleauthstate) within your application. It provides your Firebase app's instance and special data selectors used internally. It must be provided the `store` prop, as returned in the promise from [`initReactFirestore`](#initreactfirestoreapp).

### connect(getSelectors)

This is a higher order component creator function used to connect your components to data from your Firestore. It accepts a single argument, [getSelectors](#getselectorsselect-firestore-props).

Aside from your defined props in `getSelectors`, `connect` will also provide the following props to your component:

| prop        | type                         | description                            |
| ----------- | ---------------------------- | -------------------------------------- |
| `auth`      | firebase.auth.Auth           | Your app's firebase.auth instance      |
| `firestore` | firebase.firestore.Firestore | Your app's firebase.firestore instance |
| `messaging` | firebase.messaging.Messaging | Your app's firebase.messaging          |
| `storage`   | firebase.storage.Storage     | Your app's firebase.storage            |

**Example:**

```js
import { connect } from 'react-stateful-firestore';

class Article extends Component {
  static propTypes = {
    article: shape({
      error: any,
      fetchStatus: oneOf(['none', 'loading', 'loaded', 'failed']).isRequired, // $Values<typeof FetchStatus>
      doc: object // NOTE: `select(firestore.doc(...))` will provide `doc` (singular)
    }).isRequired,
    articleId: string.isRequired,
    comments: shape({
      error: any,
      fetchStatus: oneOf(['none', 'loading', 'loaded', 'failed']).isRequired, // $Values<typeof FetchStatus>
      docs: arrayOf(object) // NOTE: `select(firestore.collection(...))` will provide `docs` (plural)
    }).isRequired,
    // Automatically provided by `connect()`
    auth: object.isRequired,
    firestore: object.isRequired,
    messaging: object.isRequired,
    storage: object.isRequired
  };

  render() { ... }
}

export default connect((select, firestore, props) => ({
  article: select(firestore.doc(`articles/${props.articleId}`)),
  comments: select(firestore.collection('comments').where('articleId', '==', props.articleId))
}))(Article);

// render(<ConnectedArticle articleId="123" />);
```

#### getSelectors(select, firestore, props)

A function that returns a map of data selectors to props supplied to your final rendered component.

|         | argument    | type                         | description                                 |
| ------- | ----------- | ---------------------------- | ------------------------------------------- |
| @param  | `select`    | [Select](#select)            | A function that selects data from Firestore |
| @param  | `firestore` | firebase.firestore.Firestore | Your app's Firestore instance               |
| @param  | `props`     | object                       | The props provided to your component        |
| @return |             | object                       | A map of selectors to prop names            |

#### Select

|         | argument | type                                                                           | description                                               | example                                                           |
| ------- | -------- | ------------------------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------- |
| @param  | `ref`    | firebase.firestore.DocumentReference or firebase.firestore.CollectionReference | A Document or Collection reference to your Firestore data | `firestore.doc('users/123');` or `firestore.collection('users');` |
| @return |          | function                                                                       |                                                           |                                                                   |

### connectAuth(handleAuthState)

This is a higher order component creator function used to connect your components to authentication state from your Firestore. It accepts a single argument, [handleAuthState](#handleauthstatusstate-auth-props).

`connectAuth` can be used as a gating function to require an authentication status to determine what should be rendered and how to handle authentication state changes.

| prop              | type                         | description                                                               |
| ----------------- | ---------------------------- | ------------------------------------------------------------------------- |
| `authUserDoc`     | object                       | The document from firestore including extra data about the logged in user |
| `authFetchStatus` | [FetchStatus](#fetchstatus)  | The fetch status of the user doc                                          |
| `auth`            | firebase.auth.Auth           | Your app's firebase.auth instance                                         |
| `firestore`       | firebase.firestore.Firestore | Your app's firebase.firestore instance                                    |
| `messaging`       | firebase.messaging.Messaging | Your app's firebase.messaging                                             |
| `storage`         | firebase.storage.Storage     | Your app's firebase.storage                                               |

```js
import { connectAuth } from 'react-stateful-firestore';

class LoginPage extends Component {
  static propTypes = {
    authUserDoc: object, // `undefined` if not logged-in
    authFetchStatus: oneOf(['none', 'loading', 'loaded', 'failed']).isRequired,
    // Also provided by `connectAuth()`
    auth: object.isRequired, // Use this to access the auth user, `auth.currentUser`
    firestore: object.isRequired,
    messaging: object.isRequired,
    storage: object.isRequired
  };

  render() { ... }
}

class Loading extends Component {
  render() {
    return 'Loading…';
  }
}

export default connectAuth(({ action, doc, fetchStatus }, auth, props) => {
  if (action === 'signin') {
    // If the user becomes signed in, push them to the home page.
    props.history.push('/');
  }
}, Loading)(LoginPage);

// render(<ConnectedLoginPage history={history} />);
```

#### handleAuthState(state, auth, props)

A custom function that you create, passed to [`connectAuth`](#connectauthhandleauthstate) to handle the state of authentication within your React application.

|         | argument | type                    | description                                        |
| ------- | -------- | ----------------------- | -------------------------------------------------- |
| @param  | `state`  | [AuthState](#authstate) | The state and state change of user authentication. |
| @param  | `auth`   | firebase.auth.Auth      | Your app's firebase.auth instance                  |
| @param  | `props`  | object                  | The props provided to your component               |
| @return |          | void                    |                                                    |

#### AuthState

|       | key           | type                        | description                                                                                                                                              |
| ----- | ------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @prop | `action`      | string?                     | Either `undefined` (no new action), `'signin'` when the user state has changed to signed-in or `'signout'` when the user state has changed to signed-out |
| @prop | `doc`         | object?                     | The document from firestore including extra data about the logged in user                                                                                |
| @prop | `fetchStatus` | [FetchStatus](#fetchstatus) | The fetch status of the doc.                                                                                                                             |

### FetchStatus

A string representing the status of the query for a document. One of the following:

| key       | value       | description                                         |
| --------- | ----------- | --------------------------------------------------- |
| `NONE`    | `'none'`    | The document has not started loading yet            |
| `LOADING` | `'loading'` | The document is currently in the process of loading |
| `LOADED`  | `'loaded'`  | The document has been successfully received         |
| `FAILED`  | `'failed'`  | There was an error requesting the document          |
