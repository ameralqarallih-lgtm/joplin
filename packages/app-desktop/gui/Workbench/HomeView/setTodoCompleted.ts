// Fork: ticks or unticks a to-do from outside the editor.
// Duplicated from the to-do checkbox handler in gui/NoteListItem/NoteListItem.tsx.

import Note from '@joplin/lib/models/Note';
import isNoteLockEnabled from '@joplin/lib/services/noteLock/isNoteLockEnabled';
import NoteLockNote from '@joplin/lib/services/noteLock/NoteLockNote';
import NoteLockSession from '@joplin/lib/services/noteLock/NoteLockSession';
import { noteIsLockedInShare } from '@joplin/lib/models/utils/readOnly';
import { _ } from '@joplin/lib/locale';
import bridge from '../../../services/bridge';

const setTodoCompleted = async (noteId: string, completed: boolean) => {
	const lockState = await Note.load(noteId, { fields: ['is_locked', 'share_id'] });
	if (noteIsLockedInShare(lockState)) {
		bridge().showErrorMessageBox(_('This note is read-only because it is locked and contained within a share. To enable editing, it must be moved outside of the share.'));
		return false;
	}
	if (isNoteLockEnabled() && NoteLockNote.isLocked(lockState) && !NoteLockSession.instance().isUnlocked()) {
		bridge().showErrorMessageBox(_('Cannot change a locked note while the session is locked'));
		return false;
	}

	await Note.save({ id: noteId, todo_completed: completed ? Date.now() : 0 }, { userSideValidation: true });
	return true;
};

export default setTodoCompleted;
