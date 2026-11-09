// Fork: the bottom navigation of the Workbench layout: Home, the notebook being browsed, tags and settings.

import * as React from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { _ } from '@joplin/lib/locale';
import { themeStyle } from '../../global-style';
import { AppState } from '../../../utils/types';
import Icon from '../../Icon';
import withAlpha from './withAlpha';

interface Props {
	themeId: number;
	routeName: string;
	activeFolderId: string;
	notesParentType: string;
	dispatch: Dispatch;
}

export const tabBarRoutes = ['Home', 'Notes', 'Tags'];

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return {
			activeColor: theme.color4,
			inactiveColor: theme.color3,
			...StyleSheet.create({
				bar: {
					flexDirection: 'row',
					paddingTop: 6,
					paddingBottom: 8,
					paddingHorizontal: 8,
					borderTopWidth: 1,
					borderTopColor: withAlpha(theme.color, 0.1),
					backgroundColor: theme.backgroundColor,
				},
				tab: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
				pill: { paddingVertical: 4, paddingHorizontal: 18, borderRadius: 999 },
				pillActive: { backgroundColor: withAlpha(theme.color4, 0.12) },
				icon: { fontSize: 22 },
				label: { fontSize: 11 },
				labelActive: { fontWeight: '600' },
			}),
		};
	}, [themeId]);
};

const WorkbenchTabBar: React.FC<Props> = props => {
	const styles = useStyles(props.themeId);

	const tabs = [
		{ routeName: 'Home', icon: 'ionicon home-outline', label: _('Home'), action: { type: 'NAV_GO', routeName: 'Home' } },
		{
			routeName: 'Notes',
			icon: 'ionicon journal-outline',
			label: _('Notebooks'),
			// Opens the notebook that was open last, unless the note list already shows one.
			action: props.notesParentType === 'Folder' || !props.activeFolderId ? { type: 'NAV_GO', routeName: 'Notes' } : { type: 'NAV_GO', routeName: 'Notes', folderId: props.activeFolderId },
		},
		{ routeName: 'Tags', icon: 'ionicon pricetags-outline', label: _('Tags'), action: { type: 'NAV_GO', routeName: 'Tags' } },
		{ routeName: 'Config', icon: 'ionicon settings-outline', label: _('Settings'), action: { type: 'NAV_GO', routeName: 'Config' } },
	];

	return <View style={styles.bar} accessibilityRole='tablist'>
		{tabs.map(tab => {
			const active = tab.routeName === props.routeName;
			const color = active ? styles.activeColor : styles.inactiveColor;
			return <Pressable
				key={tab.routeName}
				accessibilityRole='tab'
				accessibilityState={{ selected: active }}
				accessibilityLabel={tab.label}
				style={styles.tab}
				onPress={() => { if (!active) props.dispatch(tab.action); }}
			>
				<View style={[styles.pill, active ? styles.pillActive : null]}>
					<Icon name={tab.icon} accessibilityLabel={null} style={[styles.icon, { color }]}/>
				</View>
				<Text style={[styles.label, active ? styles.labelActive : null, { color }]}>{tab.label}</Text>
			</Pressable>;
		})}
	</View>;
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
	routeName: state.route.routeName,
	activeFolderId: state.settings.activeFolderId,
	notesParentType: state.notesParentType,
}))(WorkbenchTabBar);
