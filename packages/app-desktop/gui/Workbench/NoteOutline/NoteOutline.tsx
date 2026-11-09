// Fork: the outline beside the Workbench editor: the note's headings, which scroll the editor to them, and the
// notes that link to it.

import * as React from 'react';
import { useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { _ } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import Note from '@joplin/lib/models/Note';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import noteHeadings from '@joplin/lib/services/noteOutline/noteHeadings';
import loadBacklinks from '@joplin/lib/models/utils/loadBacklinks';
import { MarkupLanguage } from '@joplin/renderer';
import { NoteEntity } from '@joplin/lib/services/database/types';
import { AppState } from '../../../app.reducer';
import useSavedNoteBody from '../utils/useSavedNoteBody';

interface Props {
	noteId: string|null;
	isMarkdown: boolean;
}

const useBacklinks = (noteId: string|null) => {
	const [backlinks, setBacklinks] = useState<NoteEntity[]>([]);
	useAsyncEffect(async (event) => {
		const notes = noteId ? await loadBacklinks(noteId) : [];
		if (!event.cancelled) setBacklinks(notes);
	}, [noteId]);
	return backlinks;
};

const NoteOutline: React.FC<Props> = props => {
	const body = useSavedNoteBody(props.noteId);
	const headings = useMemo(() => body && props.isMarkdown ? noteHeadings(body) : [], [body, props.isMarkdown]);
	const backlinks = useBacklinks(props.noteId);

	if (!headings.length && !backlinks.length) return null;

	// Indents relative to the note's top heading level, so a note that starts at "##" isn't indented.
	const topLevel = Math.min(...headings.map(heading => heading.level));

	return <aside className='note-outline' aria-label={_('Outline')}>
		{headings.length ? <>
			<h2 className='title'>{_('On this page')}</h2>
			<ul className='headings'>
				{headings.map(heading => (
					<li key={heading.slug}>
						<button
							type='button'
							className={`heading -level${Math.min(heading.level - topLevel, 3)}`}
							title={heading.text}
							onClick={() => void CommandService.instance().execute('scrollToHash', heading.slug)}
						>{heading.text}</button>
					</li>
				))}
			</ul>
		</> : null}
		{backlinks.length ? <>
			<h2 className='title'>{_('Linked from')}</h2>
			<ul className='backlinks'>
				{backlinks.map(note => (
					<li key={note.id}>
						<button type='button' className='backlink' onClick={() => void CommandService.instance().execute('openNote', note.id)}>
							{Note.displayTitle(note)}
						</button>
					</li>
				))}
			</ul>
		</> : null}
	</aside>;
};

export default connect((state: AppState) => {
	const noteId = !state.homeTabActive && state.selectedNoteIds.length === 1 ? state.selectedNoteIds[0] : null;
	const note = noteId ? state.notes.find(n => n.id === noteId) : null;
	return {
		noteId: note ? noteId : null,
		isMarkdown: note?.markup_language !== MarkupLanguage.Html,
	};
})(NoteOutline);
