// Fork: plain-text excerpts for a list of notes, for note lists that show a preview line. Only the
// start of each body is read. Locked and still-encrypted notes get no excerpt.

import Note from '../Note';
import noteExcerpt from '../../services/noteList/noteExcerpt';
import isNoteLockEnabled from '../../services/noteLock/isNoteLockEnabled';

interface Row {
	id: string;
	title: string;
	body: string;
	is_locked: number;
	encryption_applied: number;
}

// Stays under SQLite's limit on the number of query parameters.
const batchSize = 500;

const loadNoteExcerpts = async (noteIds: string[]) => {
	const excerpts: Record<string, string> = {};
	const lockEnabled = isNoteLockEnabled();

	for (let start = 0; start < noteIds.length; start += batchSize) {
		const ids = noteIds.slice(start, start + batchSize);
		const rows: Row[] = await Note.db().selectAll(
			`SELECT id, title, substr(body, 1, 3000) AS body, is_locked, encryption_applied FROM notes WHERE id IN (${ids.map(() => '?').join(',')})`,
			ids,
		);
		for (const row of rows) {
			const hidden = (lockEnabled && row.is_locked) || row.encryption_applied;
			excerpts[row.id] = hidden ? '' : noteExcerpt(row.body, row.title);
		}
	}

	return excerpts;
};

export default loadNoteExcerpts;
