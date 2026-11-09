// Fork: the Workbench Tags screen shows the tags as wrapped chips with their note counts, instead of a list.

import * as React from 'react';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { _ } from '@joplin/lib/locale';
import { TagEntity } from '@joplin/lib/services/database/types';
import { themeStyle } from '../global-style';
import useOnLongPressProps from '../../utils/hooks/useOnLongPressProps';
import withAlpha from './Home/withAlpha';

type TagWithCount = TagEntity & { note_count?: number };

interface ChipProps {
	tag: TagWithCount;
	styles: ReturnType<typeof useStyles>;
	onPress: (id: string)=> void;
	onLongPress: (tag: TagEntity)=> void;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			content: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: theme.marginLeft },
			chip: {
				flexDirection: 'row',
				alignItems: 'center',
				gap: 8,
				minHeight: 40,
				paddingHorizontal: 14,
				borderRadius: 20,
				borderWidth: 1,
				borderColor: withAlpha(theme.color, 0.14),
				backgroundColor: theme.backgroundColor,
			},
			pressed: { backgroundColor: withAlpha(theme.color4, 0.1) },
			name: { fontSize: 15, color: theme.color },
			count: { fontSize: 12, color: theme.colorFaded },
		});
	}, [themeId]);
};

const TagChip: React.FC<ChipProps> = ({ tag, styles, onPress, onLongPress }) => {
	const longPressProps = useOnLongPressProps({ onLongPress: () => onLongPress(tag), actionDescription: _('Edit tag') });
	return <Pressable
		accessibilityRole='button'
		accessibilityHint={_('Shows notes for tag')}
		{...longPressProps}
		onPress={() => onPress(tag.id)}
		style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
	>
		<Text style={styles.name}>{`#${tag.title}`}</Text>
		{tag.note_count ? <Text style={styles.count}>{tag.note_count}</Text> : null}
	</Pressable>;
};

interface Props {
	tags: TagEntity[];
	themeId: number;
	onPress: (id: string)=> void;
	onLongPress: (tag: TagEntity)=> void;
}

const TagChips: React.FC<Props> = ({ tags, themeId, onPress, onLongPress }) => {
	const styles = useStyles(themeId);
	return <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
		{tags.map(tag => <TagChip key={tag.id} tag={tag} styles={styles} onPress={onPress} onLongPress={onLongPress}/>)}
	</ScrollView>;
};

export default TagChips;
