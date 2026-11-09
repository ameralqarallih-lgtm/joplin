// Fork: the pinned notes at the top of the Workbench sidebar.

import * as React from 'react';
import { connect } from 'react-redux';
import { _ } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import Note from '@joplin/lib/models/Note';
import { NoteEntity } from '@joplin/lib/services/database/types';
import { AppState } from '../../../app.reducer';
import bridge from '../../../services/bridge';

interface Props {
	pinnedNotes: NoteEntity[];
	activeNoteId: string|null;
}

const showContextMenu = (noteId: string) => {
	const menu = new (bridge().Menu)();
	menu.append(new (bridge().MenuItem)({
		label: _('Unpin'),
		click: () => void CommandService.instance().execute('togglePinNote', [noteId]),
	}));
	menu.popup({ window: bridge().mainWindow() });
};

const SidebarPinned: React.FC<Props> = props => {
	if (!props.pinnedNotes.length) return null;

	const items = props.pinnedNotes.map(note => (
		<li key={note.id}>
			<button
				type='button'
				className={`item ${note.id === props.activeNoteId ? '-selected' : ''}`}
				onClick={() => void CommandService.instance().execute('openNote', note.id)}
				onContextMenu={() => showContextMenu(note.id)}
			>
				<i className='icon fas fa-thumbtack' aria-hidden={true}></i>
				<span className='label'>{Note.displayTitle(note)}</span>
			</button>
		</li>
	));

	return <section className='sidebar-pinned' aria-labelledby='sidebar-pinned-title'>
		<h2 className='title' id='sidebar-pinned-title'>{_('Pinned')}</h2>
		<ul className='items'>{items}</ul>
	</section>;
};

export default connect((state: AppState) => ({
	pinnedNotes: state.pinnedNotes,
	activeNoteId: !state.homeTabActive && state.selectedNoteIds.length === 1 ? state.selectedNoteIds[0] : null,
}))(SidebarPinned);
