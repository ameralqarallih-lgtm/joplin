// Fork: the sync status shown in the Workbench top bar (desktop) and on the Home screen (mobile).

import { _ } from '../../locale';
import time from '../../time';
import { ProgressReport } from '../../Synchronizer';

export enum SyncStatusTone {
	Neutral = 'neutral',
	Synced = 'synced',
	Busy = 'busy',
	Error = 'error',
}

export enum SyncStatusIcon {
	Off = 'off',
	Sync = 'sync',
	Synced = 'synced',
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
	if (!syncTargetSet) return { label: _('Set up sync'), icon: SyncStatusIcon.Off, tone: SyncStatusTone.Neutral };
	if (syncStarted) return { label: _('Syncing…'), icon: SyncStatusIcon.Sync, tone: SyncStatusTone.Busy };
	if (syncReport.errors?.length) return { label: _('Sync error'), icon: SyncStatusIcon.Error, tone: SyncStatusTone.Error };
	if (!syncReport.completedTime) return { label: _('Sync'), icon: SyncStatusIcon.Sync, tone: SyncStatusTone.Neutral };

	const elapsed = now - syncReport.completedTime;
	let label = _('Synced at %s', time.formatMsToLocal(syncReport.completedTime, time.timeFormat()));
	if (elapsed < minute) label = _('Synced just now');
	else if (elapsed < 60 * minute) label = _('Synced %d min ago', Math.floor(elapsed / minute));

	return { label, icon: SyncStatusIcon.Synced, tone: syncPending ? SyncStatusTone.Neutral : SyncStatusTone.Synced };
};

export default formatSyncStatus;
