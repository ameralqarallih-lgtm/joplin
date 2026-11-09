// Fork: whether a theme ID is one of the Workbench themes (see workbenchStyle.ts).

import { themeById } from '../../theme';

const isWorkbenchTheme = (themeId: number) => {
	try {
		return (themeById(themeId) as { uiStyle?: string }).uiStyle === 'workbench';
	} catch (error) {
		// Unknown theme ID
		return false;
	}
};

export default isWorkbenchTheme;
