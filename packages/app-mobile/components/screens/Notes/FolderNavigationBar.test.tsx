import * as React from 'react';
import { fireEvent, render, screen } from '../../../utils/testing/testingLibrary';
import createMockReduxStore from '../../../utils/testing/createMockReduxStore';
import TestProviderStack from '../../testing/TestProviderStack';
import FolderNavigationBar from './FolderNavigationBar';

const folders = [
	{ id: 'projects', title: 'Projects', parent_id: '' },
	{ id: 'fork', title: 'Joplin fork', parent_id: 'projects' },
	{ id: 'website', title: 'Website', parent_id: 'projects' },
	{ id: 'home', title: 'Home', parent_id: '' },
];

const renderBar = (folderId: string) => {
	const store = createMockReduxStore();
	store.dispatch({ type: 'FOLDER_UPDATE_ALL', items: folders });
	const dispatch = jest.spyOn(store, 'dispatch');
	render(<TestProviderStack store={store}><FolderNavigationBar folderId={folderId}/></TestProviderStack>);
	return dispatch;
};

describe('FolderNavigationBar', () => {
	test.each([
		['projects', 'Website', 'website'],
		['fork', 'Projects', 'projects'],
	])('in notebook %s, pressing %s should open that notebook', (folderId, chipTitle, expectedFolderId) => {
		const dispatch = renderBar(folderId);
		fireEvent.press(screen.getByText(chipTitle));
		expect(dispatch).toHaveBeenLastCalledWith({ type: 'NAV_GO', routeName: 'Notes', folderId: expectedFolderId });
	});

	test('should not show for a top-level notebook without sub-notebooks', () => {
		renderBar('home');
		expect(screen.queryByRole('button')).toBeNull();
	});
});
