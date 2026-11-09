import formatSyncStatus, { SyncStatusInput, SyncStatusTone } from './formatSyncStatus';

const now = 1_800_000_000_000;
const input = (changes: Partial<SyncStatusInput>): SyncStatusInput => ({
	syncTargetSet: true,
	syncStarted: false,
	syncPending: false,
	syncReport: { errors: [], completedTime: now - 3 * 60 * 1000 },
	now,
	...changes,
});

describe('formatSyncStatus', () => {
	test.each([
		[input({ syncTargetSet: false }), 'Set up sync', SyncStatusTone.Neutral],
		[input({ syncStarted: true }), 'Syncing…', SyncStatusTone.Busy],
		[input({ syncReport: { errors: [new Error('Failed')] } }), 'Sync error', SyncStatusTone.Error],
		[input({ syncReport: { errors: [] } }), 'Sync', SyncStatusTone.Neutral],
		[input({ syncReport: { errors: [], completedTime: now - 1000 } }), 'Synced just now', SyncStatusTone.Synced],
		[input({}), 'Synced 3 min ago', SyncStatusTone.Synced],
		[input({ syncPending: true }), 'Synced 3 min ago', SyncStatusTone.Neutral],
	])('should describe %j', (status, label, tone) => {
		expect(formatSyncStatus(status)).toMatchObject({ label, tone });
	});
});
