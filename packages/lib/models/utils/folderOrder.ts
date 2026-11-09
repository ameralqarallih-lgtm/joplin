// Fork: the custom notebook order. Each notebook's position among its siblings lives in its user data, so it syncs
// and upstream clients ignore it. Notebooks are shown in this order when "Sort notebooks by" is "Custom order".

import { ModelType } from '../../BaseModel';
import { FolderEntity } from '../../services/database/types';
import getTrashFolderId from '../../services/trash/getTrashFolderId';
import Folder from '../Folder';
import { getUserData, setItemUserData, unserializeUserData } from './userData';

const orderNamespace = 'org.inkbench';
const orderKey = 'order';
const orderStep = 1024;

export const customFolderOrderField = 'order';

export enum FolderPlacement {
	Before = 'before',
	After = 'after',
}

const orderCache = new Map<string, number|null>();

export const folderOrder = (folder: Pick<FolderEntity, 'user_data'>): number|null => {
	const userData = folder?.user_data;
	if (!userData) return null;

	const cached = orderCache.get(userData);
	if (cached !== undefined) return cached;

	let order: number|null = null;
	try {
		const value = getUserData<number>(unserializeUserData(userData), orderNamespace, orderKey);
		if (typeof value === 'number' && Number.isFinite(value)) order = value;
	} catch (error) {
		// Unreadable user data has no order.
	}

	if (orderCache.size > 1000) orderCache.clear();
	orderCache.set(userData, order);
	return order;
};

// Notebooks without a position go last. Sorting is stable, so they keep their incoming order (by title).
export const sortFoldersByCustomOrder = <T extends FolderEntity>(folders: T[]) => {
	return folders.slice().sort((a, b) => {
		const orderA = folderOrder(a);
		const orderB = folderOrder(b);
		if (orderA === orderB) return 0;
		if (orderA === null) return 1;
		if (orderB === null) return -1;
		return orderA - orderB;
	});
};

const parentId = (folder: FolderEntity) => folder.parent_id ?? '';

const isOrderable = (folder: FolderEntity) => {
	return !folder.deleted_time && folder.id !== getTrashFolderId() && folder.id !== Folder.conflictFolderId();
};

// The new positions of the given notebooks, which are siblings in their new order. Only the dragged notebooks
// move when there's room between their new neighbours; otherwise the whole group is renumbered.
const siblingOrders = (ordered: FolderEntity[], dragged: FolderEntity[], renumber: boolean) => {
	const result = new Map<string, number>();
	const start = ordered.indexOf(dragged[0]);
	const before = start > 0 ? folderOrder(ordered[start - 1]) : null;
	const after = start + dragged.length < ordered.length ? folderOrder(ordered[start + dragged.length]) : null;
	const low = before ?? (after !== null ? after - orderStep * (dragged.length + 1) : 0);
	const high = after ?? low + orderStep * (dragged.length + 1);
	const gap = (high - low) / (dragged.length + 1);

	if (renumber || gap < 1e-6) {
		for (const [index, folder] of ordered.entries()) result.set(folder.id, (index + 1) * orderStep);
	} else {
		for (const [index, folder] of dragged.entries()) result.set(folder.id, low + gap * (index + 1));
	}
	return result;
};

// Computes where the dragged notebooks go when dropped before or after the target, as new positions by
// notebook ID. `displayed` is every notebook in the order shown. When switching to the custom order, every
// notebook gets a position matching what was shown, so that nothing else moves.
export const folderPlacementOrders = (draggedIds: string[], targetId: string, placement: FolderPlacement, displayed: FolderEntity[], switchingToCustomOrder: boolean) => {
	const target = displayed.find(folder => folder.id === targetId);
	if (!target) throw new Error(`No such notebook: ${targetId}`);
	const targetParentId = parentId(target);
	const dragged = displayed.filter(folder => draggedIds.includes(folder.id));

	const groups = new Map<string, FolderEntity[]>();
	for (const folder of displayed) {
		if (!isOrderable(folder) || draggedIds.includes(folder.id)) continue;
		const key = parentId(folder);
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key).push(folder);
	}

	const siblings = groups.get(targetParentId) ?? [];
	let index = siblings.findIndex(folder => folder.id === targetId);
	if (placement === FolderPlacement.After) index++;
	const ordered = [...siblings.slice(0, index), ...dragged, ...siblings.slice(index)];
	const someMissing = ordered.some(folder => !draggedIds.includes(folder.id) && folderOrder(folder) === null);

	const orders = siblingOrders(ordered, dragged, switchingToCustomOrder || someMissing);
	if (switchingToCustomOrder) {
		for (const [key, group] of groups) {
			if (key === targetParentId) continue;
			for (const [index, folder] of group.entries()) orders.set(folder.id, (index + 1) * orderStep);
		}
	}
	return orders;
};

// Moves the dragged notebooks next to the target, under the target's parent, and saves the new positions.
export const placeFolders = async (draggedIds: string[], targetId: string, placement: FolderPlacement, displayed: FolderEntity[], switchingToCustomOrder: boolean) => {
	const target = displayed.find(folder => folder.id === targetId);
	if (!target) throw new Error(`No such notebook: ${targetId}`);

	for (const id of draggedIds) {
		const folder = displayed.find(f => f.id === id);
		if (folder && parentId(folder) !== parentId(target)) await Folder.moveToFolder(id, parentId(target));
	}

	const orders = folderPlacementOrders(draggedIds, targetId, placement, displayed, switchingToCustomOrder);
	for (const [id, order] of orders) {
		const folder = displayed.find(f => f.id === id);
		if (folder && folderOrder(folder) === order) continue;
		await setItemUserData(ModelType.Folder, id, orderNamespace, orderKey, order);
	}
};
