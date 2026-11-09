import { defaultState, State } from '../../reducer';
import { shouldRefreshPinnedNotes } from './handlePinnedNotesAction';

const state: State = { ...defaultState, pinnedNotes: [{ id: 'pinned', title: 'Pinned' }] };

describe('handlePinnedNotesAction', () => {
	test.each([
		[{ type: 'SETTING_UPDATE_ALL' }, true],
		[{ type: 'ITEMS_TRASHED' }, true],
		[{ type: 'NOTE_UPDATE_ONE', note: { id: 'other' }, changedFields: ['user_data'] }, true],
		[{ type: 'NOTE_UPDATE_ONE', note: { id: 'new', user_data: '{"org.inkbench":{}}' }, changedFields: [] as string[] }, true],
		[{ type: 'NOTE_UPDATE_ONE', note: { id: 'new' }, changedFields: [] as string[] }, false],
		[{ type: 'NOTE_UPDATE_ONE', note: { id: 'pinned' }, changedFields: ['title'] }, true],
		[{ type: 'NOTE_UPDATE_ONE', note: { id: 'pinned' }, changedFields: ['body'] }, false],
		[{ type: 'NOTE_UPDATE_ONE', note: { id: 'other' }, changedFields: ['title'] }, false],
		[{ type: 'NOTE_SELECT' }, false],
	])('should decide whether %j needs a reload', (action, expected) => {
		expect(shouldRefreshPinnedNotes(state, action)).toBe(expected);
	});
});
