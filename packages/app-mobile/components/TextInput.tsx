import * as React from 'react';
import { Ref, useMemo } from 'react';
import { themeStyle } from './global-style';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import useIsWorkbenchTheme from './LucideIcon/useIsWorkbenchTheme';
import withAlpha from './screens/Home/withAlpha';

interface Props extends TextInputProps {
	ref?: Ref<TextInput>;
	themeId: number;
}

export default (props: Props) => {
	const theme = themeStyle(props.themeId);
	const finalProps: Props = { ...props };

	if (!('placeholderTextColor' in finalProps)) finalProps.placeholderTextColor = theme.colorFaded;
	if (!('underlineColorAndroid' in finalProps)) finalProps.underlineColorAndroid = theme.dividerColor;
	if (!('selectionColor' in finalProps)) finalProps.selectionColor = theme.textSelectionColor;
	if (!('keyboardAppearance' in finalProps)) finalProps.keyboardAppearance = theme.keyboardAppearance;
	if (!('style' in finalProps)) finalProps.style = {};
	// Fork: Workbench themes draw text fields outlined, with rounded corners, instead of underlined.
	const workbench = useIsWorkbenchTheme();
	if (workbench && !('underlineColorAndroid' in props)) finalProps.underlineColorAndroid = 'transparent';

	const defaultStyle = useMemo(() => {
		const theme = themeStyle(finalProps.themeId);

		return StyleSheet.create({
			textInput: {
				color: theme.color,
				paddingLeft: 14,
				paddingRight: 14,
				paddingTop: 12,
				paddingBottom: 12,
				...(workbench ? {
					borderWidth: 1,
					borderColor: withAlpha(theme.color, 0.16),
					borderRadius: 10,
					backgroundColor: theme.backgroundColor,
					paddingTop: 11,
					paddingBottom: 11,
				} : {}),
			},
		});
	}, [finalProps.themeId, workbench]);

	finalProps.style = [defaultStyle.textInput, finalProps.style];

	return <TextInput {...finalProps} />;
};
