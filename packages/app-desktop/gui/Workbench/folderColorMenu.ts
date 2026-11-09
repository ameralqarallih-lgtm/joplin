// Fork: the "Colour" submenu of the notebook context menu, with a colour circle beside each preset.

import { MenuItemConstructorOptions, NativeImage, nativeImage } from 'electron';
import { _ } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import { FolderEntity } from '@joplin/lib/services/database/types';
import { folderColor, folderColorPresets, setFolderColor } from '@joplin/lib/models/utils/folderColor';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('folderColorMenu');

const iconCache = new Map<string, NativeImage>();

// A 16px circle drawn at twice the size for high-density screens. The current colour gets a tick.
const colorIcon = (color: string, current: boolean) => {
	const key = `${color}:${current}`;
	if (iconCache.has(key)) return iconCache.get(key);

	const size = 32;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const context = canvas.getContext('2d');

	context.beginPath();
	context.arc(16, 16, color ? 12 : 10.5, 0, 2 * Math.PI);
	if (color) {
		context.fillStyle = color;
		context.fill();
	} else {
		context.strokeStyle = '#8b8d98';
		context.lineWidth = 2.5;
		context.stroke();
	}

	if (current) {
		context.beginPath();
		context.moveTo(10.5, 16.5);
		context.lineTo(14.5, 20.5);
		context.lineTo(21.5, 12);
		context.strokeStyle = color ? '#ffffff' : '#8b8d98';
		context.lineWidth = 3;
		context.lineCap = 'round';
		context.lineJoin = 'round';
		context.stroke();
	}

	const png = Buffer.from(canvas.toDataURL('image/png').split(',')[1], 'base64');
	const icon = nativeImage.createFromBuffer(png, { scaleFactor: 2 });
	iconCache.set(key, icon);
	return icon;
};

const applyColor = (folders: FolderEntity[], color: string) => async () => {
	try {
		for (const folder of folders) await setFolderColor(folder.id, color);
	} catch (error) {
		logger.error('Could not set the notebook colour:', error);
	}
};

const folderColorMenuItem = (folders: FolderEntity[]): MenuItemConstructorOptions => {
	const colors = new Set(folders.map(folder => folderColor(folder)));
	const current = colors.size === 1 ? [...colors][0] : null;
	const customColor = current && !folderColorPresets.some(preset => preset.value === current) ? current : '';

	const submenu: MenuItemConstructorOptions[] = [
		{ label: _('No colour'), icon: colorIcon('', current === ''), click: applyColor(folders, '') },
		{ type: 'separator' },
		...folderColorPresets.map(preset => ({
			label: preset.label(),
			icon: colorIcon(preset.value, current === preset.value),
			click: applyColor(folders, preset.value),
		})),
	];

	if (folders.length === 1) {
		submenu.push(
			{ type: 'separator' },
			{
				label: customColor ? _('Custom colour (%s)...', customColor) : _('Custom colour...'),
				icon: customColor ? colorIcon(customColor, true) : undefined,
				click: () => {
					void CommandService.instance().execute('openFolderDialog', { folderId: folders[0].id });
				},
			},
		);
	}

	return { label: _('Colour'), submenu };
};

export default folderColorMenuItem;
