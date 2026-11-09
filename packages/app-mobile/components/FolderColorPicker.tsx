// Fork: chooses a notebook colour on mobile: none, a preset, or the notebook's custom colour (chosen on desktop).

import * as React from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { _ } from '@joplin/lib/locale';
import { folderColorPresets } from '@joplin/lib/models/utils/folderColor';
import { themeStyle } from './global-style';

interface Props {
	themeId: number;
	value: string;
	onChange: (value: string)=> void;
}

const FolderColorPicker: React.FC<Props> = ({ themeId, value, onChange }) => {
	const styles = useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			label: { ...theme.normalText, color: theme.colorFaded, paddingHorizontal: theme.marginLeft, paddingTop: 16 },
			swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: theme.marginLeft - 4, paddingVertical: 8 },
			swatch: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
			selected: { borderColor: theme.color },
			color: { width: 30, height: 30, borderRadius: 15 },
			none: { borderWidth: 1.5, borderColor: theme.colorFaded },
		});
	}, [themeId]);

	const options = [
		{ value: '', label: _('No colour') },
		...folderColorPresets.map(preset => ({ value: preset.value, label: preset.label() })),
	];
	if (value && !options.some(option => option.value === value)) options.push({ value, label: _('Custom colour') });

	return <View>
		<Text style={styles.label}>{_('Colour')}</Text>
		<View style={styles.swatches} accessibilityRole='radiogroup'>
			{options.map(option => <Pressable
				key={option.value || 'none'}
				accessibilityRole='radio'
				accessibilityLabel={option.label}
				accessibilityState={{ checked: option.value === value }}
				onPress={() => onChange(option.value)}
				style={[styles.swatch, option.value === value && styles.selected]}
			>
				<View style={[styles.color, option.value ? { backgroundColor: option.value } : styles.none]}/>
			</Pressable>)}
		</View>
	</View>;
};

export default FolderColorPicker;
