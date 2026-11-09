import Folder from '../Folder';
import { setupDatabaseAndSynchronizer, switchClient } from '../../testing/test-utils';
import { folderColor, folderColorPresets, setFolderColor } from './folderColor';

describe('folderColor', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('should set, read and remove a notebook colour', async () => {
		const folder = await Folder.save({ title: 'Projects' });
		expect(folderColor(await Folder.load(folder.id))).toBe('');

		await setFolderColor(folder.id, '#3E63DD');
		expect(folderColor(await Folder.load(folder.id))).toBe('#3e63dd');

		await setFolderColor(folder.id, folderColorPresets[0].value);
		expect(folderColor(await Folder.load(folder.id))).toBe(folderColorPresets[0].value);

		await setFolderColor(folder.id, '');
		expect(folderColor(await Folder.load(folder.id))).toBe('');
	});

	test.each([
		'red',
		'#fff',
		'#12345g',
	])('should reject the colour %s', async (color) => {
		const folder = await Folder.save({ title: 'Projects' });
		await expect(setFolderColor(folder.id, color)).rejects.toThrow();
	});

	test.each([
		['', ''],
		['not json', ''],
		['{"org.inkbench":{"color":{"v":"url(x)","t":1}}}', ''],
		['{"org.inkbench":{"color":{"v":"#30A46C","t":1}}}', '#30a46c'],
		['{"org.inkbench":{"color":{"v":"#30a46c","t":1,"d":1}}}', ''],
	])('should read the colour from user data %j', (userData, expected) => {
		expect(folderColor({ user_data: userData })).toBe(expected);
	});
});
