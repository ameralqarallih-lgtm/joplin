// Fork: the Workbench status bar: where the open note is, the editor in use and the note's word count.

import * as React from 'react';
import { useState } from 'react';
import { connect } from 'react-redux';
import { _, _n } from '@joplin/lib/locale';
import Folder from '@joplin/lib/models/Folder';
import Note from '@joplin/lib/models/Note';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import eventManager, { EventName, ItemChangeEvent } from '@joplin/lib/eventManager';
import { FolderEntity, NoteEntity } from '@joplin/lib/services/database/types';
import { AppState } from '../../../app.reducer';
const Countable = require('@joplin/lib/countable/Countable');

interface Props {
	homeTabActive: boolean;
	note: NoteEntity|null;
	folders: FolderEntity[];
	editorCodeView: boolean;
}

// Counts the saved body, so the count follows the editor's autosave rather than every keystroke.
const useWordCount = (noteId: string|null) => {
	const [wordCount, setWordCount] = useState<number|null>(null);
	const [changeCount, setChangeCount] = useState(0);

	useAsyncEffect(async (event) => {
		if (!noteId) {
			setWordCount(null);
			return;
		}

		const onItemChange = (change: ItemChangeEvent) => {
			if (change.itemId === noteId) setChangeCount(count => count + 1);
		};
		eventManager.on(EventName.ItemChange, onItemChange);
		event.onCleanup(() => eventManager.off(EventName.ItemChange, onItemChange));

		const note = await Note.load(noteId, { fields: ['body', 'encryption_applied'] });
		if (event.cancelled) return;
		if (!note || note.encryption_applied) {
			setWordCount(null);
			return;
		}
		Countable.count(note.body, (counter: { words: number }) => setWordCount(counter.words));
	}, [noteId, changeCount]);

	return wordCount;
};

const StatusBar: React.FC<Props> = props => {
	const noteId = !props.homeTabActive && props.note ? props.note.id : null;
	const wordCount = useWordCount(noteId);

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
