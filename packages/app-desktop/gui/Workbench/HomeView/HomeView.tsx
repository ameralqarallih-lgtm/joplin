// Fork: the Workbench Home page, shown in the Home tab: the recently changed notes, open to-dos, pinned notes and
// top-level notebooks.

import * as React from 'react';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { _, _n, currentLocale } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import loadHomeData, { HomeData } from '@joplin/lib/models/utils/loadHomeData';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import eventManager, { EventName } from '@joplin/lib/eventManager';
import Note from '@joplin/lib/models/Note';
import Folder from '@joplin/lib/models/Folder';
import formatListDate from '@joplin/lib/services/noteList/formatListDate';
import formatTodoDue from '@joplin/lib/services/home/formatTodoDue';
import { ALL_NOTES_FILTER_ID } from '@joplin/lib/reserved-ids';
import { FolderEntity, NoteEntity } from '@joplin/lib/services/database/types';
import FolderIconBox from '../../FolderIconBox';
import { folderColor } from '@joplin/lib/models/utils/folderColor';
import { AppState } from '../../../app.reducer';
import setTodoCompleted from './setTodoCompleted';

interface Props {
	visible: boolean;
	folders: FolderEntity[];
	pinnedNotes: NoteEntity[];
	includeCompletedTodos: boolean;
	dispatch: Dispatch;
}

const reloadDelay = 400;

const useHomeData = (visible: boolean, includeCompletedTodos: boolean) => {
	const [data, setData] = useState<HomeData|null>(null);
	const [changeCount, setChangeCount] = useState(0);

	useAsyncEffect(async (event) => {
		if (!visible) return;
		let timeout: ReturnType<typeof setTimeout> = null;
		const onItemChange = () => {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => setChangeCount(count => count + 1), reloadDelay);
		};
		eventManager.on(EventName.ItemChange, onItemChange);
		event.onCleanup(() => {
			eventManager.off(EventName.ItemChange, onItemChange);
			if (timeout) clearTimeout(timeout);
		});

		const result = await loadHomeData({ includeCompletedTodosInCounts: includeCompletedTodos });
		if (!event.cancelled) setData(result);
	}, [visible, changeCount, includeCompletedTodos]);

	return data;
};

const openNote = (noteId: string) => {
	void CommandService.instance().execute('openNote', noteId);
};

const folderTitle = (folders: FolderEntity[], folderId: string) => folders.find(folder => folder.id === folderId)?.title ?? '';

const RecentSection: React.FC<{ data: HomeData; folders: FolderEntity[]; dispatch: Dispatch }> = ({ data, folders, dispatch }) => {
	const onAllNotes = () => dispatch({ type: 'SMART_FILTER_SELECT', id: ALL_NOTES_FILTER_ID });

	const cards = data.recent.map(({ note, excerpt, tag }) => (
		<button key={note.id} type='button' className='note-card' onClick={() => openNote(note.id)}>
			<span className='path'>{Folder.folderPathString(folders, note.parent_id)}</span>
			<span className='title'>{Note.displayTitle(note)}</span>
			{excerpt ? <span className='excerpt'>{excerpt}</span> : null}
			<span className='footer'>
				<span>{formatListDate(note.user_updated_time)}</span>
				{tag ? <span className='tag'>#{tag}</span> : null}
			</span>
		</button>
	));

	return <section className='home-section' aria-labelledby='home-recent'>
		<div className='header'>
			<h2 className='title' id='home-recent'>{_('Continue where you left off')}</h2>
			<button type='button' className='link' onClick={onAllNotes}>{_('All notes')}</button>
		</div>
		{cards.length ? <div className='cards'>{cards}</div> : <p className='empty'>{_('The notes you change appear here.')}</p>}
	</section>;
};

const TodoPanel: React.FC<{ todos: NoteEntity[] }> = ({ todos }) => {
	const now = Date.now();
	// Shows a ticked box straight away, until the reloaded to-dos arrive.
	const [checkedOverrides, setCheckedOverrides] = useState<Record<string, boolean>>({});
	useEffect(() => setCheckedOverrides({}), [todos]);

	const onCheckedChange = async (noteId: string, checked: boolean) => {
		setCheckedOverrides(overrides => ({ ...overrides, [noteId]: checked }));
		if (!await setTodoCompleted(noteId, checked)) {
			setCheckedOverrides(overrides => ({ ...overrides, [noteId]: !checked }));
		}
	};

	const rows = todos.map(note => {
		const completed = checkedOverrides[note.id] ?? !!note.todo_completed;
		const due = formatTodoDue(note.todo_due, now);
		const label = completed ? _('Done') : due?.label;
		const tone = completed ? 'done' : due?.tone;
		return <li key={note.id} className={`todo-row ${completed ? '-completed' : ''}`}>
			<input
				type='checkbox'
				className='checkbox'
				checked={completed}
				aria-label={Note.displayTitle(note)}
				onChange={event => void onCheckedChange(note.id, event.currentTarget.checked)}
			/>
			<button type='button' className='title' onClick={() => openNote(note.id)}>{Note.displayTitle(note)}</button>
			{label ? <span className={`due -${tone}`}>{label}</span> : null}
		</li>;
	});

	return <section className='home-panel' aria-labelledby='home-todos'>
		<h2 className='title' id='home-todos'>{_('To-dos')}</h2>
		{rows.length ? <ul className='rows'>{rows}</ul> : <p className='empty'>{_('No open to-dos.')}</p>}
	</section>;
};

const PinnedPanel: React.FC<{ pinnedNotes: NoteEntity[]; folders: FolderEntity[] }> = ({ pinnedNotes, folders }) => {
	const rows = pinnedNotes.map(note => (
		<li key={note.id}>
			<button type='button' className='pinned-row' onClick={() => openNote(note.id)}>
				<i className='icon fas fa-thumbtack' aria-hidden={true}></i>
				<span className='title'>{Note.displayTitle(note)}</span>
				<span className='folder'>{folderTitle(folders, note.parent_id)}</span>
			</button>
		</li>
	));

	return <section className='home-panel' aria-labelledby='home-pinned'>
		<h2 className='title' id='home-pinned'>{_('Pinned')}</h2>
		{rows.length ? <ul className='rows'>{rows}</ul> : <p className='empty'>{_('Pin a note from its menu in the note list to keep it here.')}</p>}
	</section>;
};

const FolderSection: React.FC<{ data: HomeData; dispatch: Dispatch }> = ({ data, dispatch }) => {
	const tiles = data.folders.map(({ folder, noteCount }) => {
		const icon = Folder.unserializeIcon(folder.icon);
		const color = folderColor(folder);
		const style = color ? { '--tile-accent': color } as React.CSSProperties : undefined;
		return <button key={folder.id} type='button' className='folder-tile' style={style} onClick={() => dispatch({ type: 'FOLDER_SELECT', id: folder.id })}>
			<span className='icon'>{icon ? <FolderIconBox folderIcon={icon}/> : <i className='icon-notebooks' aria-hidden={true}></i>}</span>
			<span className='text'>
				<span className='name'>{folder.title}</span>
				<span className='count'>{_n('%d note', '%d notes', noteCount, noteCount)}</span>
			</span>
		</button>;
	});

	return <section className='home-section' aria-labelledby='home-folders'>
		<div className='header'>
			<h2 className='title' id='home-folders'>{_('Notebooks')}</h2>
		</div>
		<div className='tiles'>
			{tiles}
			<button type='button' className='folder-tile -new' onClick={() => void CommandService.instance().execute('newFolder')}>
				<span className='icon'><i className='fas fa-plus' aria-hidden={true}></i></span>
				<span className='text'><span className='name'>{_('New notebook')}</span></span>
			</button>
		</div>
	</section>;
};

const HomeView: React.FC<Props> = props => {
	const data = useHomeData(props.visible, props.includeCompletedTodos);
	if (!props.visible) return null;

	const today = new Date().toLocaleDateString(currentLocale().replace('_', '-'), { weekday: 'long', day: 'numeric', month: 'long' });

	return <div className='home-view' role='region' aria-label={_('Home')}>
		<div className='content'>
			<header className='heading'>
				<p className='date'>{today}</p>
				<h1 className='title'>{_('Home')}</h1>
			</header>
			{data ? <>
				<RecentSection data={data} folders={props.folders} dispatch={props.dispatch}/>
				<div className='panels'>
					<TodoPanel todos={data.todos}/>
					<PinnedPanel pinnedNotes={props.pinnedNotes} folders={props.folders}/>
				</div>
				<FolderSection data={data} dispatch={props.dispatch}/>
			</> : null}
		</div>
	</div>;
};

export default connect((state: AppState) => ({
	folders: state.folders,
	pinnedNotes: state.pinnedNotes,
	includeCompletedTodos: state.settings.showCompletedTodos,
}))(HomeView);
