import { FolderEntity } from '@joplin/lib/services/database/types';
import { getTrashFolderId } from '@joplin/lib/services/trash';
import { folderDropPlacement, notebooksDropOutcome, notebooksPlacementOutcome, notesDropOutcome } from './dropTargets';
import { FolderPlacement } from '@joplin/lib/models/utils/folderOrder';

const folders: FolderEntity[] = [
	{ id: 'projects', title: 'Projects', parent_id: '' },
	{ id: 'fork', title: 'Fork', parent_id: 'projects' },
	{ id: 'docs', title: 'Docs', parent_id: 'fork' },
	{ id: 'recipes', title: 'Recipes', parent_id: '' },
];

describe('dropTargets', () => {
	test.each([
		[['fork'], 'recipes', 'Move into Recipes', true],
		[['fork'], '', 'Move to the top level', true],
		[['recipes'], '', 'Already at the top level', false],
		[['fork'], 'projects', 'Already in Projects', false],
		[['projects'], 'projects', 'Can\'t move a notebook into itself', false],
		[['projects'], 'docs', 'Can\'t move a notebook into itself', false],
		[['recipes', 'projects'], 'docs', 'Can\'t move a notebook into itself', false],
		[['fork'], getTrashFolderId(), 'Move to the trash', true],
	])('should describe dropping notebooks %j on %j', (draggedIds, targetId, label, allowed) => {
		expect(notebooksDropOutcome(draggedIds, targetId, folders)).toEqual({ label, allowed });
	});

	test.each([
		[2, FolderPlacement.Before],
		[15, null],
		[28, FolderPlacement.After],
	])('should place notebooks dropped %dpx into a row', (offset, placement) => {
		expect(folderDropPlacement('fork', 100 + offset, { top: 100, height: 30 })).toBe(placement);
		expect(folderDropPlacement(getTrashFolderId(), 100 + offset, { top: 100, height: 30 })).toBe(null);
	});

	test.each([
		[['recipes'], 'projects', FolderPlacement.Before, true, 'Move above Projects', true],
		[['recipes'], 'fork', FolderPlacement.After, false, 'Move below Fork (switches to custom order)', true],
		[['projects'], 'docs', FolderPlacement.Before, true, 'Can\'t move a notebook into itself', false],
		[['fork'], 'fork', FolderPlacement.After, true, 'Already here', false],
	])('should describe placing notebooks %j next to %j', (draggedIds, targetId, placement, customOrder, label, allowed) => {
		expect(notebooksPlacementOutcome(draggedIds, targetId, placement, folders, customOrder)).toEqual({ label, allowed });
	});

	test('should describe dropping notes', () => {
		expect(notesDropOutcome('fork', folders)).toEqual({ label: 'Move to Fork', allowed: true });
		expect(notesDropOutcome('', folders)).toBe(null);
	});
});
