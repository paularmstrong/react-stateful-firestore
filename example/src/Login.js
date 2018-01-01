import { connectAuth } from 'react-stateful-firestore';
import React, { Component } from 'react';
import { object } from 'prop-types';

class Login extends Component {
  static propTypes = {
    auth: object,
    authUser: object,
    history: object.isRequired
  };

  constructor(props, context) {
    super(props, context);
    this.state = { email: '', password: '' };
  }

  render() {
    const { auth } = this.props;
    const { error } = this.state;
    return (
      <form onSubmit={this._handleSignIn}>
        {error ? <div>{error.message}</div> : null}
        <label>
          Email Address
          <input name="email" type="email" onChange={this._setEmail} />
        </label>
        <label>
          Email Address
          <input name="password" type="password" onChange={this._setPassword} />
        </label>
        <button onClick={this._handleSignIn} type="submit">
          Log In
        </button>
      </form>
    );
  }

  _setEmail = (event) => {
    this.setState({ email: event.target.value });
  };

  _setPassword = (event) => {
    this.setState({ password: event.target.value });
  };

  _handleSignIn = (event) => {
    event.preventDefault();
    const { email, password } = this.state;
    const { auth, history } = this.props;
    auth
      .signInWithEmailAndPassword(email, password)
      .then(() => {
        history.push('/');
      })
      .catch((error) => {
        this.setState({ error });
      });
  };
}

const Loading = () => <div>Loading…</div>;

export default connectAuth((auth, props) => {
  // Already signed in. Kick back to main page
  if (auth.authUser) {
    props.history.replace('/');
  }
}, Loading)(Login);
