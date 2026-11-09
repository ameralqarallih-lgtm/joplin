import loadNoteExcerpts from './loadNoteExcerpts';
import Note from '../Note';
import Setting from '../Setting';
import { setupDatabaseAndSynchronizer, switchClient } from '../../testing/test-utils';

describe('loadNoteExcerpts', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
		Setting.setValue('featureFlag.noteLock', true);
	});

	test('should return excerpts, except for locked notes', async () => {
		const open = await Note.save({ title: 'Open', body: '# Open\n\nShopping **list**' });
		const locked = await Note.save({ title: 'Locked', body: 'Secret', is_locked: 1 });

		const excerpts = await loadNoteExcerpts([open.id, locked.id, 'missing']);

		expect(excerpts).toEqual({ [open.id]: 'Shopping list', [locked.id]: '' });
	});
});
