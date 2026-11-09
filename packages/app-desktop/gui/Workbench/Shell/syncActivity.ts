// Fork: what the Workbench status bar says about synchronisation, which upstream shows below the sidebar: the
// sync in progress, attachments being fetched and items being decrypted. `details` holds the full sync report.

import { _ } from '@joplin/lib/locale';
import Synchronizer, { ProgressReport } from '@joplin/lib/Synchronizer';
import { StateDecryptionWorker, StateResourceFetcher } from '@joplin/lib/reducer';

export interface SyncActivityState {
	syncStarted: boolean;
	syncReport: ProgressReport;
	decryptionWorker: StateDecryptionWorker;
	resourceFetcher: StateResourceFetcher;
}

export interface SyncActivity {
	text: string;
	details: string[];
}

const syncActivity = (state: SyncActivityState): SyncActivity|null => {
	const report = state.syncReport ?? ({} as ProgressReport);
	const details = Synchronizer.reportToLines(report);

	let decrypting = '';
	const worker = state.decryptionWorker;
	if (worker && worker.state !== 'idle' && worker.itemCount) {
		decrypting = _('Decrypting items: %d/%d', worker.itemIndex + 1, worker.itemCount);
		details.push(decrypting);
	}

	let fetching = '';
	const fetcher = state.resourceFetcher;
	if (fetcher && fetcher.toFetchCount) {
		fetching = _('Fetching resources: %d/%d', fetcher.fetchingCount, fetcher.toFetchCount);
		details.push(fetching);
	}

	let text = '';
	if (state.syncStarted) {
		text = report.fetchingTotal && report.fetchingProcessed ? _('Fetched items: %d/%d.', report.fetchingProcessed, report.fetchingTotal) : _('Synchronising...');
	} else {
		text = decrypting || fetching;
	}

	return text ? { text, details } : null;
};

export default syncActivity;
