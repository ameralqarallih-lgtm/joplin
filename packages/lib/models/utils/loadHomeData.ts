// Fork: the sections of the Workbench Home page: recently changed notes, open to-dos, pinned notes
// and the top-level notebooks.

import Note from '../Note';
import Folder from '../Folder';
import Tag from '../Tag';
import { ALL_NOTES_FILTER_ID } from '../../reserved-ids';
import { FolderEntity, NoteEntity } from '../../services/database/types';
import loadNoteExcerpts from './loadNoteExcerpts';
import { loadPinnedNotes } from './pinnedNotes';

export interface HomeRecentNote {
	note: NoteEntity;
	excerpt: string;
	tag: string;
}

export interface HomeFolder {
	folder: FolderEntity;
	noteCount: number;
}

export interface HomeData {
	recent: HomeRecentNote[];
	todos: NoteEntity[];
	pinned: NoteEntity[];
	folders: HomeFolder[];
}

export interface HomeDataOptions {
	recentCount?: number;
	todoCount?: number;
	includeCompletedTodosInCounts?: boolean;
	now?: number;
}

const noteFields = ['id', 'title', 'parent_id', 'is_todo', 'todo_due', 'todo_completed', 'user_updated_time', 'encryption_applied'];

// To-dos ticked off in the last day stay on the list, so ticking one doesn't make it vanish.
const recentlyCompletedPeriod = 24 * 60 * 60 * 1000;

export const sortHomeTodos = (todos: NoteEntity[]) => {
	return [...todos].sort((a, b) => {
		if (!!a.todo_completed !== !!b.todo_completed) return a.todo_completed ? 1 : -1;
		if (a.todo_completed) return b.todo_completed - a.todo_completed;
		if (!!a.todo_due !== !!b.todo_due) return a.todo_due ? -1 : 1;
		if (a.todo_due !== b.todo_due) return a.todo_due - b.todo_due;
		return b.user_updated_time - a.user_updated_time;
	});
};

const loadRecent = async (count: number) => {
	const notes = await Note.previews(ALL_NOTES_FILTER_ID, { fields: noteFields, limit: count });
	const excerpts = await loadNoteExcerpts(notes.map(note => note.id));
	const output: HomeRecentNote[] = [];
	for (const note of notes) {
		const tags = note.encryption_applied ? [] : await Tag.tagsByNoteId(note.id, { fields: ['id', 'title'] });
		output.push({ note, excerpt: excerpts[note.id] ?? '', tag: tags.length ? tags[0].title : '' });
	}
	return output;
};

const loadTodos = async (count: number, now: number) => {
	const todos = await Note.previews(ALL_NOTES_FILTER_ID, {
		fields: noteFields,
		conditions: ['is_todo = 1', '(todo_completed = 0 OR todo_completed > ?)'],
		conditionsParams: [now - recentlyCompletedPeriod],
		limit: 200,
	});
	return sortHomeTodos(todos.filter(note => !note.encryption_applied)).slice(0, count);
};

const loadFolders = async (includeCompletedTodos: boolean) => {
	const folders = (await Folder.all({
		fields: ['id', 'title', 'parent_id', 'icon', 'deleted_time', 'encryption_applied'],
		order: [{ by: 'title', dir: 'ASC' }],
	})).filter(folder => !folder.deleted_time);
	await Folder.addNoteCounts(folders, includeCompletedTodos);
	return folders
		.filter(folder => !folder.parent_id && !folder.encryption_applied)
		.map(folder => ({ folder, noteCount: (folder as FolderEntity & { note_count?: number }).note_count ?? 0 }));
};

const loadHomeData = async (options: HomeDataOptions = {}): Promise<HomeData> => {
	const now = options.now ?? Date.now();
	return {
		recent: await loadRecent(options.recentCount ?? 3),
		todos: await loadTodos(options.todoCount ?? 5, now),
		pinned: await loadPinnedNotes(noteFields),
		folders: await loadFolders(options.includeCompletedTodosInCounts ?? true),
	};
};

export default loadHomeData;
