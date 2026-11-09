import * as React from 'react';

import { Component } from 'react';

import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { FlatList, Text, StyleSheet, Button, View } from 'react-native';
import { FolderEntity, NoteEntity } from '@joplin/lib/services/database/types';
import { AppState } from '../utils/types';
import getEmptyFolderMessage from '@joplin/lib/components/shared/NoteList/getEmptyFolderMessage';
import Folder from '@joplin/lib/models/Folder';

import { _ } from '@joplin/lib/locale';
import NoteItem from './NoteItem';
import { reg } from '@joplin/lib/registry';
import { themeStyle } from './global-style';
import filterNoteList, { NoteListFilter } from '@joplin/lib/services/noteList/noteListFilter';

interface OwnProps {
	// Fork: see screens/Notes/NoteListFilterBar.tsx
	filter?: NoteListFilter;
}

interface NoteListProps extends OwnProps {
	themeId: number;
	unfilteredCount: number;
	dispatch: Dispatch;
	notesSource: string;
	items: NoteEntity[];
	folders: FolderEntity[];
	noteSelectionEnabled?: boolean;
	selectedFolderId: string|null;
	syncStarted?: boolean;
	syncTarget?: number;
}

const onPullToRefresh = () => {
	void reg.scheduleSync(0);
};

class NoteListComponent extends Component<NoteListProps> {
	private rootRef_: FlatList;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- StyleSheet.NamedStyles<T> requires T to be the style record being passed; `any` matches the existing pattern in other mobile components
	private styles_: Record<string, StyleSheet.NamedStyles<any>>;

	public constructor(props: NoteListProps) {
		super(props);

		this.state = {
			items: [],
			selectedItemIds: [],
		};
		this.rootRef_ = null;
		this.styles_ = {};

		this.createNotebookButton_click = this.createNotebookButton_click.bind(this);
	}

	private styles() {
		const themeId = this.props.themeId;
		const theme = themeStyle(themeId);

		if (this.styles_[themeId]) return this.styles_[themeId];
		this.styles_ = {};

		const styles = {
			noItemMessage: {
				paddingLeft: theme.marginLeft,
				paddingRight: theme.marginRight,
				paddingTop: theme.marginTop,
				paddingBottom: theme.marginBottom,
				fontSize: theme.fontSize,
				color: theme.color,
				textAlign: 'center',
			},
			noNotebookView: {

			},
		};

		this.styles_[themeId] = StyleSheet.create(styles);
		return this.styles_[themeId];
	}

	private createNotebookButton_click() {
		this.props.dispatch({
			type: 'NAV_GO',
			routeName: 'Folder',
			folderId: null,
		});
	}

	public UNSAFE_componentWillReceiveProps(newProps: NoteListProps) {
		// Make sure scroll position is reset when switching from one folder to another or to a tag list.
		if (this.rootRef_ && newProps.notesSource !== this.props.notesSource) {
			this.rootRef_.scrollToOffset({ offset: 0, animated: false });
		}
	}

	public render() {
		// `enableEmptySections` is to fix this warning: https://github.com/FaridSafi/react-native-gifted-listview/issues/39

		if (this.props.items.length) {
			return <FlatList
				ref={ref => { this.rootRef_ = ref; }}
				data={this.props.items}
				renderItem={({ item, index }) => <NoteItem note={item} index={index} />}
				keyExtractor={item => item.id}
				// Fork: pull down to synchronise, when synchronisation is set up.
				refreshing={!!this.props.syncStarted}
				onRefresh={this.props.syncTarget ? onPullToRefresh : undefined}
			/>;
		} else {
			if (!Folder.atLeastOneRealFolderExists(this.props.folders)) {
				const noItemMessage = _('You currently have no notebooks.');
				return (
					<View style={this.styles().noNotebookView}>
						<Text style={this.styles().noItemMessage}>{noItemMessage}</Text>
						<Button title={_('Create a notebook')} onPress={this.createNotebookButton_click} />
					</View>
				);
			} else {
				const filteredOut = this.props.filter && this.props.filter !== NoteListFilter.All && this.props.unfilteredCount > 0;
				return <Text style={this.styles().noItemMessage}>
					{filteredOut ? _('No notes match this filter.') : getEmptyFolderMessage(this.props.folders, this.props.selectedFolderId)}
				</Text>;
			}
		}
	}
}


// Keeps the same array while the inputs don't change, so the list doesn't re-render on unrelated state changes.
let lastFilterInputs: Parameters<typeof filterNoteList> = null;
let lastFilteredNotes: NoteEntity[] = [];
const filterNotes = (...inputs: Parameters<typeof filterNoteList>) => {
	if (!lastFilterInputs || inputs.some((input, index) => input !== lastFilterInputs[index])) {
		lastFilterInputs = inputs;
		lastFilteredNotes = filterNoteList(...inputs);
	}
	return lastFilteredNotes;
};

const NoteList = connect((state: AppState, ownProps: OwnProps) => {
	return {
		items: ownProps.filter ? filterNotes(state.notes, ownProps.filter, state.pinnedNotes) : state.notes,
		unfilteredCount: state.notes.length,
		folders: state.folders,
		notesSource: state.notesSource,
		themeId: state.settings.theme,
		noteSelectionEnabled: state.noteSelectionEnabled,
		selectedFolderId: state.selectedFolderId,
		syncStarted: state.syncStarted,
		syncTarget: state.settings['sync.target'],
	};
})(NoteListComponent);

export default NoteList;
