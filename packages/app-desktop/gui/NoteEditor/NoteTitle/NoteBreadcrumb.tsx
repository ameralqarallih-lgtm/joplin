// Fork: the notebooks that contain the open note, shown above its title. Clicking one opens it.

import * as React from 'react';
import { useCallback, useContext, useMemo } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { _ } from '@joplin/lib/locale';
import Folder from '@joplin/lib/models/Folder';
import { FolderEntity } from '@joplin/lib/services/database/types';
import { defaultWindowId } from '@joplin/lib/reducer';
import { AppState } from '../../../app.reducer';
import { WindowIdContext } from '../../NewWindowOrIFrame';

interface Props {
	noteId: string;
	folderId: string;
	folders: FolderEntity[];
	dispatch: Dispatch;
}

const NoteBreadcrumb: React.FC<Props> = props => {
	const { noteId, folderId, folders, dispatch } = props;
	const path = useMemo(() => Folder.folderPath(folders, folderId), [folders, folderId]);
	// Selecting a notebook changes the main window, so only offer it there.
	const interactive = useContext(WindowIdContext) === defaultWindowId;

	const onCrumbClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
		const id = event.currentTarget.dataset.folderId;
		for (const folder of Folder.folderPath(folders, id)) {
			dispatch({ type: 'FOLDER_SET_COLLAPSED', id: folder.id, collapsed: false });
		}
		// Keep the note open when going to its own notebook.
		if (id === folderId) {
			dispatch({ type: 'FOLDER_AND_NOTE_SELECT', folderId: id, noteId });
		} else {
			dispatch({ type: 'FOLDER_SELECT', id });
		}
	}, [dispatch, folders, folderId, noteId]);

	if (!path.length) return null;

	return (
		<nav className='note-breadcrumb' aria-label={_('Notebook')}>
			{path.map((folder, index) => (
				<React.Fragment key={folder.id}>
					{index > 0 ? <span className='separator' aria-hidden='true'>›</span> : null}
					{interactive
						? <button type='button' className='crumb' data-folder-id={folder.id} onClick={onCrumbClick}>{Folder.displayTitle(folder)}</button>
						: <span className='crumb'>{Folder.displayTitle(folder)}</span>}
				</React.Fragment>
			))}
		</nav>
	);
};

const mapStateToProps = (state: AppState) => ({ folders: state.folders });

export default connect(mapStateToProps)(NoteBreadcrumb);
