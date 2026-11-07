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
import PropTypes from 'prop-types';
import {AppNavbarBrand, AppSidebarToggler} from '@coreui/react';
import {inject, observer} from 'mobx-react';
import logo from '../../assets/img/brand/logo.svg';

const propTypes = {
  children: PropTypes.node,
};

const defaultProps = {};

class NoteHeader extends Component {
  render() {
    const {
      account,
      notes,
      profile
    } = this.props;

    const {
      syncing
    } = notes;

    const {
      user
    } = account;

    return (
      <React.Fragment>
        <AppSidebarToggler className="sidebar-toggler header-action d-lg-none" display="md" mobile>
          <i className="fa fa-bars"/>
        </AppSidebarToggler>

        <AppNavbarBrand>
          <img src={logo} alt="MostNote Logo" width={28} height={28} className="navbar-brand-logo"/>
          <span className="navbar-brand-title">MOSTNOTE</span>
        </AppNavbarBrand>

        <div className="ml-auto header-actions">
          <button
            type="button"
            className={`header-action ${syncing ? 'syncing' : ''}`}
            onClick={() => notes.sync()}
            aria-label="Sync notes"
          >
            <i className="fa fa-refresh"/>
          </button>

          <button
            type="button"
            className="header-action"
            onClick={() => profile.toggleTheme()}
            aria-label="Toggle theme"
          >
            <i className={`fa ${user.theme === 'light' ? 'fa-moon-o' : 'fa-sun-o'}`}/>
          </button>
        </div>
      </React.Fragment>
    );
  }
}

NoteHeader.propTypes = propTypes;
NoteHeader.defaultProps = defaultProps;

export default inject('account', 'notes', 'profile')(
  observer(NoteHeader)
);
