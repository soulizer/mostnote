import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardGroup,
  Col,
  Container,
  Form,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  Row
} from 'reactstrap';
import {inject, observer} from 'mobx-react';

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
      account
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
      <div className="app flex-row align-items-center">
        {user !== null ? <Redirect to="/notes"/> : ''}

        <Container>
          <Row className="justify-content-center">
            <Col md="8" lg="6">
              <CardGroup>
                <Card className="p-4">
                  <CardBody>
                    <Form onSubmit={(event) => {
                      event.preventDefault();

                      if (disabled) {
                        return;
                      }

                      account.login(email.trim(), password);
                    }}>
                      <h1>Login</h1>
                      <p className="text-muted">Sign In to your account</p>
                      <InputGroup className="mb-3">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText>
                            <i className="icon-user"/>
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input type="text" placeholder="Email" autoComplete="email" value={email}
                               disabled={loggingIn}
                               onChange={(event) => this.setState({email: event.target.value})}/>
                      </InputGroup>
                      <InputGroup className="mb-4">
                        <InputGroupAddon addonType="prepend">
                          <InputGroupText>
                            <i className="icon-lock"/>
                          </InputGroupText>
                        </InputGroupAddon>
                        <Input type="password" placeholder="Password" autoComplete="current-password" value={password}
                               disabled={loggingIn}
                               onChange={(event) => this.setState({password: event.target.value})}/>
                      </InputGroup>
                      <Row>
                        <Col xs="6">
                          <Button color="primary" className="px-4" disabled={disabled}>
                            {loggingIn
                              ? <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true"/>
                              : null}
                            Login
                          </Button>
                        </Col>
                        <Col xs="6" className="text-right">
                          <Link to={'/recover-password'} className="px-0">
                            Forgot password?
                          </Link>
                        </Col>
                      </Row>
                    </Form>
                  </CardBody>
                </Card>
              </CardGroup>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}

export default inject('account')(
  observer(Login)
);
