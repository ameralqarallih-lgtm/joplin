// Fork: the title and note count above the Workbench note list, where upstream has the New note buttons (those are
// in the top bar).

import * as React from 'react';
import { connect } from 'react-redux';
import { _, _n } from '@joplin/lib/locale';
import { stateUtils } from '@joplin/lib/reducer';
import { getTrashFolderId } from '@joplin/lib/services/trash';
import Folder from '@joplin/lib/models/Folder';
import { TagEntity } from '@joplin/lib/services/database/types';
import { folderColor } from '@joplin/lib/models/utils/folderColor';
import { AppState } from '../../../app.reducer';

interface Props {
	title: string;
	noteCount: number;
	color: string;
}

const NoteListTitle: React.FC<Props> = props => {
	return <div className='note-list-title'>
		{props.color ? <span className='folder-color-dot' style={{ '--folder-color': props.color } as React.CSSProperties}/> : null}
		<span className='name' title={props.title}>{props.title}</span>
		<span className='count'>{_n('%d note', '%d notes', props.noteCount, props.noteCount)}</span>
	</div>;
};

interface OwnProps {
	windowId: string;
}

const listTitle = (state: AppState, windowId: string) => {
	const windowState = stateUtils.windowStateById(state, windowId);
	if (windowState.notesParentType === 'Folder') {
		if (windowState.selectedFolderId === getTrashFolderId()) return _('Trash');
		if (windowState.selectedFolderId === Folder.conflictFolderId()) return Folder.conflictFolderTitle();
		return state.folders.find(folder => folder.id === windowState.selectedFolderId)?.title ?? '';
	}
	if (windowState.notesParentType === 'Tag') {
		// state.tags holds tags, typed as NoteTagEntity upstream.
		const tag = state.tags.find(tag => tag.id === windowState.selectedTagId) as TagEntity|undefined;
		return tag ? `#${tag.title}` : '';
	}
	if (windowState.notesParentType === 'Search') {
		return state.searches.find(search => search.id === windowState.selectedSearchId)?.title ?? _('Search');
	}
	return _('All notes');
};

const listColor = (state: AppState, windowId: string) => {
	const windowState = stateUtils.windowStateById(state, windowId);
	if (windowState.notesParentType !== 'Folder') return '';
	return folderColor(state.folders.find(folder => folder.id === windowState.selectedFolderId));
};

export default connect((state: AppState, ownProps: OwnProps) => ({
	title: listTitle(state, ownProps.windowId),
	noteCount: stateUtils.windowStateById(state, ownProps.windowId).notes.length,
	color: listColor(state, ownProps.windowId),
}))(NoteListTitle);
