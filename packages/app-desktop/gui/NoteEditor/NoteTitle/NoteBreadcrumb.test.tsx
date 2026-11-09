import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteBreadcrumb from './NoteBreadcrumb';

const folders = [
	{ id: 'root', title: 'Projects', parent_id: '' },
	{ id: 'child', title: 'Joplin fork', parent_id: 'root' },
];

describe('NoteBreadcrumb', () => {
	test.each([
		['Joplin fork', { type: 'FOLDER_AND_NOTE_SELECT', folderId: 'child', noteId: 'note' }],
		['Projects', { type: 'FOLDER_SELECT', id: 'root' }],
	])('clicking %s should open that notebook', (title, expectedAction) => {
		const dispatch = jest.fn();
		const store = { getState: () => ({ folders }), subscribe: () => () => {}, dispatch } as unknown as Store;
		render(<Provider store={store}><NoteBreadcrumb noteId='note' folderId='child' /></Provider>);

		fireEvent.click(screen.getByRole('button', { name: title }));

		expect(dispatch).toHaveBeenCalledWith({ type: 'FOLDER_SET_COLLAPSED', id: 'root', collapsed: false });
		expect(dispatch).toHaveBeenLastCalledWith(expectedAction);
	});
});
