import Folder from '../Folder';
import Setting from '../Setting';
import { setupDatabaseAndSynchronizer, switchClient } from '../../testing/test-utils';
import { allForDisplay } from '../../folders-screen-utils';
import { FolderPlacement, folderOrder, placeFolders, sortFoldersByCustomOrder } from './folderOrder';

// The sidebar groups notebooks by parent, so only the order among siblings matters.
const titles = async (parentId = '') => (await allForDisplay()).filter(folder => folder.parent_id === parentId).map(folder => folder.title);

describe('folderOrder', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('should sort notebooks with a position first, then the others in their incoming order', () => {
		const withOrder = (title: string, order: number) => ({ title, user_data: JSON.stringify({ 'org.inkbench': { order: { v: order, t: 1 } } }) });
		const sorted = sortFoldersByCustomOrder([{ title: 'a' }, withOrder('b', 2048), { title: 'c' }, withOrder('d', 1024)]);
		expect(sorted.map(folder => folder.title)).toEqual(['d', 'b', 'a', 'c']);
	});

	test('should switch to the custom order without moving anything but the dropped notebook', async () => {
		const alpha = await Folder.save({ title: 'Alpha' });
		const beta = await Folder.save({ title: 'Beta' });
		const gamma = await Folder.save({ title: 'Gamma' });
		const child = await Folder.save({ title: 'Child', parent_id: alpha.id });

		await placeFolders([gamma.id], alpha.id, FolderPlacement.Before, await allForDisplay(), true);
		Setting.setValue('folders.sortOrder.field', 'order');
		expect(await titles()).toEqual(['Gamma', 'Alpha', 'Beta']);
		expect(folderOrder(await Folder.load(child.id))).not.toBe(null);

		await placeFolders([gamma.id], beta.id, FolderPlacement.After, await allForDisplay(), false);
		expect(await titles()).toEqual(['Alpha', 'Beta', 'Gamma']);
	});

	test('should move a notebook next to a notebook in another parent', async () => {
		const alpha = await Folder.save({ title: 'Alpha' });
		const child = await Folder.save({ title: 'Child', parent_id: alpha.id });
		const beta = await Folder.save({ title: 'Beta' });
		Setting.setValue('folders.sortOrder.field', 'order');

		await placeFolders([beta.id], child.id, FolderPlacement.Before, await allForDisplay(), false);
		expect((await Folder.load(beta.id)).parent_id).toBe(alpha.id);
		expect(await titles(alpha.id)).toEqual(['Beta', 'Child']);
	});
});
