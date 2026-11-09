import { ThemeAppearance } from './type';
import { WorkbenchTheme, workbenchStyle } from './utils/workbenchStyle';

// Fork theme: the dark counterpart of workbenchLight.ts.
const theme: WorkbenchTheme = {
	...workbenchStyle,
	appearance: ThemeAppearance.Dark,

	backgroundColor: '#161c24',
	backgroundColorTransparent: 'rgba(22,28,36,0.9)',
	oddBackgroundColor: '#1b222c',
	color: '#dde3ea',
	colorError: '#f2868e',
	colorCorrect: '#76cf9f',
	colorWarn: '#c77a12',
	colorWarnUrl: '#ffd27a',
	colorFaded: '#95a1b1',
	dividerColor: '#2a333f',
	selectedColor: '#24324f',
	urlColor: '#82a4f7',
	colorErrorSelected: '#ffc9cd',
	shadowColor: 'rgba(0,0,0,0.45)',

	backgroundColor2: '#11161d',
	color2: '#dde3ea',
	selectedColor2: '#26365a',
	colorError2: '#f2868e',
	colorPublished2: '#82a4f7',
	colorWarn2: '#f0b566',
	colorWarn3: '#f0b566',
	backgroundColorTransparent2: 'rgba(0,0,0,0.5)',
	highlightedColor: '#82a4f7',

	backgroundColor3: '#1f2833',
	backgroundColorHover3: '#26365a',
	color3: '#a8b4c3',

	backgroundColor4: '#161c24',
	color4: '#82a4f7',
	backgroundColor4Dimmed: '#1e2a44',

	raisedBackgroundColor: '#1f2731',
	raisedColor: '#dde3ea',
	searchMarkerBackgroundColor: '#e8b931',
	searchMarkerColor: '#11161d',

	warningBackgroundColor: '#4a3712',
	destructiveColor: '#f2868e',

	tableBackgroundColor: '#1b222c',
	codeBackgroundColor: '#1b222c',
	codeBorderColor: '#2a333f',
	codeColor: '#dde3ea',

	blockQuoteOpacity: 0.75,

	codeMirrorTheme: 'material-darker',
	codeThemeCss: 'atom-one-dark-reasonable.css',

	headerBackgroundColor: '#161c24',
	textSelectionColor: '#82a4f7',
	colorBright2: '#ffffff',
};

export default theme;
