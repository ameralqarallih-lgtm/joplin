import Note from '../Note';
import Folder from '../Folder';
import Tag from '../Tag';
import loadHomeData from './loadHomeData';
import { setNotePinned } from './pinnedNotes';
import { msleep, setupDatabaseAndSynchronizer, switchClient } from '../../testing/test-utils';

describe('loadHomeData', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('should list open to-dos by due date, then those completed in the last day', async () => {
		const now = Date.now();
		const folder = await Folder.save({ title: 'Folder' });
		const save = (title: string, todo_due: number, todo_completed: number) => Note.save({ title, parent_id: folder.id, is_todo: 1, todo_due, todo_completed });

		await save('No due date', 0, 0);
		await save('Due later', now + 2000, 0);
		await save('Due soon', now + 1000, 0);
		await save('Done today', 0, now - 1000);
		await save('Done last week', 0, now - 7 * 24 * 60 * 60 * 1000);
		await Note.save({ title: 'Plain note', parent_id: folder.id });

		const data = await loadHomeData({ now });

		expect(data.todos.map(note => note.title)).toEqual(['Due soon', 'Due later', 'No due date', 'Done today']);
	});

	test('should list recent notes with an excerpt and a tag, pinned notes and top-level notebooks with counts', async () => {
		const parent = await Folder.save({ title: 'Projects' });
		const child = await Folder.save({ title: 'Fork', parent_id: parent.id });
		await Folder.save({ title: 'Home' });
		const older = await Note.save({ title: 'Older', body: 'Old text', parent_id: parent.id });
		await msleep(2);
		const newer = await Note.save({ title: 'Newer', body: '# Newer\n\nNew text', parent_id: child.id });
		await Tag.addNoteTagByTitle(newer.id, 'plan');
		await setNotePinned(older.id, true);

		const data = await loadHomeData({ recentCount: 1 });

		expect(data.recent).toEqual([{ note: expect.objectContaining({ id: newer.id }), excerpt: 'New text', tag: 'plan' }]);
		expect(data.pinned.map(note => note.id)).toEqual([older.id]);
		expect(data.folders.map(n => [n.folder.title, n.noteCount])).toEqual([['Home', 0], ['Projects', 2]]);
	});
});
