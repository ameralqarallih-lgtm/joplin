// Fork: pins the given notes, or unpins them when they are all pinned already.

import { CommandRuntime, CommandDeclaration, CommandContext } from '../services/CommandService';
import { _ } from '../locale';
import { setNotePinned } from '../models/utils/pinnedNotes';
import { State } from '../reducer';

export const declaration: CommandDeclaration = {
	name: 'togglePinNote',
	label: () => _('Pin or unpin note'),
	iconName: 'fas fa-thumbtack',
};

export const allNotesPinned = (state: State, noteIds: string[]) => {
	return !!noteIds.length && noteIds.every(id => state.pinnedNotes.find(note => note.id === id));
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (context: CommandContext, noteIds: string[] = null) => {
			if (noteIds === null) noteIds = context.state.selectedNoteIds;
			if (!noteIds.length) return;
			const pin = !allNotesPinned(context.state, noteIds);
			for (const noteId of noteIds) {
				await setNotePinned(noteId, pin);
			}
		},
		enabledCondition: '!noteIsReadOnlyShare && !inTrash && someNotesSelected',
	};
};
