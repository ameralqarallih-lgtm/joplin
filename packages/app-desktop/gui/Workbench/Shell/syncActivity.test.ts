import { StateDecryptionWorker, StateResourceFetcher } from '@joplin/lib/reducer';
import syncActivity from './syncActivity';

const idleWorker = { state: 'idle', itemIndex: 0, itemCount: 0 } as StateDecryptionWorker;
const idleFetcher = { toFetchCount: 0, fetchingCount: 0 } as StateResourceFetcher;

describe('syncActivity', () => {
	test.each([
		[{ syncStarted: false, syncReport: {} }, null],
		[{ syncStarted: true, syncReport: {} }, 'Synchronising...'],
		[{ syncStarted: true, syncReport: { fetchingTotal: 10, fetchingProcessed: 4 } }, 'Fetched items: 4/10.'],
		[{ syncStarted: false, syncReport: {}, resourceFetcher: { toFetchCount: 5, fetchingCount: 2 } }, 'Fetching resources: 2/5'],
		[{ syncStarted: false, syncReport: {}, decryptionWorker: { state: 'started', itemIndex: 2, itemCount: 9 } }, 'Decrypting items: 3/9'],
	])('should describe %j', (state, text) => {
		const activity = syncActivity({ decryptionWorker: idleWorker, resourceFetcher: idleFetcher, ...state } as Parameters<typeof syncActivity>[0]);
		expect(activity?.text ?? null).toBe(text);
	});
});
