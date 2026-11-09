import Note from '../Note';
import { isNotePinned, loadPinnedNotes, setNotePinned } from './pinnedNotes';
import { msleep, setupDatabaseAndSynchronizer, switchClient } from '../../testing/test-utils';

describe('pinnedNotes', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('should list pinned notes in the order they were pinned, without trashed or unpinned notes', async () => {
		const first = await Note.save({ title: 'First' });
		const second = await Note.save({ title: 'Second' });
		const unpinned = await Note.save({ title: 'Unpinned' });
		const trashed = await Note.save({ title: 'Trashed' });

		await setNotePinned(second.id, true);
		await msleep(2);
		await setNotePinned(first.id, true);
		await setNotePinned(unpinned.id, true);
		await setNotePinned(unpinned.id, false);
		await setNotePinned(trashed.id, true);
		await Note.delete(trashed.id, { toTrash: true });

		const pinned = await loadPinnedNotes(['id', 'title']);

		expect(pinned).toEqual([{ id: second.id, title: 'Second' }, { id: first.id, title: 'First' }]);
		expect(isNotePinned(await Note.load(first.id))).toBe(true);
		expect(isNotePinned(await Note.load(unpinned.id))).toBe(false);
	});

	test('should not change when the note was last edited', async () => {
		const note = await Note.save({ title: 'Note' });

		await setNotePinned(note.id, true);

		expect((await Note.load(note.id)).user_updated_time).toBe(note.user_updated_time);
	});
});
