import { FolderEntity } from '@joplin/lib/services/database/types';
import { getTrashFolderId } from '@joplin/lib/services/trash';
import { notebooksDropOutcome, notesDropOutcome } from './dropTargets';

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

	test('should describe dropping notes', () => {
		expect(notesDropOutcome('fork', folders)).toEqual({ label: 'Move to Fork', allowed: true });
		expect(notesDropOutcome('', folders)).toBe(null);
	});
});
