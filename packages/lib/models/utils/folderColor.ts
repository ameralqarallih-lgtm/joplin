// Fork: notebook colours. The colour lives in the notebook's user data, so it syncs and merges like any other
// user data, and clients that don't know about it ignore it.

import { ModelType } from '../../BaseModel';
import { _ } from '../../locale';
import { FolderEntity } from '../../services/database/types';
import { deleteItemUserData, getUserData, setItemUserData, unserializeUserData } from './userData';

const colorNamespace = 'org.inkbench';
const colorKey = 'color';

export interface FolderColorPreset {
	value: string;
	label: ()=> string;
}

// Mid-tones that read on light and dark backgrounds alike.
export const folderColorPresets: FolderColorPreset[] = [
	{ value: '#e5484d', label: () => _('Red') },
	{ value: '#f76b15', label: () => _('Orange') },
	{ value: '#e2a336', label: () => _('Yellow') },
	{ value: '#30a46c', label: () => _('Green') },
	{ value: '#12a594', label: () => _('Teal') },
	{ value: '#0d9bd8', label: () => _('Sky') },
	{ value: '#3e63dd', label: () => _('Blue') },
	{ value: '#8e4ec6', label: () => _('Purple') },
	{ value: '#d6409f', label: () => _('Pink') },
	{ value: '#a07553', label: () => _('Brown') },
	{ value: '#8b8d98', label: () => _('Grey') },
];

export const isValidFolderColor = (color: string) => /^#[0-9a-f]{6}$/i.test(color ?? '');

// The sidebar asks for every notebook's colour on each render, so parsed user data is cached.
const colorCache = new Map<string, string>();

// Returns the notebook's colour as a lowercase hex colour, such as "#3e63dd", or an empty string if it has none.
export const folderColor = (folder: Pick<FolderEntity, 'user_data'>) => {
	const userData = folder?.user_data;
	if (!userData) return '';

	const cached = colorCache.get(userData);
	if (cached !== undefined) return cached;

	let color = '';
	try {
		const value = getUserData<string>(unserializeUserData(userData), colorNamespace, colorKey);
		if (typeof value === 'string' && isValidFolderColor(value)) color = value.toLowerCase();
	} catch (error) {
		// Unreadable user data has no colour.
	}

	if (colorCache.size > 1000) colorCache.clear();
	colorCache.set(userData, color);
	return color;
};

export const folderColorLabel = (color: string) => {
	return folderColorPresets.find(preset => preset.value === color)?.label() ?? color;
};

// An empty colour removes it.
export const setFolderColor = async (folderId: string, color: string) => {
	if (!color) return deleteItemUserData(ModelType.Folder, folderId, colorNamespace, colorKey);
	if (!isValidFolderColor(color)) throw new Error(`Invalid notebook colour: ${color}`);
	return setItemUserData(ModelType.Folder, folderId, colorNamespace, colorKey, color.toLowerCase());
};
