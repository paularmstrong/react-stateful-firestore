import { connect, connectAuth } from 'react-stateful-firestore';
import React, { Component } from 'react';
import Login from './Login';
import { object } from 'prop-types';
import { Link, Route, Switch } from 'react-router-dom';

class App extends Component {
  static propTypes = {
    auth: object,
    authUserDoc: object,
    history: object.isRequired
  };

  render() {
    const { auth, authUserDoc, items } = this.props;
    return (
      <div>
        {auth.currentUser ? (
          <div>
            Logged in as: {auth.currentUser.displayName} <span onClick={this._handleSignOut}>Sign Out</span>
          </div>
        ) : (
          <Link to="/login">Log in</Link>
        )}
        <Switch>
          <Route exact component={Login} path="/login" />
          <Route>
            <div>
              {items.fetchStatus === 'loaded' ? (
                items.docs.map((item) => <p key={item.id}>{JSON.stringify(item, null, 2)}</p>)
              ) : (
                <Loading />
              )}
            </div>
          </Route>
        </Switch>
      </div>
    );
  }

  _handleSignOut = () => {
    this.props.auth.signOut();
  };
}

const Loading = () => <div>Loading…</div>;

export default connectAuth(({ action }, props) => {
  if (action === 'signout') {
    props.history.push('/login');
  }
}, Loading)(
  connect((select, firestore) => ({
    items: select(firestore.collection('items'))
  }))(App)
);
