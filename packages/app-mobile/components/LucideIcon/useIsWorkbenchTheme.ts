// Fork: whether a Workbench theme is active. Works outside a Redux provider too, where it returns false.

import { useContext, useSyncExternalStore } from 'react';
import { ReactReduxContext } from 'react-redux';
import isWorkbenchTheme from '@joplin/lib/themes/utils/isWorkbenchTheme';

const noSubscription = () => () => {};

const useIsWorkbenchTheme = () => {
	const store = useContext(ReactReduxContext)?.store;
	const themeId: number = useSyncExternalStore(store?.subscribe ?? noSubscription, () => store?.getState()?.settings?.theme ?? 0);
	return isWorkbenchTheme(themeId);
};

export default useIsWorkbenchTheme;
