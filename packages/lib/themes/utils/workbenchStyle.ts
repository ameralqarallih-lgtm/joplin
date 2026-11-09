// Fork: what the Workbench themes add to a theme. Inter is bundled with the desktop app
// (app-desktop/gui/Workbench/fonts). Where it isn't loaded, the stack falls back to the system UI font.

import { Theme } from '../type';

const uiFontFamily = '\'Inter Variable\', Inter, system-ui, -apple-system, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif';

export type WorkbenchTheme = Theme & {
	// Becomes the --joplin-ui-style CSS variable, which switches on the desktop Workbench layer.
	uiStyle: string;
	// Replaces the global UI font for this theme.
	fontFamily: string;
	// Default font of the note viewer and editor, when the user hasn't chosen one.
	noteFontFamily: string;
	// Space after a paragraph in the note viewer and Rich Text editor. Notes written in the Rich Text editor have a
	// paragraph per line, which Joplin's 1.35em spreads out.
	noteParagraphSpacing: string;
};

export const workbenchStyle = {
	uiStyle: 'workbench',
	fontFamily: uiFontFamily,
	noteFontFamily: uiFontFamily,
	noteParagraphSpacing: '0.75em',
};
