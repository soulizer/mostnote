export const NOTE_TITLE_LENGTH = 40;
export const NOTE_TAG_LENGTH = 50;
export const EMPTY_TITLE = 'NO-TITLE';

export function titleFromContent(content) {
  const text = typeof content === 'string' ? content : '';
  const firstLine = text.split('\n')[0].trim();

  return firstLine.slice(0, NOTE_TITLE_LENGTH) || EMPTY_TITLE;
}

export function normalizeNote(note = {}) {
  const content = typeof note.content === 'string' ? note.content : '';
  const title = typeof note.title === 'string' && note.title.trim()
    ? note.title
    : titleFromContent(content);

  const tags = Array.isArray(note.tags)
    ? [...new Set(note.tags
      .filter((tag) => typeof tag === 'string' && tag.trim())
      .map((tag) => tag.trim().slice(0, NOTE_TAG_LENGTH)))]
    : [];

  return {
    ...note,
    title,
    content,
    pinned: Boolean(note.pinned),
    tags
  };
}

export function notesDiffer(first, second) {
  if (!first || !second) {
    return true;
  }

  return first.title !== second.title
    || first.content !== second.content
    || Boolean(first.pinned) !== Boolean(second.pinned)
    || !Array.isArray(first.tags)
    || !Array.isArray(second.tags)
    || first.tags.length !== second.tags.length
    || first.tags.some((tag, index) => tag !== second.tags[index]);
}
