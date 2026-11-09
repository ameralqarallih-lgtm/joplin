import Note from '@joplin/lib/models/Note';
import Setting from '@joplin/lib/models/Setting';
import { setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';
import { restoreNoteTabs, saveNoteTabs } from './persistNoteTabs';

describe('persistNoteTabs', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('should keep the tabs that aren\'t previews, and restore those whose note still exists', async () => {
		const kept = await Note.save({ title: 'Kept' });
		const trashed = await Note.save({ title: 'Trashed' });

		saveNoteTabs([]);
		saveNoteTabs([{ noteId: kept.id, preview: false }, { noteId: trashed.id, preview: false }, { noteId: 'preview', preview: true }]);
		expect(Setting.value('ui.noteTabs')).toEqual([kept.id, trashed.id]);

		await Note.delete(trashed.id, { toTrash: true });
		expect(await restoreNoteTabs()).toEqual([{ noteId: kept.id, preview: false }]);
	});
});
