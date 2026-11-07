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

import notes from './notes';
import {normalizeNote, titleFromContent} from '../utils/note';

const list = [
  {title: 'Shopping list', content: 'milk (2) [organic]', tags: ['home']},
  {title: 'Other', content: 'nothing here', tags: []},
  {title: 'Ideas', content: 'not much', tags: ['work', 'urgent']},
];

it('filters notes by title or content, ignoring case', () => {
  notes.filter = 'SHOPPING';
  expect(notes.filterNotes(list)).toHaveLength(1);

  notes.filter = '';
  expect(notes.filterNotes(list)).toHaveLength(3);
});

it('filters notes by tag', () => {
  notes.filter = 'urgent';
  expect(notes.filterNotes(list)).toHaveLength(1);

  notes.filter = 'WORK';
  expect(notes.filterNotes(list)).toHaveLength(1);

  notes.filter = '';
});

it('accepts regular expression characters in the filter', () => {
  for (const filter of ['(', '[organic', 'milk (2']) {
    notes.filter = filter;
    expect(notes.filterNotes(list)).toHaveLength(1);
  }
});

it('derives the title from the first content line', () => {
  expect(notes.getTitleByContent('First line\nsecond')).toBe('First line');
  expect(notes.getTitleByContent('   ')).toBe('NO-TITLE');
});

it('normalizes legacy notes with an empty title before they are uploaded', () => {
  const note = normalizeNote({
    id: 'legacy',
    title: '',
    content: '',
    pinned: '',
    tags: null
  });

  expect(note.title).toBe('NO-TITLE');
  expect(note.content).toBe('');
  expect(note.pinned).toBe(false);
  expect(note.tags).toEqual([]);
});

it('derives a legacy title from content and cleans tags', () => {
  expect(titleFromContent('  First line  \nsecond')).toBe('First line');
  expect(normalizeNote({content: 'Body', title: ' ', tags: [' work ', '', 'work']}).tags).toEqual(['work']);
});
