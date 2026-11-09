// Fork: the note list's sort button opens this menu, instead of moving on to the next sort field
// without showing which ones there are.

import type { MenuItemConstructorOptions } from 'electron';
import Setting from '@joplin/lib/models/Setting';
import CommandService from '@joplin/lib/services/CommandService';
import bridge from '../../services/bridge';

export const sortOrderMenuTemplate = (currentField: string, reverse: boolean) => {
	const commands = CommandService.instance();
	const fieldItems: MenuItemConstructorOptions[] = Object.entries(Setting.enumOptions('notes.sortOrder.field')).map(([field, label]) => ({
		label: String(label),
		type: 'radio',
		checked: field === currentField,
		click: () => void commands.execute('toggleNotesSortOrderField', field),
	}));

	return [
		...fieldItems,
		{ type: 'separator' },
		{
			label: commands.label('toggleNotesSortOrderReverse'),
			type: 'checkbox',
			checked: reverse,
			click: () => void commands.execute('toggleNotesSortOrderReverse'),
		},
	] as MenuItemConstructorOptions[];
};

const showSortOrderMenu = (currentField: string, reverse: boolean, anchor: Element | null) => {
	const rect = anchor?.getBoundingClientRect();
	bridge().Menu.buildFromTemplate(sortOrderMenuTemplate(currentField, reverse)).popup({
		window: bridge().mainWindow(),
		...(rect ? { x: Math.round(rect.left), y: Math.round(rect.bottom) } : {}),
	});
};

export default showSortOrderMenu;
