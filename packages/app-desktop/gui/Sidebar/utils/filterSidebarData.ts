// Fork: what the sidebar filter box keeps. Notebooks and tags whose title contains the filter
// text, ignoring case and accents, plus the parents of matching notebooks so that each match
// keeps its place in the tree.

import { FolderEntity, TagsWithNoteCountEntity } from '@joplin/lib/services/database/types';
import { removeDiacritics } from '@joplin/lib/string-utils';

const normalize = (text: string) => removeDiacritics(text ?? '').toLowerCase();

export const filterFolders = (folders: FolderEntity[], filter: string) => {
	const query = normalize(filter.trim());
	if (!query) return folders;

	const foldersById = new Map(folders.map(folder => [folder.id, folder]));
	const keptIds = new Set<string>();
	for (const folder of folders) {
		if (!normalize(folder.title).includes(query)) continue;

		let current = folder;
		while (current && !keptIds.has(current.id)) {
			keptIds.add(current.id);
			current = foldersById.get(current.parent_id);
		}
	}

	return folders.filter(folder => keptIds.has(folder.id));
};

export const filterTags = (tags: TagsWithNoteCountEntity[], filter: string) => {
	const query = normalize(filter.trim());
	if (!query) return tags;
	return tags.filter(tag => normalize(tag.title).includes(query));
};
