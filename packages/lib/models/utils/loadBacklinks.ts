// Fork: the notes that link to a note, for the Workbench outline.

import Note from '../Note';
import { NoteEntity } from '../../services/database/types';

const maxBacklinks = 20;

const loadBacklinks = async (noteId: string): Promise<NoteEntity[]> => {
	return Note.db().selectAll(
		`SELECT id, title, parent_id FROM notes
		WHERE id != ? AND deleted_time = 0 AND is_conflict = 0 AND encryption_applied = 0 AND body LIKE ?
		ORDER BY user_updated_time DESC LIMIT ?`,
		[noteId, `%:/${noteId}%`, maxBacklinks],
	);
};

export default loadBacklinks;
