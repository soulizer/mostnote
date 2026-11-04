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

import account from '../stores/account';
import HttpError from './HttpError';
import OfflineError from './OfflineError';

let reloading = false;

class HttpClient {
  static baseUrl(segment) {
    return process.env.REACT_APP_BASE_URL + '/v1/' + segment;
  }

  static prepare(method, url, data) {
    const input = this.baseUrl(url);

    const headers = {
      'Content-Type': 'application/json'
    };

    if (account.session) {
      headers.Authorization = `Bearer ${account.session.token}`;
    }

    const init = {
      method,
      headers,
      mode: 'cors',
      credentials: 'same-origin',
      redirect: 'follow',
      referrer: 'no-referrer',
      body: data ? JSON.stringify(data) : undefined
    };

    return new Request(input, init);
  }

  static async request(method, url, data, options = {}) {
    if (!navigator.onLine) {
      throw new OfflineError('The application is operating in offline mode.');
    }

    let response;

    try {
      response = await fetch(this.prepare(method, url, data));
    } catch (error) {
      throw new OfflineError(error.message || 'The request could not be completed.');
    }

    if (!response.ok) {
      throw await this.requestError(response, options);
    }

    const text = await response.text();

    return text.length ? JSON.parse(text) : {};
  }

  static async requestError(response, options = {}) {
    // Only a request made while a user is signed in means the session is gone. A failed login attempt must show
    // the error on the form instead of clearing the account and reloading the page (the "flash" after login).
    if (response.status === 401 && !options.ignoreUnauthorized && account.user) {
      account.clear();

      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    }

    let message = response.statusText || 'Request failed';

    try {
      const text = await response.text();

      if (text) {
        try {
          const json = JSON.parse(text);
          message = json.message || message;
        } catch (error) {
          message = text;
        }
      }
    } catch (error) {
      // Keep the status text when the body cannot be read.
    }

    const retryAfterHeader = response.headers.get('Retry-After');
    const retryAfter = retryAfterHeader ? (Number(retryAfterHeader) || retryAfterHeader) : null;

    return new HttpError(message, response.status, retryAfter);
  }
}

export default HttpClient;
