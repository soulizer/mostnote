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

import React, {Component, Suspense} from 'react';
import {NavLink, Redirect, Route, Switch} from 'react-router-dom';
import {Container, DropdownItem, DropdownMenu, DropdownToggle, UncontrolledDropdown} from 'reactstrap';
import {AppHeader, AppSidebar, AppSidebarFooter} from '@coreui/react';
import {inject, observer} from 'mobx-react';
import routes from '../../routes';
import {translate} from '../../lang';
import QuickSearch from './QuickSearch';
import Icon from '../../components/Icon';

const NoteHeader = React.lazy(() => import('./NoteHeader'));

class NoteLayout extends Component {
  state = {quickSearch: false};

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>;

  handleKeyDown = (event) => {
    if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.toggleQuickSearch();
    }
  };

  toggleQuickSearch = () => this.setState((state) => ({quickSearch: !state.quickSearch}));

  restoreMenuState = () => {
    // AppSidebar always adds the class on mount, so the stored state must be applied afterwards.
    document.body.classList.toggle('sidebar-lg-show', localStorage.getItem('Plainpad.Sidebar') !== 'closed');

    this.menuObserver = new MutationObserver(() => {
      const {classList} = document.body;
      localStorage.setItem('Plainpad.Sidebar', classList.contains('sidebar-lg-show') ? 'open' : 'closed');
    });

    this.menuObserver.observe(document.body, {attributes: true, attributeFilter: ['class']});
  };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    this.restoreMenuState();
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.menuObserver.disconnect();
  }

  renderNote(note, user) {
    const preview = (note.content || '').replace(/\n/g, ' ').trim().substring(0, 80);
    const tags = note.tags || [];

    return (
      <NavLink
        key={note.id}
        to={'/notes/' + note.id}
        className="note-list-item"
        activeClassName="active"
      >
        <span className="note-list-body">
          <span className="note-list-title">{note.title || translate('notes.untitled')}</span>

          {user.view === 'comfortable' && preview ? (
            <span className="note-list-preview">{preview}</span>
          ) : null}

          {tags.length ? (
            <span className="note-list-tags">
              {tags.slice(0, 2).map((tag) => <span key={tag} className="note-list-tag">{tag}</span>)}
              {tags.length > 2 ? <span className="note-list-tag-more">+{tags.length - 2}</span> : null}
            </span>
          ) : null}
        </span>

        {note.pinned ? <Icon name="pin" size={12} className="note-list-pin"/> : null}
      </NavLink>
    );
  }

  renderUserMenu() {
    const {
      account,
      application,
      history
    } = this.props;

    const {
      user
    } = account;

    const {
      online
    } = application;

    return (
      <AppSidebarFooter>
        <UncontrolledDropdown drop="up" className="sidebar-user-dropdown">
          <DropdownToggle tag="button" className="sidebar-user-toggle">
            <span className="sidebar-user-avatar">{(user.name || user.email || '?').charAt(0).toUpperCase()}</span>
            <span className="sidebar-user-name">{user.name || user.email}</span>
            <Icon name="more" className="sidebar-user-more"/>
          </DropdownToggle>

          <DropdownMenu>
            <DropdownItem tag={NavLink} to="/profile">
              <Icon name="user"/>
              {translate('layout.profile')}
            </DropdownItem>

            {user.admin && online ? (
              <DropdownItem tag={NavLink} to="/users">
                <Icon name="users"/>
                {translate('layout.users')}
              </DropdownItem>
            ) : null}

            {user.admin && online ? (
              <DropdownItem tag={NavLink} to="/settings">
                <Icon name="settings"/>
                {translate('layout.settings')}
              </DropdownItem>
            ) : null}

            <DropdownItem tag={NavLink} to="/about">
              <Icon name="info"/>
              {translate('layout.about')}
            </DropdownItem>

            <DropdownItem tag={NavLink} to="/help">
              <Icon name="help"/>
              {translate('layout.help')}
            </DropdownItem>

            <DropdownItem
              className="sidebar-user-logout"
              onClick={async (event) => {
                event.preventDefault();
                // Wait for the server to revoke the session before leaving the app.
                await account.logout();
                history.push('/login');
              }}
            >
              <Icon name="lock"/>
              {translate('layout.logout')}
            </DropdownItem>
          </DropdownMenu>
        </UncontrolledDropdown>
      </AppSidebarFooter>
    );
  }

  render() {
    const {
      account,
      application,
      notes
    } = this.props;

    const {
      user
    } = account;

    if (!user) {
      return <Redirect to="/login" />;
    }

    const {
      online
    } = application;

    const {
      noteList,
      filter
    } = notes;

    const isNotes = this.props.location && this.props.location.pathname.startsWith('/notes');

    return (
      <div className={`app ${user.theme === 'dark' ? 'dark' : ''}`}>
        <AppHeader fixed>
          <Suspense fallback={this.loading()}>
            <NoteHeader/>
          </Suspense>
        </AppHeader>

        <div className="app-body">
          <AppSidebar className="border-right" fixed display="lg">
            <div className="sidebar-toolbar">
              <div className="sidebar-search">
                <Icon name="search" className="sidebar-search-icon"/>
                <input
                  type="text"
                  value={filter}
                  placeholder={translate('notes.search')}
                  onChange={(event) => notes.updateFilter(event.target.value)}
                />
                {filter.length ? (
                  <button type="button" className="sidebar-search-clear" onClick={() => notes.updateFilter('')}>
                    <Icon name="x"/>
                  </button>
                ) : null}
              </div>

              <button type="button" className="new-note" onClick={() => notes.add()}>
                <Icon name="plus"/>
                {translate('notes.newNote')}
              </button>
            </div>

            <div className="note-list-heading">
              <span>{translate('notes.notes')}</span>
              <span>{noteList.length}</span>
            </div>

            <nav className="note-list">
              {noteList.length
                ? noteList.map((note) => this.renderNote(note, user))
                : notes.syncing
                  ? <div className="note-list-loading"><Icon name="loader" spin/></div>
                  : <div className="note-list-empty">{translate('notes.noNotes')}</div>}
            </nav>

            {this.renderUserMenu()}
          </AppSidebar>

          <QuickSearch isOpen={this.state.quickSearch} toggle={this.toggleQuickSearch} />

          <main className="main">
            <Container fluid className={`h-100 ${isNotes ? 'container-flush' : ''}`}>
              <Suspense fallback={this.loading()}>
                <Switch>
                  {routes.map((route, idx) => {
                    return route.component ? (
                      <Route
                        key={idx}
                        path={route.path}
                        exact={route.exact}
                        name={route.name}
                        render={props => (
                          <route.component {...props} />
                        )} />
                    ) : (null);
                  })}
                  <Redirect from="/" to="/login" />
                </Switch>
              </Suspense>
            </Container>
          </main>

          <div className="offline-mode" hidden={online}>
            Offline
          </div>
        </div>
      </div>
    );
  }
}

export default inject('account', 'notes', 'application')(
  observer(NoteLayout)
);
