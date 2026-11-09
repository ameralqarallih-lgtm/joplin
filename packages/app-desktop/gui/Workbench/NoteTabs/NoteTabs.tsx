// Fork: the Workbench tab bar above the editor, with the open notes. See noteTabsReducer.ts. Home is opened from
// the sidebar (SidebarHome.tsx) and the rail.

import * as React from 'react';
import { useState } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { _ } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import Note from '@joplin/lib/models/Note';
import { NoteEntity } from '@joplin/lib/services/database/types';
import { AppState } from '../../../app.reducer';
import { NoteTab } from './noteTabsReducer';

interface Props {
	noteTabs: NoteTab[];
	homeTabActive: boolean;
	selectedNoteIds: string[];
	notes: NoteEntity[];
	dispatch: Dispatch;
}

// Notes open in tabs aren't always in the note list, so their titles are loaded. The note list's copy
// is newer for the notes it has, such as the one being edited.
const useTabNotes = (noteTabs: NoteTab[], listNotes: NoteEntity[]) => {
	const [loadedNotes, setLoadedNotes] = useState<NoteEntity[]>([]);
	const noteIdsKey = noteTabs.map(tab => tab.noteId).join(',');

	useAsyncEffect(async (event) => {
		const notes = await Note.byIds(noteIdsKey ? noteIdsKey.split(',') : [], { fields: ['id', 'title', 'is_todo'] });
		if (!event.cancelled) setLoadedNotes(notes);
	}, [noteIdsKey]);

	const notesById: Record<string, NoteEntity> = {};
	for (const note of loadedNotes) notesById[note.id] = note;
	for (const tab of noteTabs) {
		const listNote = listNotes.find(note => note.id === tab.noteId);
		if (listNote) notesById[tab.noteId] = listNote;
	}
	return notesById;
};

const openNote = (noteId: string) => {
	void CommandService.instance().execute('openNote', noteId);
};

const NoteTabs: React.FC<Props> = props => {
	const notesById = useTabNotes(props.noteTabs, props.notes);
	const activeNoteId = !props.homeTabActive && props.selectedNoteIds.length === 1 ? props.selectedNoteIds[0] : null;

	const onClose = (noteId: string) => {
		const index = props.noteTabs.findIndex(tab => tab.noteId === noteId);
		props.dispatch({ type: 'WORKBENCH_TAB_CLOSE', noteId });
		if (noteId !== activeNoteId) return;

		const neighbour = props.noteTabs[index + 1] ?? props.noteTabs[index - 1];
		if (neighbour) {
			openNote(neighbour.noteId);
		} else {
			props.dispatch({ type: 'WORKBENCH_HOME_SHOW' });
		}
	};

	const tabs = props.noteTabs.map(tab => {
		const note = notesById[tab.noteId];
		const title = note ? Note.displayTitle(note) : '…';
		const active = tab.noteId === activeNoteId;
		const classNames = ['note-tab', active ? '-active' : '', tab.preview ? '-preview' : ''].filter(c => !!c);

		return <div
			key={tab.noteId}
			className={classNames.join(' ')}
			onAuxClick={event => { if (event.button === 1) onClose(tab.noteId); }}
		>
			<button
				type='button'
				role='tab'
				className='label'
				aria-selected={active}
				title={title}
				onClick={() => openNote(tab.noteId)}
				onDoubleClick={() => props.dispatch({ type: 'WORKBENCH_TAB_KEEP', noteId: tab.noteId })}
			>
				{note?.is_todo ? <i className='icon icon-to-do-list' aria-hidden={true}></i> : null}
				<span className='text'>{title}</span>
			</button>
			<button type='button' className='close' aria-label={_('Close %s', title)} title={_('Close')} onClick={() => onClose(tab.noteId)}>
				<i className='fas fa-times' aria-hidden={true}></i>
			</button>
		</div>;
	});

	return <div className='note-tabs' role='tablist' aria-label={_('Open notes')}>
		{tabs}
	</div>;
};

export default connect((state: AppState) => ({
	noteTabs: state.noteTabs,
	homeTabActive: state.homeTabActive,
	selectedNoteIds: state.selectedNoteIds,
	notes: state.notes,
}))(NoteTabs);
