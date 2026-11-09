// Fork: a bar under the notebook title with a chip that goes up to the parent notebook, then one chip
// per sub-notebook, so that nested notebooks can be browsed without opening the side menu.

import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import Folder from '@joplin/lib/models/Folder';
import { FolderEntity } from '@joplin/lib/services/database/types';
import { _ } from '@joplin/lib/locale';
import { themeStyle } from '../../global-style';
import { AppState } from '../../../utils/types';
import Icon from '../../Icon';

interface Props {
	themeId: number;
	folderId: string;
	folders: FolderEntity[];
	dispatch: Dispatch;
}

type FolderWithCount = FolderEntity & { note_count?: number };

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		const chip = {
			flexDirection: 'row' as const,
			alignItems: 'center' as const,
			gap: 6,
			paddingVertical: 6,
			paddingHorizontal: 10,
			borderWidth: 1,
			borderColor: theme.dividerColor,
			borderRadius: 6,
			backgroundColor: theme.backgroundColor,
		};
		return StyleSheet.create({
			bar: {
				flexGrow: 0,
				borderBottomWidth: 1,
				borderBottomColor: theme.dividerColor,
				backgroundColor: theme.oddBackgroundColor,
			},
			content: {
				gap: 8,
				paddingVertical: 8,
				paddingHorizontal: theme.marginLeft,
			},
			chip,
			label: {
				color: theme.color,
				fontSize: theme.fontSize * 0.9,
			},
			parentLabel: {
				color: theme.urlColor,
				fontSize: theme.fontSize * 0.9,
			},
			count: {
				color: theme.colorFaded,
				fontSize: theme.fontSize * 0.8,
			},
			icon: {
				color: theme.colorFaded,
				fontSize: theme.fontSize,
			},
			parentIcon: {
				color: theme.urlColor,
				fontSize: theme.fontSize,
			},
		});
	}, [themeId]);
};

const FolderNavigationBar: React.FC<Props> = ({ themeId, folderId, folders, dispatch }) => {
	const styles = useStyles(themeId);
	const folder = folders.find(f => f.id === folderId);
	const parent = folder?.parent_id ? folders.find(f => f.id === folder.parent_id) : null;
	const children: FolderWithCount[] = useMemo(() => {
		return folders.filter(f => f.parent_id === folderId && !f.deleted_time);
	}, [folders, folderId]);

	const openFolder = useCallback((id: string) => {
		dispatch({ type: 'NAV_GO', routeName: 'Notes', folderId: id });
	}, [dispatch]);

	if (!folder || folder.deleted_time || (!parent && !children.length)) return null;

	return (
		<ScrollView horizontal style={styles.bar} contentContainerStyle={styles.content} showsHorizontalScrollIndicator={false}>
			{parent ? (
				<TouchableOpacity
					style={styles.chip}
					onPress={() => openFolder(parent.id)}
					accessibilityRole='button'
					accessibilityLabel={_('Go to parent notebook: %s', Folder.displayTitle(parent))}
				>
					<Icon name='ionicon arrow-up' style={styles.parentIcon} accessibilityLabel={null}/>
					<Text style={styles.parentLabel}>{Folder.displayTitle(parent)}</Text>
				</TouchableOpacity>
			) : null}
			{children.map(child => (
				<TouchableOpacity
					key={child.id}
					style={styles.chip}
					onPress={() => openFolder(child.id)}
					accessibilityRole='button'
				>
					<Icon name='ionicon folder-outline' style={styles.icon} accessibilityLabel={null}/>
					<Text style={styles.label}>{Folder.displayTitle(child)}</Text>
					{child.note_count ? <Text style={styles.count}>{child.note_count}</Text> : null}
				</TouchableOpacity>
			))}
		</ScrollView>
	);
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
	folders: state.folders,
}))(FolderNavigationBar);
