// Fork: the notes Goto Anything lists before anything is typed. First the notes visited in this
// session, most recent first, then the most recently changed notes.

import Note from '@joplin/lib/models/Note';
import Folder from '@joplin/lib/models/Folder';
import { ALL_NOTES_FILTER_ID } from '@joplin/lib/reserved-ids';
import { FolderEntity, NoteEntity } from '@joplin/lib/services/database/types';

const maxResults = 12;

const gotoAnythingRecentNotes = async (visitedNotes: NoteEntity[], excludedIds: string[], folders: FolderEntity[]) => {
	const visitedIds: string[] = [];
	for (const note of [...visitedNotes].reverse()) {
		if (!excludedIds.includes(note.id) && !visitedIds.includes(note.id)) visitedIds.push(note.id);
	}

	const visited = (await Note.byIds(visitedIds.slice(0, maxResults), { fields: ['id', 'title', 'parent_id', 'deleted_time', 'is_conflict'] }))
		.filter(note => !note.deleted_time && !note.is_conflict)
		.sort((a, b) => visitedIds.indexOf(a.id) - visitedIds.indexOf(b.id));

	const notes: NoteEntity[] = [...visited];
	const changed = await Note.previews(ALL_NOTES_FILTER_ID, { fields: ['id', 'title', 'parent_id'], limit: maxResults * 2 });
	for (const note of changed) {
		if (notes.length >= maxResults) break;
		if (!excludedIds.includes(note.id) && !notes.find(n => n.id === note.id)) notes.push(note);
	}

	return notes.map(note => ({
		id: note.id,
		title: note.title,
		parent_id: note.parent_id,
		fields: ['title'],
		path: Folder.folderPathString(folders, note.parent_id),
		fragments: '',
	}));
};

export default gotoAnythingRecentNotes;
