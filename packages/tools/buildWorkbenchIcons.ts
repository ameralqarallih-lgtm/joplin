// Fork: generates the Workbench icon set. Each Font Awesome or Joplin icon class that the desktop app
// uses is mapped to a Lucide icon (https://lucide.dev, ISC licence), which the Workbench layer shows
// instead of the original glyph. Classes not listed here keep their original icon.
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
	'icon-selector-row': 'rows-3',
	'icon-share': 'share-2',
	'icon-sync': 'refresh-cw',
	'icon-tags': 'tags',
	'icon-to-do-list': 'list-checks',

	// Font Awesome
	'fa-adjust': 'contrast',
	'fa-align-justify': 'align-justify',
	'fa-angle-down': 'chevron-down',
	'fa-angle-right': 'chevron-right',
	'fa-arrow-down': 'arrow-down',
	'fa-arrow-left': 'arrow-left',
	'fa-arrow-right': 'arrow-right',
	'fa-arrow-up': 'arrow-up',
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

// A mask only needs the shape, so drop the licence comment, and the class and size of the root element.
// The size attributes of shapes inside it, such as <rect>, are part of the drawing.
const svgToDataUri = (svg: string) => {
	const compact = svg
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<svg[^>]*>/, rootTag => rootTag.replace(/\s+(class|width|height)="[^"]*"/g, ''))
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
};

main().catch(error => {
	console.error(error);
	process.exit(1);
});
