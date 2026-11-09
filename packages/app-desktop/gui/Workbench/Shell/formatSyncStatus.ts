// Fork: the sync status shown in the Workbench top bar.

import { _ } from '@joplin/lib/locale';
import time from '@joplin/lib/time';
import { ProgressReport } from '@joplin/lib/Synchronizer';

export enum SyncStatusTone {
	Neutral = 'neutral',
	Synced = 'synced',
	Busy = 'busy',
	Error = 'error',
}

export interface SyncStatusInput {
	syncTargetSet: boolean;
	syncStarted: boolean;
	syncPending: boolean;
	syncReport: ProgressReport;
	now: number;
}

const minute = 60 * 1000;

const formatSyncStatus = ({ syncTargetSet, syncStarted, syncPending, syncReport, now }: SyncStatusInput) => {
	if (!syncTargetSet) return { label: _('Set up sync'), icon: 'wb-icon-sync-off', tone: SyncStatusTone.Neutral };
	if (syncStarted) return { label: _('Syncing…'), icon: 'icon-sync', tone: SyncStatusTone.Busy };
	if (syncReport.errors?.length) return { label: _('Sync error'), icon: 'fas fa-exclamation-triangle', tone: SyncStatusTone.Error };
	if (!syncReport.completedTime) return { label: _('Sync'), icon: 'icon-sync', tone: SyncStatusTone.Neutral };

	const elapsed = now - syncReport.completedTime;
	let label = _('Synced at %s', time.formatMsToLocal(syncReport.completedTime, time.timeFormat()));
	if (elapsed < minute) label = _('Synced just now');
	else if (elapsed < 60 * minute) label = _('Synced %d min ago', Math.floor(elapsed / minute));

	return { label, icon: 'wb-icon-synced', tone: syncPending ? SyncStatusTone.Neutral : SyncStatusTone.Synced };
};

export default formatSyncStatus;
