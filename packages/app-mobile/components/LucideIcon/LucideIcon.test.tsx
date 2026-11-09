import * as React from 'react';
import Svg from 'react-native-svg';
import { render, screen } from '../../utils/testing/testingLibrary';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import TestProviderStack from '../testing/TestProviderStack';
import Setting from '@joplin/lib/models/Setting';
import Icon from '../Icon';

const renderIcon = (themeId: number) => {
	const store = createMockReduxStore();
	store.dispatch({ type: 'SETTING_UPDATE_ONE', key: 'theme', value: themeId });
	render(<TestProviderStack store={store}><Icon name='ionicon search' style={{ fontSize: 20, color: 'red' }} accessibilityLabel='Search'/></TestProviderStack>);
};

describe('LucideIcon', () => {
	test.each([
		[Setting.THEME_WORKBENCH_LIGHT, 1],
		[Setting.THEME_LIGHT, 0],
	])('with theme %d, mapped icons should be drawn as Lucide icons (%d)', (themeId, expectedSvgCount) => {
		renderIcon(themeId);
		const svgs = screen.UNSAFE_queryAllByType(Svg);
		expect(svgs.length).toBe(expectedSvgCount);
		if (expectedSvgCount) {
			expect(svgs[0].props).toMatchObject({ width: 20, stroke: 'red', accessibilityLabel: 'Search' });
		}
	});
});
