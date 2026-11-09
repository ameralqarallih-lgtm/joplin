import filterNoteList, { NoteListFilter } from './noteListFilter';

const notes = [
	{ id: 'note', is_todo: 0 },
	{ id: 'open', is_todo: 1, todo_completed: 0 },
	{ id: 'done', is_todo: 1, todo_completed: 1000 },
];

describe('noteListFilter', () => {
	test.each([
		[NoteListFilter.All, ['note', 'open', 'done']],
		[NoteListFilter.Todos, ['open']],
		[NoteListFilter.Pinned, ['done']],
	])('should keep the notes for %s', (filter, expected) => {
		expect(filterNoteList(notes, filter, [{ id: 'done' }]).map(note => note.id)).toEqual(expected);
	});
});
