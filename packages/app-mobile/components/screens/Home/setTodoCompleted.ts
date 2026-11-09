// Fork: ticks or unticks a to-do from the Home screen.
// Duplicated from the to-do checkbox handler in components/NoteItem.tsx.

import Note from '@joplin/lib/models/Note';
import isNoteLockEnabled from '@joplin/lib/services/noteLock/isNoteLockEnabled';
import NoteLockNote from '@joplin/lib/services/noteLock/NoteLockNote';
import NoteLockSession from '@joplin/lib/services/noteLock/NoteLockSession';
import { noteIsLockedInShare } from '@joplin/lib/models/utils/readOnly';
import { _ } from '@joplin/lib/locale';
import { DialogControl } from '../../DialogManager';

const setTodoCompleted = async (noteId: string, completed: boolean, dialogs: DialogControl) => {
	const lockState = await Note.load(noteId, { fields: ['is_locked', 'share_id'] });
	if (noteIsLockedInShare(lockState)) {
		await dialogs.error(_('This note is read-only because it is locked and contained within a share. To enable editing, it must be moved outside of the share.'));
		return false;
	}
	if (isNoteLockEnabled() && NoteLockNote.isLocked(lockState) && !NoteLockSession.instance().isUnlocked()) {
		await dialogs.error(_('Cannot change a locked note while the session is locked'));
		return false;
	}

	await Note.save({ id: noteId, todo_completed: completed ? Date.now() : 0 });
	return true;
};

export default setTodoCompleted;
