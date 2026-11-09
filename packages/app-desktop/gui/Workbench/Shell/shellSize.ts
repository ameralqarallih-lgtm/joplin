// Fork: the room the Workbench shell (WorkbenchShell.tsx) takes around the main layout, which MainScreen takes
// off the layout's size. Keep in sync with workbench-shell.scss.

import isWorkbenchTheme from '@joplin/lib/themes/utils/isWorkbenchTheme';

export const topBarHeight = 48;
export const statusBarHeight = 26;
export const railWidth = 56;

const shellSize = (themeId: number) => {
	if (!isWorkbenchTheme(themeId)) return { top: 0, bottom: 0, left: 0 };
	return { top: topBarHeight, bottom: statusBarHeight, left: railWidth };
};

export default shellSize;
