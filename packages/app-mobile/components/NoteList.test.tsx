import * as React from 'react';
import { FlatList } from 'react-native';
import { render, screen } from '../utils/testing/testingLibrary';
import createMockReduxStore from '../utils/testing/createMockReduxStore';
import TestProviderStack from './testing/TestProviderStack';
import NoteList from './NoteList';
import { reg } from '@joplin/lib/registry';
import { setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';

const renderList = (syncTarget: number) => {
	const store = createMockReduxStore();
	store.dispatch({ type: 'SETTING_UPDATE_ONE', key: 'sync.target', value: syncTarget });
	store.dispatch({ type: 'NOTE_UPDATE_ALL', notes: [{ id: '1', title: 'Note', parent_id: '' }], notesSource: '' });
	render(<TestProviderStack store={store}><NoteList/></TestProviderStack>);
	return screen.UNSAFE_getByType(FlatList).props;
};

describe('NoteList', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);
	});

	test('pulling the list down should synchronise, once synchronisation is set up', () => {
		const scheduleSync = jest.spyOn(reg, 'scheduleSync').mockResolvedValue(undefined);

		expect(renderList(0).onRefresh).toBeUndefined();

		renderList(9).onRefresh();
		expect(scheduleSync).toHaveBeenCalledWith(0);
	});
});
