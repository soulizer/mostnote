/*
  Plainpad - Self Hosted Note Taking App

  Copyright (C) Alex Tselegidis - https://alextselegidis.com

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>
*/

import React, {Component} from 'react';
import Icon from '../../components/Icon';
import {inject, observer} from 'mobx-react';
import {Button} from 'reactstrap';
import {FormattedMessage} from 'react-intl';
import logo from '../../assets/img/brand/logo.svg';

class WelcomeMessage extends Component {
  render() {
    const {
      notes
    } = this.props;

    return (
      <div className="welcome">
        <img src={logo} alt="MostNote Logo" className="welcome-logo"/>

        <h1>
          <FormattedMessage id="notes.welcome"/>
        </h1>

        <p>
          <FormattedMessage id="notes.selectNoteOrCreate"/>
        </p>

        <Button color="primary" onClick={() => notes.add()}>
          <Icon name="plus" className="mr-2"/>
          <FormattedMessage id="notes.newNote"/>
        </Button>
      </div>
    );
  }
}

export default inject('notes')(
  observer(WelcomeMessage)
);
