import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom';
import {
  Button,
  Col,
  Form,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Row
} from 'reactstrap';
import {inject, observer} from 'mobx-react';
import {FormattedMessage, injectIntl} from 'react-intl';
import logo from '../../../assets/img/brand/logo.svg';
import './Login.scss';

class Login extends Component {
  constructor(props) {
    super(props);

    // Plain React state keeps the submit button in sync with the inputs. MobX class-field decorations do not
    // trigger a re-render here, which left the button disabled while typing.
    this.state = {
      email: '',
      password: ''
    };
  }

  render() {
    const {
      account,
      intl
    } = this.props;

    const {
      user,
      loggingIn
    } = account;

    const {
      email,
      password
    } = this.state;

    const disabled = loggingIn || !email.trim() || !password;

    return (
      <div className="login-page">
        {user !== null ? <Redirect to="/notes"/> : ''}

        <div className="login-card">
          <img src={logo} className="login-logo" alt="MostNote"/>

          <h1 className="login-title">MostNote</h1>
          <p className="login-subtitle">
            <FormattedMessage id="account.loginSubtitle"/>
          </p>

          <Form onSubmit={(event) => {
            event.preventDefault();

            if (disabled) {
              return;
            }

            account.login(this.state.email.trim(), this.state.password);
          }}>
            <InputGroup>
              <InputGroupAddon addonType="prepend">
                <InputGroupText>
                  <i className="icon-user"/>
                </InputGroupText>
              </InputGroupAddon>
              <Input type="text" placeholder={intl.formatMessage({id: 'account.email'})}
                     autoComplete="email" value={email} disabled={loggingIn}
                     onChange={(event) => this.setState({email: event.target.value})}/>
            </InputGroup>

            <InputGroup>
              <InputGroupAddon addonType="prepend">
                <InputGroupText>
                  <i className="icon-lock"/>
                </InputGroupText>
              </InputGroupAddon>
              <Input type="password" placeholder={intl.formatMessage({id: 'account.password'})}
                     autoComplete="current-password" value={password} disabled={loggingIn}
                     onChange={(event) => this.setState({password: event.target.value})}/>
            </InputGroup>

            <Row className="mt-4">
              <Col xs="12">
                <Button color="primary" block className="login-button" disabled={disabled}>
                  {loggingIn
                    ? <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"/>
                    : null}
                  <FormattedMessage id="account.loginButton"/>
                </Button>
              </Col>
            </Row>
          </Form>

          <div className="login-links">
            <Link to={'/recover-password'}>
              <FormattedMessage id="account.forgotPassword"/>
            </Link>
          </div>

          <div className="login-brand-footer">
            <FormattedMessage id="account.loginFooter"/>
          </div>
        </div>
      </div>
    );
  }
}

export default inject('account')(
  injectIntl(observer(Login))
);
