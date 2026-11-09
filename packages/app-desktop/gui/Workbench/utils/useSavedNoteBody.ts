// Fork: the saved body of a note, reloaded whenever the note is saved. It follows the editor's autosave rather
// than every keystroke. Empty for encrypted notes.

import { useState } from 'react';
import Note from '@joplin/lib/models/Note';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import eventManager, { EventName, ItemChangeEvent } from '@joplin/lib/eventManager';

const useSavedNoteBody = (noteId: string|null) => {
	const [body, setBody] = useState<string|null>(null);
	const [changeCount, setChangeCount] = useState(0);

	useAsyncEffect(async (event) => {
		if (!noteId) {
			setBody(null);
			return;
		}

		const onItemChange = (change: ItemChangeEvent) => {
			if (change.itemId === noteId) setChangeCount(count => count + 1);
		};
		eventManager.on(EventName.ItemChange, onItemChange);
		event.onCleanup(() => eventManager.off(EventName.ItemChange, onItemChange));

		const note = await Note.load(noteId, { fields: ['body', 'encryption_applied'] });
		if (event.cancelled) return;
		setBody(note && !note.encryption_applied ? note.body : null);
	}, [noteId, changeCount]);

	return body;
};

export default useSavedNoteBody;
