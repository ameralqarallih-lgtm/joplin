// Fork: pinned notes. The pin lives in the note's user data, so it syncs and merges like any other
// user data, and clients that don't know about it ignore it.

import { ModelType } from '../../BaseModel';
import Note from '../Note';
import { NoteEntity } from '../../services/database/types';
import { deleteItemUserData, getUserData, setItemUserData, unserializeUserData } from './userData';

const pinNamespace = 'org.inkbench';
const pinKey = 'pinned';

const pinnedTime = (userData: string) => {
	if (!userData) return undefined;
	try {
		return getUserData<number>(unserializeUserData(userData), pinNamespace, pinKey);
	} catch (error) {
		return undefined;
	}
};

export const isNotePinned = (note: Pick<NoteEntity, 'user_data'>) => pinnedTime(note.user_data) !== undefined;

export const setNotePinned = async (noteId: string, pinned: boolean) => {
	if (pinned) return setItemUserData(ModelType.Note, noteId, pinNamespace, pinKey, Date.now());
	return deleteItemUserData(ModelType.Note, noteId, pinNamespace, pinKey);
};

export const loadPinnedNotes = async (fields: string[] = ['id', 'title', 'parent_id', 'is_todo', 'todo_completed']): Promise<NoteEntity[]> => {
	const selectedFields = [...new Set([...fields, 'id', 'user_data'])];
	const rows: NoteEntity[] = await Note.db().selectAll(
		`SELECT ${selectedFields.join(', ')} FROM notes WHERE deleted_time = 0 AND is_conflict = 0 AND encryption_applied = 0 AND user_data LIKE ?`,
		[`%"${pinNamespace}"%`],
	);

	return rows
		.map(note => ({ note, time: pinnedTime(note.user_data) }))
		.filter(row => row.time !== undefined)
		.sort((a, b) => a.time - b.time)
		.map(row => {
			const note = { ...row.note };
			if (!fields.includes('user_data')) delete note.user_data;
			return note;
		});
};
