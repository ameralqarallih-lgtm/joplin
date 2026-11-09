import updateNoteTabs, { NoteTab, NoteTabsAppState } from './noteTabsReducer';

const makeState = (selectedNoteIds: string[], noteTabs: NoteTab[], homeTabActive = false, provisionalNoteIds: string[] = []): NoteTabsAppState => ({ selectedNoteIds, noteTabs, homeTabActive, provisionalNoteIds });
const kept = (noteId: string): NoteTab => ({ noteId, preview: false });
const preview = (noteId: string): NoteTab => ({ noteId, preview: true });

describe('noteTabsReducer', () => {
	test.each([
		['replaces the preview tab', makeState(['a'], [kept('k'), preview('a')]), makeState(['b'], [kept('k'), preview('a')]), { type: 'NOTE_SELECT' }, [kept('k'), preview('b')]],
		['adds a preview tab after the current one', makeState(['a'], [kept('a'), kept('c')]), makeState(['b'], [kept('a'), kept('c')]), { type: 'NOTE_SELECT' }, [kept('a'), preview('b'), kept('c')]],
		['activates an open tab without changing tabs', makeState(['a'], [kept('a'), kept('b')]), makeState(['b'], [kept('a'), kept('b')]), { type: 'NOTE_SELECT' }, [kept('a'), kept('b')]],
		['keeps the preview tab', makeState(['a'], [preview('a')]), makeState(['a'], [preview('a')]), { type: 'WORKBENCH_TAB_KEEP', noteId: 'a' }, [kept('a')]],
		['keeps the tab of an edited note', makeState(['a'], [preview('a')]), makeState(['a'], [preview('a')]), { type: 'NOTE_UPDATE_ONE', note: { id: 'a' }, changedFields: ['body'] }, [kept('a')]],
		['keeps the preview tab when the note is changed by sync', makeState(['a'], [preview('a')]), makeState(['a'], [preview('a')]), { type: 'NOTE_UPDATE_ONE', note: { id: 'a' }, changedFields: ['body'], changeSource: 2 }, [preview('a')]],
		['closes a tab without reopening it', makeState(['a'], [kept('a'), kept('b')]), makeState(['a'], [kept('a'), kept('b')]), { type: 'WORKBENCH_TAB_CLOSE', noteId: 'a' }, [kept('b')]],
		['drops tabs of trashed notes', makeState(['a'], [kept('a'), kept('b')]), makeState(['a'], [kept('a'), kept('b')]), { type: 'ITEMS_TRASHED', value: { noteIds: ['b'] } }, [kept('a')]],
		['ignores a multiple selection', makeState(['a'], [kept('a')]), makeState(['a', 'b'], [kept('a')]), { type: 'NOTE_SELECT_TOGGLE' }, [kept('a')]],
	])('%s', (_label, previous, state, action, expected) => {
		expect(updateNoteTabs(previous, state, action).noteTabs).toEqual(expected);
	});

	test('should stay on Home when the app selects a note, and leave it when the user opens one', () => {
		const home = makeState(['a'], [], true);

		const afterAutoSelect = updateNoteTabs(home, makeState(['b'], [], true), { type: 'NOTE_SELECT' });
		expect(afterAutoSelect).toEqual(makeState(['b'], [], true));

		const afterUserOpen = updateNoteTabs(afterAutoSelect, makeState(['b'], [], true), { type: 'WORKBENCH_HOME_HIDE' });
		expect(afterUserOpen).toEqual(makeState(['b'], [preview('b')], false));

		const afterNewNote = updateNoteTabs(home, makeState(['new'], [], true, ['new']), { type: 'NOTE_SELECT' });
		expect(afterNewNote).toEqual(makeState(['new'], [preview('new')], false, ['new']));
	});
});
