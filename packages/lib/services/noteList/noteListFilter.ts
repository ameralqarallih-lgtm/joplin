// Fork: the quick filters of the Workbench note list: all notes, open to-dos or pinned notes.

import { NoteEntity } from '../database/types';

export enum NoteListFilter {
	All = 'all',
	Todos = 'todos',
	Pinned = 'pinned',
}

const filterNoteList = (notes: NoteEntity[], filter: NoteListFilter, pinnedNotes: NoteEntity[]) => {
	if (filter === NoteListFilter.Todos) return notes.filter(note => note.is_todo && !note.todo_completed);
	if (filter === NoteListFilter.Pinned) {
		const pinnedIds = new Set(pinnedNotes.map(note => note.id));
		return notes.filter(note => pinnedIds.has(note.id));
	}
	return notes;
};

export default filterNoteList;
