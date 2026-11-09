// Fork: the Workbench layout for wide windows, such as tablets in landscape and desktop browsers. From
// twoPaneMinWidth, the note list and the open note are shown side by side (app-nav.tsx). From dockedMenuMinWidth,
// the notebook drawer also stays open on the left (root.tsx).

import isWorkbenchTheme from '@joplin/lib/themes/utils/isWorkbenchTheme';

export const twoPaneMinWidth = 760;
export const dockedMenuMinWidth = 1100;
export const dockedMenuWidth = 280;
export const listPaneWidth = 360;

export const isTwoPaneLayout = (themeId: number, windowWidth: number) => {
	return isWorkbenchTheme(themeId) && windowWidth >= twoPaneMinWidth;
};

export const isDockedMenuLayout = (themeId: number, windowWidth: number) => {
	return isWorkbenchTheme(themeId) && windowWidth >= dockedMenuMinWidth;
};
