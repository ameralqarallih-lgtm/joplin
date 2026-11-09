// Fork: the Workbench Home screen: the recently changed notes, open to-dos, pinned notes and top-level notebooks.

import * as React from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { _, _n, currentLocale } from '@joplin/lib/locale';
import loadHomeData, { HomeData } from '@joplin/lib/models/utils/loadHomeData';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import eventManager, { EventName } from '@joplin/lib/eventManager';
import Note from '@joplin/lib/models/Note';
import Folder from '@joplin/lib/models/Folder';
import formatListDate from '@joplin/lib/services/noteList/formatListDate';
import formatTodoDue, { TodoDueTone } from '@joplin/lib/services/home/formatTodoDue';
import formatSyncStatus, { SyncStatusIcon, SyncStatusTone } from '@joplin/lib/services/home/formatSyncStatus';
import { ProgressReport } from '@joplin/lib/Synchronizer';
import CommandService from '@joplin/lib/services/CommandService';
import { FolderEntity, NoteEntity } from '@joplin/lib/services/database/types';
import { Theme, ThemeAppearance } from '@joplin/lib/themes/type';
import { themeStyle } from '../../global-style';
import { AppState } from '../../../utils/types';
import Icon from '../../Icon';
import Checkbox from '../../Checkbox';
import NewNoteButton from '../Notes/NewNoteButton';
import { DialogContext } from '../../DialogManager';
import setTodoCompleted from './setTodoCompleted';
import withAlpha from './withAlpha';

interface Props {
	themeId: number;
	folders: FolderEntity[];
	pinnedNotes: NoteEntity[];
	includeCompletedTodos: boolean;
	syncTargetSet: boolean;
	syncStarted: boolean;
	syncPending: boolean;
	syncReport: ProgressReport;
	dispatch: Dispatch;
}

const reloadDelay = 400;

const useHomeData = (includeCompletedTodos: boolean) => {
	const [data, setData] = useState<HomeData|null>(null);
	const [changeCount, setChangeCount] = useState(0);

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout> = null;
		const onItemChange = () => {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => setChangeCount(count => count + 1), reloadDelay);
		};
		eventManager.on(EventName.ItemChange, onItemChange);
		return () => {
			eventManager.off(EventName.ItemChange, onItemChange);
			if (timeout) clearTimeout(timeout);
		};
	}, []);

	useAsyncEffect(async (event) => {
		const result = await loadHomeData({ recentCount: 5, includeCompletedTodosInCounts: includeCompletedTodos });
		if (!event.cancelled) setData(result);
	}, [changeCount, includeCompletedTodos]);

	return data;
};

const useStyles = (theme: Theme) => {
	return useMemo(() => {
		const ring = withAlpha(theme.color, 0.1);
		const card = {
			borderRadius: 16,
			borderWidth: 1,
			borderColor: ring,
			backgroundColor: theme.backgroundColor,
		};
		const accents = [theme.color4, theme.colorCorrect, theme.colorWarn];
		return {
			accents,
			...StyleSheet.create({
				root: { flex: 1, backgroundColor: theme.appearance === ThemeAppearance.Light ? theme.oddBackgroundColor : theme.backgroundColor2 },
				content: { gap: 20, paddingTop: 18, paddingBottom: 96 },
				header: { gap: 12, paddingHorizontal: 16 },
				headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
				date: { fontSize: 13, color: theme.colorFaded },
				title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5, color: theme.color },
				search: { ...card, flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 14, borderRadius: 14 },
				searchText: { fontSize: 15, color: theme.colorFaded },
				searchIcon: { fontSize: 18, color: theme.colorFaded },
				syncChip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 999 },
				syncText: { fontSize: 12, fontWeight: '500' },
				section: { gap: 10 },
				sectionTitle: { fontSize: 16, fontWeight: '600', color: theme.color, paddingHorizontal: 16 },
				// The bottom padding keeps the cards' shadows and the vertical scroll apart from the row.
				recentRow: { gap: 12, paddingHorizontal: 16, paddingBottom: 14 },
				recentCard: { ...card, width: 210, gap: 6, padding: 14 },
				recentMeta: { fontSize: 12, color: theme.colorFaded },
				recentTitle: { fontSize: 15, fontWeight: '600', color: theme.color },
				recentExcerpt: { fontSize: 13, lineHeight: 19, color: theme.color3 },
				panel: { ...card, marginHorizontal: 16, overflow: 'hidden' },
				row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 14 },
				rowDivider: { borderTopWidth: 1, borderTopColor: ring },
				rowTitle: { flex: 1, fontSize: 15, color: theme.color },
				rowTitleDone: { color: theme.colorFaded, textDecorationLine: 'line-through' },
				rowMeta: { fontSize: 12, color: theme.colorFaded },
				dueToday: { fontSize: 12, overflow: 'hidden', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999, color: theme.colorWarn, backgroundColor: withAlpha(theme.colorWarn, 0.14) },
				dueOverdue: { fontSize: 12, color: theme.colorError },
				rowIcon: { fontSize: 18, color: theme.colorFaded },
				checkbox: { color: theme.color },
				empty: { fontSize: 14, color: theme.colorFaded, padding: 14 },
				grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16 },
				tile: { ...card, flexBasis: '47%', flexGrow: 1, gap: 10, padding: 14 },
				tileNew: { borderStyle: 'dashed', borderColor: withAlpha(theme.color, 0.3), backgroundColor: 'transparent' },
				tileIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
				tileIconText: { fontSize: 18 },
				tileName: { fontSize: 15, fontWeight: '600', color: theme.color },
				tileCount: { fontSize: 12, color: theme.colorFaded },
			}),
		};
	}, [theme]);
};

type Styles = ReturnType<typeof useStyles>;

const openNote = (dispatch: Dispatch, noteId: string) => {
	dispatch({ type: 'NAV_GO', routeName: 'Note', noteId });
};

const syncIcons: Record<SyncStatusIcon, string> = {
	[SyncStatusIcon.Off]: 'ionicon cloud-offline-outline',
	[SyncStatusIcon.Sync]: 'ionicon sync',
	[SyncStatusIcon.Synced]: 'ionicon cloud-done-outline',
	[SyncStatusIcon.Error]: 'ionicon alert-circle-outline',
};

const SyncChip: React.FC<Props & { styles: Styles; theme: Theme }> = props => {
	const status = formatSyncStatus({ ...props, now: Date.now() });
	const toneColors: Record<SyncStatusTone, string> = {
		[SyncStatusTone.Neutral]: props.theme.colorFaded,
		[SyncStatusTone.Synced]: props.theme.colorCorrect,
		[SyncStatusTone.Busy]: props.theme.color4,
		[SyncStatusTone.Error]: props.theme.colorError,
	};
	const color = toneColors[status.tone];

	const onPress = () => {
		if (props.syncTargetSet) {
			void CommandService.instance().execute('synchronize');
		} else {
			props.dispatch({ type: 'NAV_GO', routeName: 'Config', sectionName: 'sync' });
		}
	};

	return <Pressable
		onPress={onPress}
		accessibilityRole='button'
		style={[props.styles.syncChip, { backgroundColor: withAlpha(color, 0.12) }]}
	>
		<Icon name={syncIcons[status.icon]} accessibilityLabel={null} style={{ fontSize: 15, color }}/>
		<Text style={[props.styles.syncText, { color }]}>{status.label}</Text>
	</Pressable>;
};

const TodoRows: React.FC<{ todos: NoteEntity[]; styles: Styles; dispatch: Dispatch }> = ({ todos, styles, dispatch }) => {
	const dialogs = useContext(DialogContext);
	const [checkedOverrides, setCheckedOverrides] = useState<Record<string, boolean>>({});
	useEffect(() => setCheckedOverrides({}), [todos]);

	const onChange = async (noteId: string, checked: boolean) => {
		setCheckedOverrides(overrides => ({ ...overrides, [noteId]: checked }));
		if (!await setTodoCompleted(noteId, checked, dialogs)) {
			setCheckedOverrides(overrides => ({ ...overrides, [noteId]: !checked }));
		}
	};

	if (!todos.length) return <Text style={styles.empty}>{_('No open to-dos.')}</Text>;

	const now = Date.now();
	return <>{todos.map((note, index) => {
		const completed = checkedOverrides[note.id] ?? !!note.todo_completed;
		const due = formatTodoDue(note.todo_due, now);
		let meta = null;
		if (completed) {
			meta = <Text style={styles.rowMeta}>{_('Done')}</Text>;
		} else if (due) {
			const dueStyle = due.tone === TodoDueTone.Today ? styles.dueToday : due.tone === TodoDueTone.Overdue ? styles.dueOverdue : styles.rowMeta;
			meta = <Text style={dueStyle}>{due.label}</Text>;
		}
		return <View key={note.id} style={[styles.row, index ? styles.rowDivider : null]}>
			<Checkbox style={styles.checkbox} checked={completed} accessibilityLabel={Note.displayTitle(note)} onChange={checked => void onChange(note.id, checked)}/>
			<Text style={[styles.rowTitle, completed ? styles.rowTitleDone : null]} numberOfLines={1} onPress={() => openNote(dispatch, note.id)}>
				{Note.displayTitle(note)}
			</Text>
			{meta}
		</View>;
	})}</>;
};

const PinnedRows: React.FC<{ notes: NoteEntity[]; folders: FolderEntity[]; styles: Styles; dispatch: Dispatch }> = ({ notes, folders, styles, dispatch }) => {
	if (!notes.length) return <Text style={styles.empty}>{_('Pin a note from its menu to keep it here.')}</Text>;

	return <>{notes.map((note, index) => (
		<Pressable key={note.id} accessibilityRole='button' style={[styles.row, index ? styles.rowDivider : null]} onPress={() => openNote(dispatch, note.id)}>
			<Icon name='ionicon pin-outline' accessibilityLabel={null} style={styles.rowIcon}/>
			<Text style={styles.rowTitle} numberOfLines={1}>{Note.displayTitle(note)}</Text>
			<Text style={styles.rowMeta} numberOfLines={1}>{folders.find(folder => folder.id === note.parent_id)?.title ?? ''}</Text>
		</Pressable>
	))}</>;
};

const HomeScreen: React.FC<Props> = props => {
	const theme = themeStyle(props.themeId);
	const styles = useStyles(theme);
	const data = useHomeData(props.includeCompletedTodos);
	const today = new Date().toLocaleDateString(currentLocale().replace('_', '-'), { weekday: 'long', day: 'numeric', month: 'long' });

	const folderTitle = (folderId: string) => props.folders.find(folder => folder.id === folderId)?.title ?? '';

	const recentCards = data?.recent.map(({ note, excerpt }) => (
		<Pressable key={note.id} accessibilityRole='button' style={styles.recentCard} onPress={() => openNote(props.dispatch, note.id)}>
			<Text style={styles.recentMeta} numberOfLines={1}>{`${folderTitle(note.parent_id)} · ${formatListDate(note.user_updated_time)}`}</Text>
			<Text style={styles.recentTitle} numberOfLines={1}>{Note.displayTitle(note)}</Text>
			{excerpt ? <Text style={styles.recentExcerpt} numberOfLines={2}>{excerpt}</Text> : null}
		</Pressable>
	));

	const folderTiles = data?.folders.map(({ folder, noteCount }, index) => {
		const accent = styles.accents[index % styles.accents.length];
		return <Pressable
			key={folder.id}
			accessibilityRole='button'
			style={styles.tile}
			onPress={() => props.dispatch({ type: 'NAV_GO', routeName: 'Notes', folderId: folder.id })}
		>
			<View style={[styles.tileIcon, { backgroundColor: withAlpha(accent, 0.13) }]}>
				<Icon name='ionicon book-outline' accessibilityLabel={null} style={[styles.tileIconText, { color: accent }]}/>
			</View>
			<View>
				<Text style={styles.tileName} numberOfLines={1}>{folder.title}</Text>
				<Text style={styles.tileCount}>{_n('%d note', '%d notes', noteCount, noteCount)}</Text>
			</View>
		</Pressable>;
	});

	return <View style={styles.root}>
		<ScrollView contentContainerStyle={styles.content}>
			<View style={styles.header}>
				<View style={styles.headerRow}>
					<View>
						<Text style={styles.date}>{today}</Text>
						<Text style={styles.title} accessibilityRole='header'>{_('Home')}</Text>
					</View>
					<SyncChip {...props} styles={styles} theme={theme}/>
				</View>
				<Pressable accessibilityRole='search' style={styles.search} onPress={() => props.dispatch({ type: 'NAV_GO', routeName: 'Search' })}>
					<Icon name='ionicon search' accessibilityLabel={null} style={styles.searchIcon}/>
					<Text style={styles.searchText}>{_('Search notes')}</Text>
				</Pressable>
			</View>
			{data ? <>
				{recentCards.length ? <View style={styles.section}>
					<Text style={styles.sectionTitle} accessibilityRole='header'>{_('Continue')}</Text>
					<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>{recentCards}</ScrollView>
				</View> : null}
				<View style={styles.section}>
					<Text style={styles.sectionTitle} accessibilityRole='header'>{_('To-dos')}</Text>
					<View style={styles.panel}><TodoRows todos={data.todos} styles={styles} dispatch={props.dispatch}/></View>
				</View>
				<View style={styles.section}>
					<Text style={styles.sectionTitle} accessibilityRole='header'>{_('Pinned')}</Text>
					<View style={styles.panel}><PinnedRows notes={props.pinnedNotes} folders={props.folders} styles={styles} dispatch={props.dispatch}/></View>
				</View>
				<View style={styles.section}>
					<Text style={styles.sectionTitle} accessibilityRole='header'>{_('Notebooks')}</Text>
					<View style={styles.grid}>
						{folderTiles}
						<Pressable
							accessibilityRole='button'
							style={[styles.tile, styles.tileNew]}
							onPress={() => props.dispatch({ type: 'NAV_GO', routeName: 'Folder', folderId: null })}
						>
							<View style={[styles.tileIcon, { backgroundColor: withAlpha(theme.color, 0.06) }]}>
								<Icon name='fas fa-plus' accessibilityLabel={null} style={[styles.tileIconText, { color: theme.colorFaded }]}/>
							</View>
							<Text style={styles.tileName}>{_('New notebook')}</Text>
						</Pressable>
					</View>
				</View>
			</> : null}
		</ScrollView>
		{Folder.atLeastOneRealFolderExists(props.folders) ? <NewNoteButton/> : null}
	</View>;
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
	folders: state.folders,
	pinnedNotes: state.pinnedNotes,
	includeCompletedTodos: state.settings.showCompletedTodos,
	syncTargetSet: !!state.settings['sync.target'],
	syncStarted: state.syncStarted,
	syncPending: state.syncPending,
	syncReport: state.syncReport,
}))(HomeScreen);
