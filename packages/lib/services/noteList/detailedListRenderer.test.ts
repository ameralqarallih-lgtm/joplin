import detailedListRenderer from './detailedListRenderer';
import Setting from '../../models/Setting';
import { setupDatabaseAndSynchronizer, switchClient } from '../../testing/test-utils';

const renderNote = (note: Record<string, unknown>) => {
	return detailedListRenderer.onRenderNote({
		note: { id: '1', title: 'Title', body: 'Secret plans', is_locked: 0, encryption_applied: 0, tags: [{ title: 'plan' }], user_updated_time: 0, ...note },
		item: { size: { height: 52 }, selected: false },
	});
};

describe('detailedListRenderer', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
		Setting.setValue('featureFlag.noteLock', true);
	});

	test.each([
		[{}, 'Secret plans'],
		[{ is_locked: 1 }, ''],
		[{ encryption_applied: 1 }, ''],
	])('should only show the excerpt of readable notes (%j)', async (note, expected) => {
		const view = await renderNote(note);
		expect(view.excerpt).toBe(expected);
		expect(view.tagTitles).toEqual(['plan']);
		expect((view.note as Record<string, unknown>).body).toBe('');
	});
});
