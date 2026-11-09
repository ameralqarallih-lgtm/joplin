// Fork: keeps the notes open in tabs across restarts. Preview tabs aren't kept, nor tabs of notes that have since
// been deleted or trashed.

import Setting from '@joplin/lib/models/Setting';
import Note from '@joplin/lib/models/Note';
import { NoteTab } from './noteTabsReducer';

let savedNoteTabs: NoteTab[]|undefined = undefined;

export const saveNoteTabs = (noteTabs: NoteTab[]) => {
	// The first call only records the startup state, which has nothing to save.
	if (savedNoteTabs === undefined) savedNoteTabs = noteTabs;
	if (noteTabs === savedNoteTabs) return;
	savedNoteTabs = noteTabs;
	Setting.setValue('ui.noteTabs', noteTabs.filter(tab => !tab.preview).map(tab => tab.noteId));
};

export const restoreNoteTabs = async (): Promise<NoteTab[]> => {
	const noteIds: string[] = Setting.value('ui.noteTabs');
	if (!noteIds.length) return [];
	const notes = await Note.byIds(noteIds, { fields: ['id', 'deleted_time'] });
	return noteIds
		.filter(noteId => notes.find(note => note.id === noteId && !note.deleted_time))
		.map(noteId => ({ noteId, preview: false }));
};
