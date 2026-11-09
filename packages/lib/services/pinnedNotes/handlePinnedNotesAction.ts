// Fork: keeps state.pinnedNotes current. It reloads only when a pin may have changed, or when a
// pinned note was renamed, moved, completed or deleted, because loading means scanning the notes table.

import { Dispatch } from 'redux';
import { State } from '../../reducer';
import { NoteEntity } from '../database/types';
import { loadPinnedNotes } from '../../models/utils/pinnedNotes';
import shim from '../../shim';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('handlePinnedNotesAction');

const pinnedNoteFields = ['id', 'title', 'parent_id', 'is_todo', 'todo_completed'];
const pinnedNoteDisplayFields = ['title', 'parent_id', 'is_todo', 'todo_completed', 'deleted_time', 'is_conflict', 'encryption_applied'];

interface Action {
	type: string;
	note?: NoteEntity;
	changedFields?: string[];
	decryptedItemCounts?: Record<number, number>;
	state?: string;
}

export const shouldRefreshPinnedNotes = (state: State, action: Action) => {
	if (['SETTING_UPDATE_ALL', 'NOTE_DELETE', 'ITEMS_TRASHED', 'ITEMS_RESTORED'].includes(action.type)) return true;
	if (action.type === 'DECRYPTION_WORKER_SET') return action.state === 'idle' && !!action.decryptedItemCounts;
	if (action.type !== 'NOTE_UPDATE_ONE' || !action.note) return false;

	const changedFields = action.changedFields ?? [];
	if (changedFields.includes('user_data')) return true;
	// A note seen for the first time, for example from sync, has no changed fields.
	if (!changedFields.length) return !!action.note.user_data;
	if (!state.pinnedNotes.find(note => note.id === action.note.id)) return false;
	return changedFields.some(field => pinnedNoteDisplayFields.includes(field));
};

let refreshTimeout: ReturnType<typeof shim.setTimeout> = null;

export default (state: State, action: Action, dispatch: Dispatch) => {
	if (!shouldRefreshPinnedNotes(state, action)) return;

	if (refreshTimeout) shim.clearTimeout(refreshTimeout);
	refreshTimeout = shim.setTimeout(async () => {
		refreshTimeout = null;
		try {
			dispatch({ type: 'PINNED_NOTES_SET', notes: await loadPinnedNotes(pinnedNoteFields) });
		} catch (error) {
			logger.warn('Could not load the pinned notes:', error);
		}
	}, 300);
};
