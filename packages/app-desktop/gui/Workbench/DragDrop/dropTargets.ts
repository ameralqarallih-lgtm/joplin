// Fork: what would happen when notes or notebooks are dropped on a sidebar item, described for the drag preview.

import { _ } from '@joplin/lib/locale';
import Folder from '@joplin/lib/models/Folder';
import { FolderEntity } from '@joplin/lib/services/database/types';
import { getTrashFolderId } from '@joplin/lib/services/trash';
import { FolderPlacement } from '@joplin/lib/models/utils/folderOrder';

export interface DropOutcome {
	label: string;
	allowed: boolean;
}

const isInside = (folderId: string, ancestorId: string, folders: FolderEntity[]) => {
	const seen = new Set<string>();
	let current = folders.find(folder => folder.id === folderId);
	while (current?.parent_id && !seen.has(current.id)) {
		if (current.parent_id === ancestorId) return true;
		seen.add(current.id);
		const parentId = current.parent_id;
		current = folders.find(folder => folder.id === parentId);
	}
	return false;
};

const folderTitle = (folderId: string, folders: FolderEntity[]) => {
	const folder = folders.find(f => f.id === folderId);
	return folder ? Folder.displayTitle(folder) : '';
};

const cantMoveHere = (): DropOutcome => ({ label: _('Can\'t move here'), allowed: false });

// targetId is empty for the "Notebooks" header, which moves notebooks to the top level.
export const notebooksDropOutcome = (draggedIds: string[], targetId: string, folders: FolderEntity[]): DropOutcome => {
	if (targetId === Folder.conflictFolderId()) return cantMoveHere();
	if (targetId === getTrashFolderId()) return { label: _('Move to the trash'), allowed: true };

	if (draggedIds.some(id => id === targetId || isInside(targetId, id, folders))) {
		return { label: _('Can\'t move a notebook into itself'), allowed: false };
	}

	const title = folderTitle(targetId, folders);
	const alreadyThere = draggedIds.length && draggedIds.every(id => (folders.find(folder => folder.id === id)?.parent_id ?? '') === targetId);
	if (alreadyThere) {
		return { label: targetId ? _('Already in %s', title) : _('Already at the top level'), allowed: false };
	}

	return { label: targetId ? _('Move into %s', title) : _('Move to the top level'), allowed: true };
};

// Where in a notebook's row notebooks are being dropped: its top and bottom edges place them above or below it,
// and its middle puts them inside. The trash and the conflicts only take items inside.
export const folderDropPlacement = (targetId: string, clientY: number, rect: Pick<DOMRect, 'top' | 'height'>): FolderPlacement|null => {
	if (!targetId || targetId === getTrashFolderId() || targetId === Folder.conflictFolderId()) return null;
	const position = (clientY - rect.top) / rect.height;
	if (position < 0.3) return FolderPlacement.Before;
	if (position > 0.7) return FolderPlacement.After;
	return null;
};

// Dropping notebooks above or below another notebook, which also moves them under that notebook's parent.
export const notebooksPlacementOutcome = (draggedIds: string[], targetId: string, placement: FolderPlacement, folders: FolderEntity[], customOrder: boolean): DropOutcome => {
	const target = folders.find(folder => folder.id === targetId);
	if (!target) return cantMoveHere();
	if (draggedIds.includes(targetId)) return { label: _('Already here'), allowed: false };

	const parentId = target.parent_id ?? '';
	if (parentId && draggedIds.some(id => id === parentId || isInside(parentId, id, folders))) {
		return { label: _('Can\'t move a notebook into itself'), allowed: false };
	}

	const title = Folder.displayTitle(target);
	if (placement === FolderPlacement.Before) {
		return { label: customOrder ? _('Move above %s', title) : _('Move above %s (switches to custom order)', title), allowed: true };
	}
	return { label: customOrder ? _('Move below %s', title) : _('Move below %s (switches to custom order)', title), allowed: true };
};

// Returns null for the "Notebooks" header: notes always belong to a notebook.
export const notesDropOutcome = (targetId: string, folders: FolderEntity[]): DropOutcome|null => {
	if (!targetId) return null;
	if (targetId === Folder.conflictFolderId()) return cantMoveHere();
	if (targetId === getTrashFolderId()) return { label: _('Move to the trash'), allowed: true };
	return { label: _('Move to %s', folderTitle(targetId, folders)), allowed: true };
};
