// Fork: the Workbench status bar: where the open note is, the editor in use and the note's word count.

import * as React from 'react';
import { useMemo } from 'react';
import { connect } from 'react-redux';
import { _, _n } from '@joplin/lib/locale';
import Folder from '@joplin/lib/models/Folder';
import { FolderEntity, NoteEntity } from '@joplin/lib/services/database/types';
import { AppState } from '../../../app.reducer';
import useSavedNoteBody from '../utils/useSavedNoteBody';
const Countable = require('@joplin/lib/countable/Countable');

interface Props {
	homeTabActive: boolean;
	note: NoteEntity|null;
	folders: FolderEntity[];
	editorCodeView: boolean;
}

const countWords = (body: string|null) => {
	if (body === null) return null;
	let words = 0;
	Countable.count(body, (counter: { words: number }) => { words = counter.words; });
	return words;
};

const StatusBar: React.FC<Props> = props => {
	const noteId = !props.homeTabActive && props.note ? props.note.id : null;
	const body = useSavedNoteBody(noteId);
	const wordCount = useMemo(() => countWords(body), [body]);

	const location = noteId ? Folder.folderPathString(props.folders, props.note.parent_id) : _('Home');

	return <footer className='workbench-status-bar'>
		<span className='location'>{location}</span>
		<span className='spacer'></span>
		{noteId ? <span className='item'>{props.editorCodeView ? _('Markdown') : _('Rich Text')}</span> : null}
		{noteId && wordCount !== null ? <span className='item'>{_n('%d word', '%d words', wordCount, wordCount)}</span> : null}
	</footer>;
};

export default connect((state: AppState) => {
	const noteId = state.selectedNoteIds.length === 1 ? state.selectedNoteIds[0] : null;
	return {
		homeTabActive: state.homeTabActive,
		note: noteId ? state.notes.find(note => note.id === noteId) ?? null : null,
		folders: state.folders,
		editorCodeView: state.editorCodeView,
	};
})(StatusBar);
