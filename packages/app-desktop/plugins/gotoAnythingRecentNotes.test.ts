import gotoAnythingRecentNotes from './gotoAnythingRecentNotes';
import Folder from '@joplin/lib/models/Folder';
import Note from '@joplin/lib/models/Note';
import { setupDatabaseAndSynchronizer, switchClient, msleep } from '@joplin/lib/testing/test-utils';

describe('gotoAnythingRecentNotes', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('should list visited notes first, then recently changed notes', async () => {
		const folder = await Folder.save({ title: 'Projects' });
		const notes = [];
		for (const title of ['first', 'second', 'current', 'latest', 'deleted']) {
			notes.push(await Note.save({ title, parent_id: folder.id }));
			await msleep(5);
		}
		const [first, second, current, , deleted] = notes;
		await Note.delete(deleted.id, { toTrash: true });

		const results = await gotoAnythingRecentNotes([first, second, deleted, current], [current.id], [folder]);

		expect(results.map(r => r.title)).toEqual(['second', 'first', 'latest']);
		expect(results[0].path).toBe('Projects');
	});
});
