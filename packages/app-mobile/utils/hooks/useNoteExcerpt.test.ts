import { renderHook, waitFor } from '../testing/testingLibrary';
import useNoteExcerpt from './useNoteExcerpt';
import loadNoteExcerpts from '@joplin/lib/models/utils/loadNoteExcerpts';

jest.mock('@joplin/lib/models/utils/loadNoteExcerpts', () => ({
	__esModule: true,
	default: jest.fn(async (ids: string[]) => Object.fromEntries(ids.map(id => [id, `Excerpt of ${id}`]))),
}));

describe('useNoteExcerpt', () => {
	test('should load the excerpts of notes rendered together in one query, and cache them', async () => {
		const first = renderHook(() => useNoteExcerpt('a', 1));
		const second = renderHook(() => useNoteExcerpt('b', 1));

		await waitFor(() => expect(first.result.current).toBe('Excerpt of a'));
		await waitFor(() => expect(second.result.current).toBe('Excerpt of b'));
		expect(loadNoteExcerpts).toHaveBeenCalledTimes(1);

		const again = renderHook(() => useNoteExcerpt('a', 1));
		expect(again.result.current).toBe('Excerpt of a');
		expect(loadNoteExcerpts).toHaveBeenCalledTimes(1);
	});
});
