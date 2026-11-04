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

import {decorate, observable} from 'mobx';
import {translate} from '../lang';
import application from './application';
import notes from './notes';
import OfflineError from '../http/OfflineError';
import SessionsHttpClient from '../http/SessionsHttpClient';
import UsersHttpClient from '../http/UsersHttpClient';
import storage from '../storage';

const ACCOUNT_KEY = 'Plainpad.Account';

class AccountStore {
  session = null;
  user = null;
  passwordRecovered = false;
  passwordReset = false;
  loggingIn = false;
  expirationTimeout = null;

  load(account) {
    if (!account || !account.session || !account.session.token || !account.user) {
      // A partially written or pre-1.2 account must not be used; it caused requests for an undefined user and
      // reload loops on the login screen.
      this.clear();
      return;
    }

    const expires = this.expirationDate(account.session.expires_at);

    if (!expires || expires.getTime() <= Date.now()) {
      this.clear();
      return;
    }

    this.user = account.user;
    this.session = account.session;

    this.observeSessionExpiration();

    notes.list();
    notes.sync();
  }

  expirationDate(value) {
    if (!value) {
      return null;
    }

    // Older servers returned a UTC timestamp without an offset ("Y-m-d H:i:s"). Browsers parse that as local
    // time, which made the client expire the session hours too early in some timezones.
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) {
      value = value.replace(' ', 'T') + 'Z';
    }

    const date = new Date(value);

    return isNaN(date.getTime()) ? null : date;
  }

  async login(email, password) {
    if (this.loggingIn) {
      return;
    }

    this.loggingIn = true;

    try {
      const session = await SessionsHttpClient.create(email, password);

      this.session = session;

      const user = await UsersHttpClient.retrieve(session.user_id);

      this.user = user;

      const account = {
        session,
        user
      };

      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));

      this.observeSessionExpiration();

      application.success(translate('account.successfullyLoggedIn'));

      try {
        await notes.list();
        await notes.sync();
      } catch (error) {
        // The user is signed in already, a failing sync must not be reported as a failed login.
        console.error(error);
      }
    } catch (error) {
      this.clear();
      this.loginError(error);
      console.error(error);
    } finally {
      this.loggingIn = false;
    }
  }

  loginError(error) {
    if (error instanceof OfflineError) {
      application.error(translate('account.networkError'));
      return;
    }

    switch (error && error.code) {
      case 401:
        application.error(translate('account.invalidCredentials'));
        break;
      case 422:
        application.error(translate('account.invalidInput'));
        break;
      case 429: {
        const minutes = error.retryAfter ? Math.ceil(Number(error.retryAfter) / 60) : null;
        application.error(translate('account.tooManyAttempts', {minutes: minutes || 15}));
        break;
      }
      default:
        application.error(translate('account.failedToLogIn'));
    }
  }

  async logout() {
    if (this.user) {
      await this.removeLocalNotes();
    }

    // Revoke the session before clearing the user, clearing it already shows the login page.
    if (this.session) {
      try {
        await SessionsHttpClient.delete(this.session);
        application.success(translate('account.successfullyLoggedOut'));
      } catch (error) {
        application.error(translate('account.failedToLogOut'));
        console.error(error);
      }
    }

    this.clear();
  }

  clear() {
    if (this.expirationTimeout) {
      clearTimeout(this.expirationTimeout);
      this.expirationTimeout = null;
    }

    localStorage.removeItem(ACCOUNT_KEY);
    notes.reset();
    notes.empty();
    this.user = null;
    this.session = null;
  }

  async removeLocalNotes() {
    // Upload pending changes first, notes that still cannot be synced (e.g. offline) stay on the device so that they
    // are not lost and get uploaded on the next login.
    try {
      // The first call waits for a sync that may already be running (it would write into the database after the drop),
      // the second one uploads the latest changes.
      await notes.sync();
      await notes.sync();
      clearTimeout(notes.syncTimeout);

      if (await storage.table('sync').length() === 0) {
        await storage.drop();
      }
    } catch (error) {
      console.error(error);
    }
  }

  async recoverPassword(email) {
    try {
      await UsersHttpClient.recoverPassword(email);
      this.passwordRecovered = true;
      application.success(translate('account.successfullyRecoveredPassword'));
    } catch (error) {
      application.error(translate('account.failedToRecoverPassword'));
      console.error(error);
    }
  }

  async resetPassword(email, token, password, confirm) {
    if (password !== confirm) {
      application.error(translate('account.passwordsDoNotMatch'));
      return;
    }

    try {
      await UsersHttpClient.resetPassword(email, token, password);
      this.passwordReset = true;
      application.success(translate('account.successfullyResetPassword'));
    } catch (error) {
      application.error(translate('account.failedToResetPassword'));
      console.error(error);
    }
  }

  observeSessionExpiration() {
    if (this.expirationTimeout) {
      clearTimeout(this.expirationTimeout);
      this.expirationTimeout = null;
    }

    if (!this.session) {
      return;
    }

    const expires = this.expirationDate(this.session.expires_at);

    if (!expires || expires.getTime() <= Date.now()) {
      application.warning(translate('account.sessionExpired'));
      // The server session is already invalid, revoking it again would only trigger another 401.
      this.clear();
      return;
    }

    const remaining = expires.getTime() - Date.now();

    this.expirationTimeout = setTimeout(() => this.observeSessionExpiration(), Math.min(remaining, 60000));
  }
}

decorate(AccountStore, {
  user: observable,
  passwordRecovered: observable,
  passwordReset: observable,
  session: observable,
  loggingIn: observable,
});

export default new AccountStore();
