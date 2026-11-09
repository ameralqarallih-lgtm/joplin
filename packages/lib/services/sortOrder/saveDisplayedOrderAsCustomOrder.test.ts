import saveDisplayedOrderAsCustomOrder from './saveDisplayedOrderAsCustomOrder';
import Folder from '../../models/Folder';
import Note from '../../models/Note';
import { setupDatabaseAndSynchronizer, switchClient } from '../../testing/test-utils';

const customOrderTitles = async (folderId: string) => {
	const notes = await Note.previews(folderId, { order: Note.customOrderByColumns(), fields: ['id', 'title'] });
	return notes.map(note => note.title);
};

describe('saveDisplayedOrderAsCustomOrder', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('should keep the displayed order, so that a drop lands where it was aimed', async () => {
		const folder = await Folder.save({ title: 'Folder' });
		const notes: Record<string, string> = {};
		for (const title of ['b', 'c', 'a']) {
			notes[title] = (await Note.save({ title, parent_id: folder.id })).id;
		}
		const options = { field: 'title', reverse: false, uncompletedTodosOnTop: false, showCompletedTodos: true };

		await saveDisplayedOrderAsCustomOrder(folder.id, options);
		expect(await customOrderTitles(folder.id)).toEqual(['a', 'b', 'c']);

		await Note.insertNotesAt(folder.id, [notes.c], 0, false, true);
		expect(await customOrderTitles(folder.id)).toEqual(['c', 'a', 'b']);
	});
});
