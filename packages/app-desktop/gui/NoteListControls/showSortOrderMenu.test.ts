import { sortOrderMenuTemplate } from './showSortOrderMenu';
import CommandService from '@joplin/lib/services/CommandService';
import { setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';

const clickItem = (item: { click?: unknown }) => (item.click as ()=> void)();

describe('showSortOrderMenu', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('should check the current sort field and run the matching command on click', () => {
		const execute = jest.spyOn(CommandService.instance(), 'execute').mockResolvedValue(undefined);
		jest.spyOn(CommandService.instance(), 'label').mockReturnValue('Reverse sort order');

		const template = sortOrderMenuTemplate('title', false);
		expect(template.filter(item => item.checked).map(item => item.label)).toEqual(['Title']);

		clickItem(template.find(item => item.label === 'Created date'));
		expect(execute).toHaveBeenLastCalledWith('toggleNotesSortOrderField', 'user_created_time');

		clickItem(template[template.length - 1]);
		expect(execute).toHaveBeenLastCalledWith('toggleNotesSortOrderReverse');
	});
});
