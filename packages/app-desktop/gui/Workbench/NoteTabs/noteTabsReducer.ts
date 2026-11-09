// Fork: the note tabs of the Workbench layout. A note opened from the note list goes into the preview tab,
// which the next opened note replaces, as in VS Code. Editing the note or double-clicking its tab keeps it.

export interface NoteTab {
	noteId: string;
	preview: boolean;
}

export interface NoteTabsWindowState {
	noteTabs: NoteTab[];
	homeTabActive: boolean;
	selectedNoteIds: string[];
}

export interface NoteTabsAppState extends NoteTabsWindowState {
	provisionalNoteIds: string[];
}

interface Action {
	type: string;
	id?: string;
	noteId?: string;
	noteTabs?: NoteTab[];
	value?: { noteIds?: string[] };
	note?: { id?: string };
	changedFields?: string[];
	changeSource?: number;
}

export const maxNoteTabs = 12;

// The app also selects a note by itself, for example the first note of a notebook that was just opened, so a
// plain NOTE_SELECT doesn't leave the Home tab. The note list dispatches WORKBENCH_HOME_HIDE when the user opens a note.
const leaveHomeActions = ['WORKBENCH_HOME_HIDE', 'FOLDER_AND_NOTE_SELECT', 'HISTORY_BACKWARD', 'HISTORY_FORWARD'];
const selectActions = ['NOTE_SELECT', ...leaveHomeActions];

const openInTab = (tabs: NoteTab[], noteId: string, previousNoteId: string|null) => {
	if (tabs.find(tab => tab.noteId === noteId)) return tabs;

	const previewIndex = tabs.findIndex(tab => tab.preview);
	if (previewIndex >= 0) {
		const output = tabs.slice();
		output[previewIndex] = { noteId, preview: true };
		return output;
	}

	const previousIndex = tabs.findIndex(tab => tab.noteId === previousNoteId);
	const insertAt = previousIndex >= 0 ? previousIndex + 1 : tabs.length;
	const output = [...tabs.slice(0, insertAt), { noteId, preview: true }, ...tabs.slice(insertAt)];
	if (output.length > maxNoteTabs) output.splice(output.findIndex(tab => tab.noteId !== noteId), 1);
	return output;
};

// Sync and decryption set a change source, edits made in the app don't.
const isEdit = (action: Action) => {
	if (action.type !== 'NOTE_UPDATE_ONE' || action.changeSource || !action.note?.id) return false;
	return (action.changedFields ?? []).some(field => field === 'title' || field === 'body');
};

const keepTab = (tabs: NoteTab[], noteId: string) => {
	if (!tabs.find(tab => tab.noteId === noteId && tab.preview)) return tabs;
	return tabs.map(tab => tab.noteId === noteId ? { ...tab, preview: false } : tab);
};

const singleSelectedNoteId = (state: NoteTabsWindowState) => state.selectedNoteIds.length === 1 ? state.selectedNoteIds[0] : null;

const updateNoteTabs = <T extends NoteTabsAppState>(previous: T, state: T, action: Action): T => {
	let noteTabs = state.noteTabs;
	let homeTabActive = state.homeTabActive;

	if (action.type === 'WORKBENCH_HOME_SHOW') homeTabActive = true;
	if (action.type === 'WORKBENCH_TABS_SET') noteTabs = action.noteTabs;
	if (action.type === 'WORKBENCH_TAB_CLOSE') noteTabs = noteTabs.filter(tab => tab.noteId !== action.noteId);
	if (action.type === 'WORKBENCH_TAB_KEEP') noteTabs = keepTab(noteTabs, action.noteId);
	if (isEdit(action)) noteTabs = keepTab(noteTabs, action.note.id);
	if (action.type === 'NOTE_DELETE') noteTabs = noteTabs.filter(tab => tab.noteId !== action.id);
	if (action.type === 'ITEMS_TRASHED' && action.value?.noteIds?.length) {
		noteTabs = noteTabs.filter(tab => !action.value.noteIds.includes(tab.noteId));
	}

	const selectedNoteId = singleSelectedNoteId(state);
	const isNewNote = action.type === 'NOTE_SELECT' && state.provisionalNoteIds.includes(selectedNoteId);
	if (leaveHomeActions.includes(action.type) || isNewNote) homeTabActive = false;

	const isOpenAction = selectActions.includes(action.type);
	const previousNoteId = previous.homeTabActive ? null : singleSelectedNoteId(previous);
	if (!homeTabActive && selectedNoteId && (isOpenAction || selectedNoteId !== singleSelectedNoteId(previous))) {
		noteTabs = openInTab(noteTabs, selectedNoteId, previousNoteId);
	}

	if (noteTabs === state.noteTabs && homeTabActive === state.homeTabActive) return state;
	return { ...state, noteTabs, homeTabActive };
};

export default updateNoteTabs;
