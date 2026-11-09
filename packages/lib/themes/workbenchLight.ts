import { Theme, ThemeAppearance } from './type';

// Fork theme: cool grey surfaces, a light sidebar and a cobalt accent. See FORK.md.
// uiStyle becomes the --joplin-ui-style CSS variable, which switches on the desktop Workbench layer (gui/Workbench/style.scss).
const theme: Theme & { uiStyle: string } = {
	uiStyle: 'workbench',
	appearance: ThemeAppearance.Light,

	backgroundColor: '#ffffff',
	backgroundColorTransparent: 'rgba(255,255,255,0.9)',
	oddBackgroundColor: '#f2f4f7',
	color: '#121821',
	colorError: '#c42b2b',
	colorCorrect: '#1b7a48',
	colorWarn: '#a94f00',
	colorWarnUrl: '#1d47c9',
	colorFaded: '#5f6b7c',
	dividerColor: '#d8dee6',
	selectedColor: '#e3eafc',
	urlColor: '#2b57e0',
	colorErrorSelected: '#a31d1d',
	shadowColor: 'rgba(18,24,33,0.12)',

	backgroundColor2: '#e8ecf1',
	color2: '#121821',
	selectedColor2: '#d0dbf8',
	colorError2: '#c42b2b',
	colorPublished2: '#2b57e0',
	colorWarn2: '#a94f00',
	colorWarn3: '#a94f00',
	backgroundColorTransparent2: 'rgba(18,24,33,0.35)',
	highlightedColor: '#2b57e0',

	backgroundColor3: '#f2f4f7',
	backgroundColorHover3: '#d9e2f7',
	color3: '#4a5668',

	backgroundColor4: '#ffffff',
	color4: '#2b57e0',
	backgroundColor4Dimmed: '#e3eafc',

	raisedBackgroundColor: '#e8ecf1',
	raisedColor: '#121821',
	searchMarkerBackgroundColor: '#ffd666',
	searchMarkerColor: '#121821',

	warningBackgroundColor: '#ffe2a8',
	destructiveColor: '#c42b2b',

	tableBackgroundColor: '#f6f8fa',
	codeBackgroundColor: '#f2f4f7',
	codeBorderColor: '#d8dee6',
	codeColor: '#121821',

	blockQuoteOpacity: 0.75,

	codeMirrorTheme: 'default',
	codeThemeCss: 'atom-one-light.css',

	headerBackgroundColor: '#f2f4f7',
	textSelectionColor: '#2b57e0',
	colorBright2: '#121821',
};

export default theme;
