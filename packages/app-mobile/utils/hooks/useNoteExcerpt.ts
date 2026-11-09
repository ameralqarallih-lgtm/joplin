// Fork: the excerpt shown under a note's title in the note list. The requests made while the list
// renders are combined into a single query, and results are cached until the note changes.

import { useEffect, useState } from 'react';
import loadNoteExcerpts from '@joplin/lib/models/utils/loadNoteExcerpts';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('useNoteExcerpt');

const maxCacheSize = 2000;
const cache = new Map<string, string>();
let pending: Map<string, ((excerpt: string)=> void)[]> | null = null;

const cacheKey = (noteId: string, updatedTime: number) => `${noteId}:${updatedTime}`;

const loadPending = async () => {
	const batch = pending;
	pending = null;

	const noteIds = [...new Set([...batch.keys()].map(key => key.split(':')[0]))];
	let excerpts: Record<string, string> = {};
	try {
		excerpts = await loadNoteExcerpts(noteIds);
	} catch (error) {
		logger.warn('Could not load excerpts:', error);
	}

	if (cache.size > maxCacheSize) cache.clear();
	for (const [key, resolvers] of batch) {
		const excerpt = excerpts[key.split(':')[0]] ?? '';
		cache.set(key, excerpt);
		for (const resolve of resolvers) resolve(excerpt);
	}
};

const requestExcerpt = (key: string) => {
	return new Promise<string>(resolve => {
		if (!pending) {
			pending = new Map();
			setTimeout(() => void loadPending(), 0);
		}
		pending.set(key, [...(pending.get(key) ?? []), resolve]);
	});
};

const useNoteExcerpt = (noteId: string | undefined, updatedTime: number | undefined) => {
	const key = noteId ? cacheKey(noteId, updatedTime ?? 0) : '';
	const [excerpt, setExcerpt] = useState(() => cache.get(key) ?? '');

	useEffect(() => {
		if (!key) return () => {};
		if (cache.has(key)) {
			setExcerpt(cache.get(key));
			return () => {};
		}

		let cancelled = false;
		void (async () => {
			const result = await requestExcerpt(key);
			if (!cancelled) setExcerpt(result);
		})();
		return () => {
			cancelled = true;
		};
	}, [key]);

	return excerpt;
};

export default useNoteExcerpt;
