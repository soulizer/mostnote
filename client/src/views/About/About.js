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
import {Button, Card, CardBody, CardHeader, Col, Row} from 'reactstrap';

class About extends Component {
  render() {
    return (
      <div className="my-5 animated fadeIn">
        <Row>
          <Col lg="8">
            <Card>
              <CardHeader>
                About
              </CardHeader>
              <CardBody>
                <h5>MostNote</h5>

                <p>
                  MostNote is a self-hosted note taking application based on the open source project Plainpad. Your
                  notes, accounts and settings stay on your own server, with no third-party note service involved.
                </p>

                <p>
                  Multiple users can use the same installation without seeing each other's notes. Notes are cached
                  locally for offline editing and synchronized when the connection returns.
                </p>

                <h5>Attribution</h5>

                <p>
                  MostNote is built on <a href="https://plainpad.org" target="_blank" rel="noopener noreferrer">Plainpad</a>,
                  created by <a href="https://alextselegidis.com" target="_blank" rel="noopener noreferrer">Alex Tselegidis</a>,
                  and is distributed under the GNU General Public License v3.0.
                </p>

                <div className="mb-2">
                  <a href="https://mostnote.com" target="_blank" rel="noopener noreferrer">
                    <Button className="btn-yahoo btn-brand d-block mb-4 d-sm-inline-block mb-sm-0 mr-sm-4">
                      <i className="fa fa-globe"/>
                      <span>Website</span>
                    </Button>
                  </a>

                  <a href="https://github.com/soulizer/mostnote" target="_blank" rel="noopener noreferrer">
                    <Button className="btn-github btn-brand d-block d-sm-inline-block">
                      <i className="fa fa-github"/>
                      <span>GitHub</span>
                    </Button>
                  </a>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>

      </div>
    );
  }
}

export default About;
