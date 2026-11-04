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

class NoteContextMenu extends Component {
  constructor(props) {
    super(props);
    this.handleCopy = this.handleCopy.bind(this);
    this.handleCut = this.handleCut.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
    this.handleShowOriginalMenu = this.handleShowOriginalMenu.bind(this);
  }

  handleCopy() {
    const { textareaRef, onClose } = this.props;
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selectedText = ta.value.substring(start, end);

    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
    }
    onClose();
  }

  handleCut() {
    const { textareaRef, onContentUpdate, onClose } = this.props;
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selectedText = ta.value.substring(start, end);

    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
      const newValue = ta.value.substring(0, start) + ta.value.substring(end);
      onContentUpdate(newValue);

      setTimeout(() => {
        try {
          if (ta.setSelectionRange) {
            ta.setSelectionRange(start, start);
          }
        } catch (e) {
          // ignore if unable to set selection
        }
      }, 0);
    }
    onClose();
  }

  async handlePaste() {
    const { textareaRef, onContentUpdate, onClose } = this.props;
    const ta = textareaRef.current;
    if (!ta) return;

    try {
      const clipboardText = await navigator.clipboard.readText();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const value = ta.value || '';

      const newValue = value.substring(0, start) + clipboardText + value.substring(end);
      onContentUpdate(newValue);

      setTimeout(() => {
        try {
          if (ta.setSelectionRange) {
            const pos = start + clipboardText.length;
            ta.setSelectionRange(pos, pos);
          }
        } catch (e) {
          // ignore if unable to set selection
        }
      }, 0);
    } catch (e) {
      console.error('Failed to read clipboard:', e);
    }
    onClose();
  }

  handleShowOriginalMenu() {
    const { onClose, onShowNativeMenu } = this.props;
    onClose();
    onShowNativeMenu();
  }

  render() {
    const { visible, x, y, pinned, notes, onClose } = this.props;

    if (!visible) {
      return null;
    }

    return (
      <div
        className="custom-context-menu"
        style={{
          position: 'fixed',
          top: `${y}px`,
          left: `${x}px`,
          zIndex: 10000
        }}
      >
        <div className="context-menu-item" onClick={this.handleCopy}>
          <i className="fa fa-copy"/>
          Copy
        </div>
        <div className="context-menu-item" onClick={this.handleCut}>
          <i className="fa fa-cut"/>
          Cut
        </div>
        <div className="context-menu-item" onClick={this.handlePaste}>
          <i className="fa fa-paste"/>
          Paste
        </div>
        <div
          className="context-menu-item"
          onClick={() => {
            notes.download();
            onClose();
          }}
        >
          <i className="fa fa-cloud-download"/>
          Download
        </div>
        {navigator.canShare && (
          <div
            className="context-menu-item"
            onClick={() => {
              notes.share();
              onClose();
            }}
          >
            <i className="fa fa-share-alt"/>
            Share
          </div>
        )}
        <div
          className="context-menu-item"
          onClick={() => {
            if (pinned) {
              notes.unpin();
            } else {
              notes.pin();
            }
            onClose();
          }}
        >
          <i className="fa fa-thumb-tack"/>
          {pinned ? 'Unpin' : 'Pin'}
        </div>
        <div
          className="context-menu-item danger"
          onClick={() => {
            notes.delete();
            onClose();
          }}
        >
          <i className="fa fa-trash"/>
          Delete
        </div>
        <div
          className="context-menu-item"
          onClick={this.handleShowOriginalMenu}
          title="Right-click again to see the browser menu"
        >
          <i className="fa fa-ellipsis-h"/>
          Show Browser Menu
        </div>
      </div>
    );
  }
}

export default NoteContextMenu;

