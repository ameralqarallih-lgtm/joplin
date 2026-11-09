// Fork: the Workbench filter chips above the note list (all notes, open to-dos, pinned notes) and the note count.

import * as React from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { _, _n } from '@joplin/lib/locale';
import { NoteListFilter } from '@joplin/lib/services/noteList/noteListFilter';
import { themeStyle } from '../../global-style';
import withAlpha from '../Home/withAlpha';

interface Props {
	themeId: number;
	filter: NoteListFilter;
	noteCount: number;
	onChange: (filter: NoteListFilter)=> void;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 10 },
			chip: { height: 32, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: withAlpha(theme.color, 0.14) },
			chipSelected: { borderColor: theme.color, backgroundColor: theme.color },
			chipText: { fontSize: 13, color: theme.color3 },
			chipTextSelected: { color: theme.backgroundColor, fontWeight: '500' },
			count: { marginLeft: 'auto', fontSize: 13, color: theme.colorFaded },
		});
	}, [themeId]);
};

const NoteListFilterBar: React.FC<Props> = props => {
	const styles = useStyles(props.themeId);
	const filters = [
		{ value: NoteListFilter.All, label: _('All') },
		{ value: NoteListFilter.Todos, label: _('To-dos') },
		{ value: NoteListFilter.Pinned, label: _('Pinned') },
	];

	return <View style={styles.bar} accessibilityRole='radiogroup' accessibilityLabel={_('Show')}>
		{filters.map(filter => {
			const selected = filter.value === props.filter;
			return <Pressable
				key={filter.value}
				accessibilityRole='radio'
				accessibilityState={{ checked: selected }}
				style={[styles.chip, selected ? styles.chipSelected : null]}
				onPress={() => props.onChange(filter.value)}
			>
				<Text style={[styles.chipText, selected ? styles.chipTextSelected : null]}>{filter.label}</Text>
			</Pressable>;
		})}
		<Text style={styles.count}>{_n('%d note', '%d notes', props.noteCount, props.noteCount)}</Text>
	</View>;
};

export default NoteListFilterBar;
