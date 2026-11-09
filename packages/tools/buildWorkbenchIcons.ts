// Fork: generates the Workbench icon set. Each Font Awesome or Joplin icon class that the desktop app
// uses is mapped to a Lucide icon (https://lucide.dev, ISC licence), which the Workbench layer shows
// instead of the original glyph. Classes not listed here keep their original icon.
//
// The mobile app gets the same icons as react-native-svg shapes (app-mobile/components/LucideIcon).
//
// Usage: download lucide-static (for example `npm pack lucide-static@1.60.0`), then run
//   node packages/tools/buildWorkbenchIcons.js <path to lucide-static/icons> <lucide version>

import { readFile, writeFile } from 'fs-extra';
import { join } from 'path';
import { rootDir } from './tool-utils';

const iconMap: Record<string, string> = {
	// Joplin's own icon font
	'icon-add-date': 'calendar-plus',
	'icon-alarm': 'bell',
	'icon-appearance': 'palette',
	'icon-application': 'app-window',
	'icon-encryption': 'lock-keyhole',
	'icon-general': 'sliders-horizontal',
	'icon-note-history': 'history',
	'icon-plugins': 'puzzle',
	'icon-attachment': 'paperclip',
	'icon-back': 'arrow-left',
	'icon-bold': 'bold',
	'icon-bulleted-list': 'list',
	'icon-button': 'mouse-pointer-click',
	'icon-code': 'code',
	'icon-forward': 'arrow-right',
	'icon-gutter': 'panel-left',
	'icon-heading': 'heading',
	'icon-info': 'info',
	'icon-italic': 'italic',
	'icon-layout': 'columns-2',
	'icon-link': 'link',
	'icon-note': 'file-text',
	'icon-notebooks': 'book',
	'icon-notes': 'files',
	'icon-numbered-list': 'list-ordered',
	'icon-quote': 'quote',
	'icon-search': 'search',
	'icon-share': 'share-2',
	'icon-sync': 'refresh-cw',
	'icon-tags': 'tags',
	'icon-to-do-list': 'list-checks',
	// Fork: Workbench shell icons, no Joplin or Font Awesome equivalent
	'wb-icon-logo': 'book-open',
	'wb-icon-synced': 'cloud-check',
	'wb-icon-sync-off': 'cloud-off',
	// Fork: the emoji picker's category tabs, in its order (gui/Workbench/emoji-picker.scss)
	'wb-icon-emoji-recent': 'history',
	'wb-icon-emoji-smileys': 'smile',
	'wb-icon-emoji-people': 'user-round',
	'wb-icon-emoji-animals': 'cat',
	'wb-icon-emoji-food': 'coffee',
	'wb-icon-emoji-activities': 'volleyball',
	'wb-icon-emoji-travel': 'building-2',
	'wb-icon-emoji-objects': 'lightbulb',
	'wb-icon-emoji-symbols': 'music',
	'wb-icon-emoji-flags': 'flag',
	'wb-icon-search': 'search',
	'wb-icon-close': 'x',
	'wb-icon-not-found': 'frown',
	// Fork: the custom order, which upstream shows with a wrench (style.scss)
	'wb-icon-custom-order': 'arrow-down-up',

	// Font Awesome
	'fa-adjust': 'contrast',
	'fa-align-justify': 'align-justify',
	'fa-angle-down': 'chevron-down',
	'fa-angle-right': 'chevron-right',
	'fa-arrow-down': 'arrow-down',
	'fa-arrow-left': 'arrow-left',
	'fa-arrow-right': 'arrow-right',
	'fa-arrow-up': 'arrow-up',
	'fa-archive': 'archive',
	'fa-arrows-alt': 'move',
	'fa-bars': 'menu',
	'fa-bell': 'bell',
	'fa-book': 'book',
	'fa-calendar-alt': 'calendar',
	'fa-calendar-check': 'calendar-check',
	'fa-calendar-plus': 'calendar-plus',
	'fa-caret-down': 'chevron-down',
	'fa-caret-right': 'chevron-right',
	'fa-caret-square-down': 'square-chevron-down',
	'fa-caret-square-right': 'square-chevron-right',
	'fa-check': 'check',
	'fa-check-circle': 'circle-check',
	'fa-check-square': 'square-check',
	'fa-chevron-down': 'chevron-down',
	'fa-chevron-left': 'chevron-left',
	'fa-chevron-right': 'chevron-right',
	'fa-chevron-up': 'chevron-up',
	'fa-clock': 'clock',
	'fa-clone': 'copy',
	'fa-cloud': 'cloud',
	'fa-cog': 'settings',
	'fa-columns': 'columns-2',
	'fa-comment-dots': 'message-square-more',
	'fa-comment-medical': 'message-square-plus',
	'fa-copy': 'copy',
	'fa-crown': 'crown',
	'fa-download': 'download',
	'fa-edit': 'square-pen',
	'fa-ellipsis-h': 'ellipsis',
	'fa-ellipsis-v': 'ellipsis-vertical',
	'fa-exclamation-circle': 'circle-alert',
	'fa-exclamation-triangle': 'triangle-alert',
	'fa-external-link-alt': 'external-link',
	'fa-eye': 'eye',
	'fa-eye-slash': 'eye-off',
	'fa-file': 'file',
	'fa-file-export': 'file-output',
	'fa-folder': 'folder',
	'fa-font': 'type',
	'fa-globe': 'globe',
	'fa-history': 'history',
	'fa-info': 'info',
	'fa-info-circle': 'info',
	'fa-key': 'key-round',
	'fa-keyboard': 'keyboard',
	'fa-lock': 'lock',
	'fa-long-arrow-alt-down': 'arrow-down-wide-narrow',
	'fa-long-arrow-alt-up': 'arrow-up-narrow-wide',
	'fa-markdown': 'square-m',
	'fa-minus': 'minus',
	'fa-paper-plane': 'send',
	'fa-pen': 'pen',
	'fa-pen-alt': 'pencil',
	'fa-plus': 'plus',
	'fa-question': 'circle-help',
	'fa-question-circle': 'circle-help',
	'fa-save': 'save',
	'fa-search': 'search',
	'fa-share-alt': 'share-2',
	'fa-share-square': 'square-arrow-out-up-right',
	'fa-sign-out-alt': 'log-out',
	'fa-spinner': 'loader-circle',
	'fa-stop': 'square',
	'fa-sync-alt': 'refresh-cw',
	'fa-table': 'table',
	'fa-tag': 'tag',
	'fa-tags': 'tags',
	'fa-th': 'layout-grid',
	'fa-times': 'x',
	'fa-times-circle': 'circle-x',
	'fa-trash': 'trash-2',
	'fa-trash-restore': 'archive-restore',
	'fa-unlink': 'unlink',
	'fa-upload': 'upload',
	'fa-user': 'user',
	'fa-wrench': 'wrench',

	// Font Awesome icons that plugins commonly use for their buttons
	'fa-ban': 'ban',
	'fa-bold': 'bold',
	'fa-bug': 'bug',
	'fa-camera': 'camera',
	'fa-cloud-download-alt': 'cloud-download',
	'fa-cloud-upload-alt': 'cloud-upload',
	'fa-code': 'code',
	'fa-database': 'database',
	'fa-desktop': 'monitor',
	'fa-envelope': 'mail',
	'fa-file-import': 'file-input',
	'fa-filter': 'funnel',
	'fa-folder-open': 'folder-open',
	'fa-folder-plus': 'folder-plus',
	'fa-hand-scissors': 'scissors',
	'fa-heading': 'heading',
	'fa-heart': 'heart',
	'fa-home': 'house',
	'fa-image': 'image',
	'fa-images': 'images',
	'fa-italic': 'italic',
	'fa-language': 'languages',
	'fa-link': 'link',
	'fa-list-ol': 'list-ordered',
	'fa-list-ul': 'list',
	'fa-microphone': 'mic',
	'fa-minus-circle': 'circle-minus',
	'fa-mobile-alt': 'smartphone',
	'fa-moon': 'moon',
	'fa-music': 'music',
	'fa-paint-brush': 'paintbrush',
	'fa-palette': 'palette',
	'fa-paperclip': 'paperclip',
	'fa-plus-circle': 'circle-plus',
	'fa-power-off': 'power',
	'fa-print': 'printer',
	'fa-puzzle-piece': 'puzzle',
	'fa-quote-left': 'quote',
	'fa-redo': 'redo-2',
	'fa-reply': 'reply',
	'fa-robot': 'bot',
	'fa-server': 'server',
	'fa-shield-alt': 'shield',
	'fa-sign-in-alt': 'log-in',
	'fa-sliders-h': 'sliders-horizontal',
	'fa-sort': 'arrow-up-down',
	'fa-sort-amount-down': 'arrow-down-wide-narrow',
	'fa-spell-check': 'spell-check',
	'fa-star': 'star',
	'fa-sticky-note': 'sticky-note',
	'fa-sun': 'sun',
	'fa-terminal': 'terminal',
	'fa-thumbtack': 'pin',
	'fa-undo': 'undo-2',
	'fa-unlock': 'lock-open',
	'fa-video': 'video',
};

// The icon names that the mobile app passes to its Icon component.
const mobileIconMap: Record<string, string> = {
	// The settings sections (Setting.sectionNameToIcon)
	'fa fa-cloud': 'cloud',
	'fa fa-cog': 'settings',
	'fa fa-file-export': 'file-output',
	'fa fa-info-circle': 'info',
	'fa fa-key': 'key-round',
	'fa fa-keyboard': 'keyboard',
	'fa fa-lock': 'lock',
	'fa fa-plug': 'plug',
	'fa fa-puzzle-piece': 'puzzle',
	'fa fa-robot': 'bot',
	'fa fa-ruler': 'palette',
	'fa fa-sliders-h': 'sliders-horizontal',
	'fa fa-sticky-note': 'sticky-note',
	'fa fa-sync': 'refresh-cw',
	'fa fa-toolbox': 'toolbox',
	'fab fa-markdown': 'file-code',
	'far fa-hand-scissors': 'scissors',
	'far fa-history': 'history',
	'fas fa-pen': 'square-pen',

	'fas fa-check': 'check',
	'fas fa-circle': 'circle',
	'fas fa-crown': 'crown',
	'fas fa-lock': 'lock',
	'fas fa-plus': 'plus',
	'fas fa-times-circle': 'circle-x',
	'fas trash': 'trash-2',
	'ionicon alert-circle-outline': 'circle-alert',
	'ionicon arrow-back': 'arrow-left',
	'ionicon arrow-redo-circle-sharp': 'redo-2',
	'ionicon arrow-undo-circle-sharp': 'undo-2',
	'ionicon arrow-up': 'arrow-up',
	'ionicon book-outline': 'book',
	'ionicon camera': 'camera',
	'ionicon camera-reverse': 'switch-camera',
	'ionicon checkbox-outline': 'square-check',
	'ionicon checkmark': 'check',
	'ionicon checkmark-circle-outline': 'circle-check',
	'ionicon chevron-down': 'chevron-down',
	'ionicon chevron-up': 'chevron-up',
	'ionicon cloud-done-outline': 'cloud-check',
	'ionicon cloud-offline-outline': 'cloud-off',
	'ionicon copy': 'copy',
	'ionicon create-outline': 'square-pen',
	'ionicon document-outline': 'file',
	'ionicon ellipsis-vertical': 'ellipsis-vertical',
	'ionicon extension-puzzle': 'puzzle',
	'ionicon eye': 'eye',
	'ionicon filter': 'funnel',
	'ionicon folder-open-outline': 'folder-open',
	'ionicon folder-outline': 'folder',
	'ionicon home-outline': 'house',
	'ionicon journal-outline': 'notebook',
	'ionicon menu': 'menu',
	'ionicon pin-outline': 'pin',
	'ionicon pricetags-outline': 'tags',
	'ionicon reload-circle': 'refresh-cw',
	'ionicon search': 'search',
	'ionicon settings-outline': 'settings',
	'ionicon square-outline': 'square',
	'ionicon sync': 'refresh-cw',
	'ionicon trash': 'trash-2',
	'ionicon trash-outline': 'trash-2',
	'material arrow-down': 'arrow-down',
	'material arrow-up': 'arrow-up',
	'material attachment': 'paperclip',
	'material bell-outline': 'bell',
	'material calendar-plus': 'calendar-plus',
	'material camera-outline': 'camera',
	'material chevron-double-down': 'chevrons-down',
	'material chevron-double-up': 'chevrons-up',
	'material close': 'x',
	'material code-json': 'braces',
	'material code-tags': 'code',
	'material cogs': 'settings',
	'material content-copy': 'copy',
	'material content-duplicate': 'copy-plus',
	'material content-save': 'save',
	'material data-matrix-scan': 'scan',
	'material delete': 'trash-2',
	'material delete-off-outline': 'archive-restore',
	'material delete-outline': 'trash-2',
	'material draw': 'pen-tool',
	'material file-document-check-outline': 'file-check',
	'material file-document-outline': 'file-text',
	'material file-edit': 'file-pen',
	'material file-edit-outline': 'file-pen',
	'material file-send-outline': 'file-output',
	'material folder-file-outline': 'folder-input',
	'material format-bold': 'bold',
	'material format-indent-decrease': 'list-indent-decrease',
	'material format-indent-increase': 'list-indent-increase',
	'material format-italic': 'italic',
	'material format-list-bulleted': 'list',
	'material format-list-checks': 'list-checks',
	'material format-list-numbered': 'list-ordered',
	'material format-quote-close': 'quote',
	'material information-outline': 'info',
	'material keyboard-close': 'keyboard-off',
	'material link': 'link',
	'material lock-off-outline': 'lock-open',
	'material lock-outline': 'lock',
	'material lock-plus-outline': 'lock-keyhole',
	'material magnify': 'search',
	'material microphone-outline': 'mic',
	'material page-first': 'arrow-left-to-line',
	'material page-last': 'arrow-right-to-line',
	'material paperclip': 'paperclip',
	'material share-outline': 'share',
	'material sigma': 'sigma',
	'material sort-alphabetical-ascending': 'arrow-down-a-z',
	'material table': 'table',
	'material tag-multiple': 'tags',
	'material tag-outline': 'tag',
};

type IconNode = [string, Record<string, string>][];

// The shapes inside a Lucide SVG, such as [['path', { d: '...' }]]. Lucide's icons are flat lists of shapes.
const svgToIconNode = (svg: string): IconNode => {
	const body = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '');
	return [...body.matchAll(/<(\w+)\s([^>]*?)\/?>/g)].map(([, tag, attributes]) => {
		const attrs: Record<string, string> = {};
		for (const [, key, value] of attributes.matchAll(/([\w-]+)="([^"]*)"/g)) attrs[key] = value;
		return [tag, attrs];
	});
};

// Writes the shapes of the mobile icons as a TypeScript module, drawn with react-native-svg.
const mobileIconsModule = (iconNodes: Record<string, IconNode>, version: string) => {
	const lines = [
		`// Generated by packages/tools/buildWorkbenchIcons.ts from Lucide ${version} (ISC licence, see LICENSE-lucide.txt). Don't edit by hand.`,
		'',
		'export type LucideIconNode = [string, Record<string, string>][];',
		'',
		'const lucideIcons: Record<string, LucideIconNode> = {',
	];
	for (const name of Object.keys(mobileIconMap).sort()) {
		const nodes = iconNodes[mobileIconMap[name]];
		if (!nodes) throw new Error(`Unknown Lucide icon: ${mobileIconMap[name]}`);
		const elements = nodes.map(([tag, attrs]) => {
			const props = Object.entries(attrs).map(([key, value]) => `${key}: '${value}'`).join(', ');
			return `['${tag}', { ${props} }]`;
		});
		lines.push(`\t'${name}': [${elements.join(', ')}],`);
	}
	lines.push('};', '', 'export default lucideIcons;', '');
	return lines.join('\n');
};

// Lucide's default stroke of 2 (on a 24 unit grid) looks heavy at desktop sizes. 1.5 gives 1px lines at 16px.
const desktopStrokeWidth = '1.5';

// A mask only needs the shape, so drop the licence comment, and the class and size of the root element.
// The size attributes of shapes inside it, such as <rect>, are part of the drawing.
const svgToDataUri = (svg: string) => {
	const compact = svg
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<svg[^>]*>/, rootTag => rootTag.replace(/\s+(class|width|height)="[^"]*"/g, '').replace(/stroke-width="[^"]*"/, `stroke-width="${desktopStrokeWidth}"`))
		.replace(/\s+/g, ' ')
		.replace(/> </g, '><')
		.trim();
	const encoded = compact.replace(/"/g, '\'').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23');
	return `data:image/svg+xml,${encoded}`;
};

const main = async () => {
	const [iconDir, version] = process.argv.slice(2);
	if (!iconDir || !version) throw new Error('Usage: buildWorkbenchIcons <path to lucide-static/icons> <lucide version>');

	const lines = [
		`// Generated by packages/tools/buildWorkbenchIcons.ts from Lucide ${version} (ISC licence, see LICENSE-lucide.txt). Don't edit by hand.`,
		'',
		'$icons: (',
	];
	for (const className of Object.keys(iconMap).sort()) {
		const svg = await readFile(join(iconDir, `${iconMap[className]}.svg`), 'utf8');
		lines.push(`\t'${className}': "${svgToDataUri(svg)}",`);
	}
	lines.push(');', '');

	const output = join(rootDir, 'packages/app-desktop/gui/Workbench/icons/_icons.scss');
	await writeFile(output, lines.join('\n'), 'utf8');
	console.info(`Wrote ${Object.keys(iconMap).length} icons to ${output}`);

	const iconNodes: Record<string, IconNode> = {};
	for (const lucideName of new Set(Object.values(mobileIconMap))) {
		iconNodes[lucideName] = svgToIconNode(await readFile(join(iconDir, `${lucideName}.svg`), 'utf8'));
	}
	const mobileOutput = join(rootDir, 'packages/app-mobile/components/LucideIcon/lucideIcons.ts');
	await writeFile(mobileOutput, mobileIconsModule(iconNodes, version), 'utf8');
	console.info(`Wrote ${Object.keys(mobileIconMap).length} icons to ${mobileOutput}`);
};

main().catch(error => {
	console.error(error);
	process.exit(1);
});
