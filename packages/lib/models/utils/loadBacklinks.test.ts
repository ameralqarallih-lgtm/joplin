import Note from '../Note';
import loadBacklinks from './loadBacklinks';
import { setupDatabaseAndSynchronizer, switchClient } from '../../testing/test-utils';

describe('loadBacklinks', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('should list the notes that link to a note, except trashed ones', async () => {
		const target = await Note.save({ title: 'Target' });
		const linking = await Note.save({ title: 'Linking', body: `See [target](:/${target.id}).` });
		const trashed = await Note.save({ title: 'Trashed', body: `[target](:/${target.id})` });
		await Note.save({ title: 'Unrelated', body: 'Nothing here' });
		await Note.delete(trashed.id, { toTrash: true });

		expect((await loadBacklinks(target.id)).map(note => note.id)).toEqual([linking.id]);
	});
});
