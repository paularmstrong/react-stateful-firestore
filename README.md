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

Install the Firebase dependencies:

```sh
yarn add @firebase/app \
  @firebase/auth \
  @firebase/firestore \
  @firebase/messaging \
  @firebase/storage
# or
npm install --save @firebase/app \
  @firebase/auth \
  @firebase/firestore \
  @firebase/messaging \
  @firebase/storage
```

_Note: We install these packages independently instead of `firebase` to substantially reduce your final bundle size. You can still use `firebase` if you want, but it's not recommended._

Next, initialize your Firebase app.

```js
import app from '@firebase/app';

const myApp = app.initializeApp({
  apiKey: '<API_KEY>',
  authDomain: '<DOMAIN>',
  databaseURL: '<DB_URL>',
  projectId: '<PROJECT_ID>',
  storageBucket: '<STORAGE_BUCKET>',
  messagingSenderId: '<MESSAGE_ID>'
});
```

#### Provide the store

Once your firebase application is initialized, create the React-Stateful-Firestore instance and render it in the Provider component.

```js
import initReactFirestore, { Provider } from 'react-stateful-firestore';

initReactFirestore(myApp).then((store) => {
  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>,
    document.getElementById('#root')
  );
});
```

## API

Default Export: [`initReactFirestore`](#initreactfirestoreapp-usercollection)
Other Exports:

* [`connect`](#connectgetselectors)
* [`connectAuth`](#connectauthhandleauthstate)
* [`FetchStatus`](#fetchstatus)
  * [`resolveFetchStatus`](#resolvefetchstatusitems)
  * [`resolveInitialFetchStatus`](#resolveinitialfetchstatusitems)
* [`Provider`](#providerstore-store)
* [`Types`](#types)

```js
import initReactFirestore, {
  connect,
  connectAuth,
  FetchStatus,
  Provider,
  resolveFetchStatus,
  resolveInitialFetchStatus
} from 'react-stateful-firestore';
```

### initReactFirestore(app, userCollection?)

This method initializes the backing store and authentication handling for your firebase/firestore application.

|         | argument         | type             | description                                                                                                                                                                                    |
| ------- | ---------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @param  | `app`            | firebase.app.App | Your firebase app, created with `firebase.initializeApp`                                                                                                                                       |
| @param  | `userCollection` | string?          | Optional. The collection name of where you store extra data about users. If provided, data will appear on the `authUserDoc` property provided by [`connectAuth`](#connectauthhandleauthstate). |
| @return |                  | `Promise<store>` | A promise providing a store object to send to the `Provider` component                                                                                                                         |

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

This component is necessary to use [`connect`](#connectgetselectors) and [`connectAuth`](#connectauthhandleauthstate) within your application. It provides your Firebase app's instance and special data selectors used internally. It must be provided the `store` prop, as returned in the promise from [`initReactFirestore`](#initreactfirestoreapp-usercollection).

### connect(getSelectors)

This is a higher order component creator function used to connect your components to data from your Firestore. It accepts a single argument, [getSelectors](#getselectorsselect-apis-props).

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
    promoImage: shape({
      error: any,
      fetchStatus: oneOf(['none', 'loading', 'loaded', 'failed']).isRequired, // $Values<typeof FetchStatus>,
      downloadUrl: string
    }),
    // Automatically provided by `connect()`
    auth: object.isRequired,
    firestore: object.isRequired,
    messaging: object.isRequired,
    storage: object.isRequired
  };

  render() { ... }
}

export default connect((select, { firestore, storage }, props) => ({
  article: select(firestore.doc(`articles/${props.articleId}`)),
  comments: select(firestore.collection('comments').where('articleId', '==', props.articleId)),
  promoImage: select(storage.ref('promoimage.jpg'))
}))(Article);

// render(<ConnectedArticle articleId="123" />);
```

#### getSelectors(select, apis, props)

A function that returns a map of props to data selectors supplied to your final rendered component.

|         | argument | type                      | description                                                |
| ------- | -------- | ------------------------- | ---------------------------------------------------------- |
| @param  | `select` | [Select](#select)         | A function that selects data from Firestore and/or Storage |
| @param  | `apis`   | [SelectApis](#selectapis) | Your app's firebase APIs                                   |
| @param  | `props`  | object                    | The props provided to your component                       |
| @return |          | object                    | A map of selectors to prop names                           |

#### Select

|         | argument  | type                                                                                                       | description                                                                                | example                                                                                     |
| ------- | --------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| @param  | `ref`     | firebase.firestore.DocumentReference or firebase.firestore.CollectionReference of firebase.storage.Storage | A Document or Collection reference to your Firestore data or a reference to a Storage item | `firestore.doc('users/123');` or `firestore.collection('users');` or `storage.ref('thing')` |
| @param  | `options` | [SelectOptions](#selectoptions)?                                                                           | Options for the selector                                                                   | `{ subscribe: false }` or `{ metadata: true }`                                              |
| @return |           | function                                                                                                   |                                                                                            |                                                                                             |

#### SelectApis

| prop        | type                         | description                            |
| ----------- | ---------------------------- | -------------------------------------- |
| `auth`      | firebase.auth.Auth           | Your app's firebase.auth instance      |
| `firestore` | firebase.firestore.Firestore | Your app's firebase.firestore instance |
| `messaging` | firebase.messaging.Messaging | Your app's firebase.messaging          |
| `storage`   | firebase.storage.Storage     | Your app's firebase.storage            |

#### SelectOptions

| prop        | type    | default | description                                                                                                                                                           |
| ----------- | ------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `subscribe` | boolean | `true`  | Firestore-only. Add a subscription/listener for Firestore changes. When `true` (default), we will add a listener for database changes and update them as they happen. |
| `metadata`  | boolean | `false` | Storage-only. Get the full metadata of the stored object.                                                                                                             |

### connectAuth(handleAuthState)

This is a higher order component creator function used to connect your components to authentication state from your Firestore. It accepts a single argument, [handleAuthState](#handleauthstatusstate-auth-props).

`connectAuth` can be used as a gating function to require an authentication status to determine what should be rendered and how to handle authentication state changes.

| prop              | type                         | description                                                                                                                                                                                                                                                                                           |
| ----------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authUserDoc`     | object?                      | If not logged in: `undefined`<br>If no `userCollection` provided to [`initReactFirestore`](#initreactfirestoreapp-usercollection): empty object (`{}`)<br>Otherwise when `userCollection` is provided: an object containing the data from the document at `${userCollection}/${auth.currentUser.uid}` |
| `authFetchStatus` | [FetchStatus](#fetchstatus)  | The fetch status of the user doc                                                                                                                                                                                                                                                                      |
| `auth`            | firebase.auth.Auth           | Your app's firebase.auth instance                                                                                                                                                                                                                                                                     |
| `firestore`       | firebase.firestore.Firestore | Your app's firebase.firestore instance                                                                                                                                                                                                                                                                |
| `messaging`       | firebase.messaging.Messaging | Your app's firebase.messaging                                                                                                                                                                                                                                                                         |
| `storage`         | firebase.storage.Storage     | Your app's firebase.storage                                                                                                                                                                                                                                                                           |

```js
import { connectAuth } from 'react-stateful-firestore';

class LoginPage extends Component {
  static propTypes = {
    authUserDoc: object,
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

#### resolveFetchStatus(...items)

Returns a single `FetchStatus` value given the state of multiple Collections or Documents. This method requires that _all_ items are loaded before returning `FetchStatus.LOADED`.

|        | argument | type                                           | description |
| ------ | -------- | ---------------------------------------------- | ----------- |
| @param | …`items` | [`Collection`](#types) or [`Document`](#types) |             |

#### resolveInitialFetchStatus(...items)

Returns a single `FetchStatus` value given the _initial_ state of multiple Collections or Documents. This method will return `FetchStatus.LOADED` if _any_ item is loaded.

|        | argument | type                                           | description |
| ------ | -------- | ---------------------------------------------- | ----------- |
| @param | …`items` | [`Collection`](#types) or [`Document`](#types) |             |

## Types

React Stateful Firestore also exposes a few flow types.

### $FetchStatus

A FetchStatus value.

### Document<D>

Creates a type for documents provided as props on your `connect`ed components.

```js
type MyDocument = Document<{ name: string }>

const doc: MyDocument;
console.log(doc.fetchStatus); // -> A $FetchStatus
console.log(doc.id); // -> The Firestore document id
console.log(doc.doc); // -> The data in the document on Firestore
```

### Collection<D>

Creates a type for collections provided as props on your `connect`ed components

```js
type MyCollection = Collection<{ name: string }>

const collection: MyCollection;
console.log(collection.fetchStatus); // -> A $FetchStatus
console.log(collection.docs); // -> Array of Documents
```
