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
import {inject, observer} from 'mobx-react';
import TextareaAutosize from 'react-textarea-autosize';
import moment from 'moment';
import WelcomeMessage from './WelcomeMessage';
import NoteContextMenu from './NoteContextMenu';
import {translate} from '../../lang';

class Notes extends Component {
  constructor(props) {
    super(props);
    this.textarea = React.createRef();
    this.scrollContainer = React.createRef();
    this.state = {
      contextMenu: {
        visible: false,
        x: 0,
        y: 0
      },
      disableCustomMenu: false,
      tagInput: ''
    };
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.hideContextMenu = this.hideContextMenu.bind(this);
    this.handleShowNativeMenu = this.handleShowNativeMenu.bind(this);
    this.handleTagKeyDown = this.handleTagKeyDown.bind(this);
  }

  handleShowNativeMenu() {
    // Disable custom menu and allow native menu on next right-click
    this.setState({ disableCustomMenu: true }, () => {
      // Focus the textarea
      if (this.textarea.current) {
        this.textarea.current.focus();
      }
    });
  }

  handleKeyDown(event) {
    // Handle Tab key: insert 4 spaces at cursor position or replace selection
    if (event.key === 'Tab' || event.keyCode === 9) {
      event.preventDefault();

      const ta = this.textarea.current;
      const { notes } = this.props;

      if (!ta) {
        return;
      }

      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value || '';
      const insert = '    ';

      const newValue = value.substring(0, start) + insert + value.substring(end);

      // Update the store (which will update the textarea value)
      notes.updateContent(newValue);

      // Restore caret position after DOM update
      setTimeout(() => {
        try {
          if (ta.setSelectionRange) {
            const pos = start + insert.length;
            ta.setSelectionRange(pos, pos);
          }
        } catch (e) {
          // ignore if unable to set selection
        }
      }, 0);
    }
  }

  handleContextMenu(event) {
    // Allow native context menu if disabled flag is set
    if (this.state.disableCustomMenu) {
      // Re-enable custom menu after this event
      setTimeout(() => {
        this.setState({ disableCustomMenu: false });
      }, 100);
      return;
    }

    event.preventDefault();

    this.setState({
      contextMenu: {
        visible: true,
        x: event.clientX,
        y: event.clientY
      }
    });
  }

  hideContextMenu() {
    this.setState({
      contextMenu: {
        visible: false,
        x: 0,
        y: 0
      }
    });
  }

  handleTagKeyDown(event) {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    const { notes } = this.props;

    notes.addTag(this.state.tagInput);
    this.setState({tagInput: ''});
  }

  componentDidMount() {
    const {
      account,
      notes,
      match
    } = this.props;

    if (!account.session) {
      return;
    }

    const id = match.params.id;

    if (id) {
      notes.select(id);
    }

    // Add click listener to hide context menu when clicking outside
    document.addEventListener('click', this.hideContextMenu);
  }

  componentDidUpdate(prevProps) {
    const {
      notes,
      match
    } = this.props;

    const id = match.params.id;
    const previousId = prevProps.match.params.id;

    if (id && id !== previousId) {
      notes.select(id);
    }

    // A different note was loaded, so drop the scroll offset and tag input of the previous one.
    if (this.noteId !== notes.id) {
      this.noteId = notes.id;
      this.setState({tagInput: ''});

      if (this.scrollContainer.current) {
        this.scrollContainer.current.scrollTop = 0;
      }
    }
  }

  componentWillUnmount() {
    // Reset notes state
    this.props.notes.reset();

    // Ensure we're in a browser environment before touching document
    if (typeof document !== 'undefined' && document && document.title !== undefined) {
      document.title = 'MostNote';
    }

    // Clean up event listener
    document.removeEventListener('click', this.hideContextMenu);
  }

  render() {
    const {
      account,
      notes
    } = this.props;

    const {
      id,
      title,
      content,
      pinned,
      tags,
      saving,
      updatedAt
    } = notes;

    if (!id) {
      return <WelcomeMessage/>;
    }

    const {
      user
    } = account;

    const {contextMenu, tagInput} = this.state;

    return (
      <div className="editor-shell">
        <div className="editor-toolbar">
          <div className={`editor-save-state ${saving ? 'saving' : ''}`}>
            <i className={`fa ${saving ? 'fa-spinner fa-spin' : 'fa-check'}`}/>
            <span>{saving ? translate('notes.saving') : translate('notes.saved')}</span>
          </div>

          <div className="editor-actions">
            <button
              type="button"
              className={`editor-action ${pinned ? 'active' : ''}`}
              onClick={() => pinned ? notes.unpin() : notes.pin()}
              title={translate(pinned ? 'notes.unpin' : 'notes.pin')}
            >
              <i className="fa fa-thumb-tack"/>
            </button>

            <button
              type="button"
              className="editor-action"
              onClick={() => notes.download()}
              title={translate('notes.download')}
            >
              <i className="fa fa-download"/>
            </button>

            {typeof navigator !== 'undefined' && navigator.canShare ? (
              <button
                type="button"
                className="editor-action"
                onClick={() => notes.share()}
                title={translate('notes.share')}
              >
                <i className="fa fa-share-alt"/>
              </button>
            ) : null}

            <button
              type="button"
              className="editor-action editor-action-danger"
              onClick={() => notes.delete()}
              title={translate('notes.delete')}
            >
              <i className="fa fa-trash"/>
            </button>
          </div>
        </div>

        <div className="editor-scroll" ref={this.scrollContainer}>
          <div className={`editor-content ${user.line === 'full' ? 'full-line' : 'narrow-line'}`}>
            <input
              type="text"
              className="note-title-input"
              value={title}
              placeholder={translate('notes.untitled')}
              onChange={(event) => notes.updateTitle(event.target.value)}
            />

            <div className="note-tags">
              <i className="fa fa-tags note-tags-icon"/>

              {tags.map((tag) => (
                <span className="note-tag" key={tag}>
                  {tag}
                  <button type="button" onClick={() => notes.removeTag(tag)} aria-label={translate('notes.delete')}>
                    <i className="fa fa-times"/>
                  </button>
                </span>
              ))}

              <input
                type="text"
                className="note-tag-input"
                value={tagInput}
                placeholder={translate('notes.addTag')}
                onChange={(event) => this.setState({tagInput: event.target.value})}
                onKeyDown={this.handleTagKeyDown}
              />
            </div>

            <TextareaAutosize
              ref={this.textarea}
              className="note-content"
              value={content}
              minRows={12}
              onKeyDown={this.handleKeyDown}
              onContextMenu={this.handleContextMenu}
              onChange={(event) => notes.updateContent(event.target.value)}
            />
          </div>
        </div>

        <div className="editor-status">
          <div className="editor-status-left">
            <span>{translate('notes.characters')}: {content.length}</span>
            <span>{translate('notes.tags')}: {tags.length}</span>
          </div>

          <div className="editor-status-right">
            {updatedAt ? `${translate('notes.modified')}: ${moment(updatedAt).format('MMM DD, YYYY HH:mm')}` : ''}
          </div>
        </div>

        <NoteContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          textareaRef={this.textarea}
          notes={notes}
          pinned={pinned}
          onClose={this.hideContextMenu}
          onContentUpdate={(newValue) => notes.updateContent(newValue)}
          onShowNativeMenu={this.handleShowNativeMenu}
        />
      </div>
    );
  }
}

export default inject('account', 'notes')(
  observer(Notes)
);
