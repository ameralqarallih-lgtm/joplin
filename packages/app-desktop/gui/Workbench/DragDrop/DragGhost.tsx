// Fork: the drag preview. While notes or notebooks are dragged, a card follows the pointer, tilted like a lifted
// sheet, and says where a drop would land, while an outline marks the target. On a drop the card flies into the
// target. Native drag images can't change during a drag, so the drag keeps upstream's empty drag image and this
// card is drawn instead.

import * as React from 'react';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { connect } from 'react-redux';
import { _, _n } from '@joplin/lib/locale';
import Folder from '@joplin/lib/models/Folder';
import { FolderEntity, NoteEntity } from '@joplin/lib/services/database/types';
import { folderColor } from '@joplin/lib/models/utils/folderColor';
import { defaultWindowId, stateUtils } from '@joplin/lib/reducer';
import { AppState } from '../../../app.reducer';
import { DragKind, DragSource, endDrag, getFeedback, publishPendingTarget, resetPendingTarget, subscribe } from './dragFeedback';

interface Props {
	notes: NoteEntity[];
	folders: FolderEntity[];
}

enum Exit {
	None,
	Drop,
	Cancel,
}

const ghostOffset = { x: 14, y: 10 };
const exitDurations: Record<Exit, number> = { [Exit.None]: 0, [Exit.Drop]: 260, [Exit.Cancel]: 160 };

// Item IDs go into a stylesheet selector, so only accept the characters that IDs use.
const safeIds = (ids: string[]) => ids.filter(id => /^[0-9a-zA-Z]+$/.test(id));

const sourceSelector = (source: DragSource) => {
	return safeIds(source.ids).map(id => source.kind === DragKind.Notes
		? `.note-list-item-wrapper[data-id="${id}"]`
		: `.list-item-wrapper[data-folder-id="${id}"]`,
	).join(', ');
};

const rectStyle = (rect: DOMRect): React.CSSProperties => ({
	transform: `translate(${rect.left}px, ${rect.top}px)`,
	width: rect.width,
	height: rect.height,
});

const DragGhost: React.FC<Props> = props => {
	const feedback = useSyncExternalStore(subscribe, getFeedback);
	const ghostRef = useRef<HTMLDivElement>(null);
	const [positioned, setPositioned] = useState(false);
	const [exit, setExit] = useState(Exit.None);
	const [targetRect, setTargetRect] = useState<DOMRect|null>(null);
	const exitRef = useRef(Exit.None);
	const exitTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

	const finish = useCallback((kind: Exit) => {
		if (exitRef.current !== Exit.None || !getFeedback().source) return;
		exitRef.current = kind;
		setExit(kind);

		const target = getFeedback().target;
		const ghost = ghostRef.current;
		if (kind === Exit.Drop && target?.element && ghost) {
			// Added here rather than on the next render, so that the move below is animated.
			ghost.classList.add('-dropped');
			const rect = target.element.getBoundingClientRect();
			ghost.style.transform = `translate(${rect.left + 12}px, ${rect.top + rect.height / 2 - 14}px)`;
		}

		exitTimerRef.current = setTimeout(() => {
			exitRef.current = Exit.None;
			setExit(Exit.None);
			setPositioned(false);
			setTargetRect(null);
			endDrag();
		}, exitDurations[kind]);
	}, []);

	useEffect(() => {
		const onDragOverCapture = () => {
			resetPendingTarget();
		};

		const onDragOver = (event: DragEvent) => {
			if (!getFeedback().source || exitRef.current !== Exit.None) return;
			publishPendingTarget();
			if (ghostRef.current) {
				ghostRef.current.style.transform = `translate(${event.clientX + ghostOffset.x}px, ${event.clientY + ghostOffset.y}px)`;
				setPositioned(true);
			}
			const element = getFeedback().target?.element;
			setTargetRect(current => {
				if (!element) return null;
				const rect = element.getBoundingClientRect();
				const same = current && current.top === rect.top && current.left === rect.left && current.width === rect.width && current.height === rect.height;
				return same ? current : rect;
			});
		};

		// Runs after the target's own drop handler, which marks the drop as handled.
		const onDrop = (event: DragEvent) => {
			finish(event.defaultPrevented && getFeedback().target?.allowed ? Exit.Drop : Exit.Cancel);
		};

		const onDragEnd = () => {
			finish(Exit.Cancel);
		};

		// A dragged row can be removed from the page before the drag ends (for example once its note has moved), and
		// then "dragend" never reaches the document. Mouse events only resume once the drag is over.
		const onMouseMove = () => {
			if (getFeedback().source && exitRef.current === Exit.None) finish(Exit.Cancel);
		};

		document.addEventListener('dragover', onDragOverCapture, true);
		document.addEventListener('dragover', onDragOver);
		document.addEventListener('drop', onDrop);
		document.addEventListener('dragend', onDragEnd);
		document.addEventListener('mousemove', onMouseMove);
		return () => {
			document.removeEventListener('dragover', onDragOverCapture, true);
			document.removeEventListener('dragover', onDragOver);
			document.removeEventListener('drop', onDrop);
			document.removeEventListener('dragend', onDragEnd);
			document.removeEventListener('mousemove', onMouseMove);
			clearTimeout(exitTimerRef.current);
		};
	}, [finish]);

	const { source, target } = feedback;
	if (!source) return null;

	const count = source.ids.length;
	let title = '';
	let iconClass = '';
	let dotColor = '';
	if (source.kind === DragKind.Notes) {
		const note = props.notes.find(n => n.id === source.ids[0]);
		title = count > 1 ? _n('%d note', '%d notes', count, count) : (note?.title || _('Untitled'));
		iconClass = note?.is_todo && count === 1 ? 'fas fa-check-square' : 'icon-note';
	} else {
		const folder = props.folders.find(f => f.id === source.ids[0]);
		title = count > 1 ? _n('%d notebook', '%d notebooks', count, count) : (folder ? Folder.displayTitle(folder) : '');
		dotColor = count === 1 && folder ? folderColor(folder) : '';
		iconClass = dotColor ? '' : 'fas fa-folder';
	}

	const ghostClasses = [
		'drag-ghost',
		positioned ? '-positioned' : '',
		exit === Exit.Drop ? '-dropped' : '',
		exit === Exit.Cancel ? '-cancelled' : '',
		target ? (target.allowed ? '-over-target' : '-blocked') : '',
	];

	const highlight = targetRect && target && exit !== Exit.Cancel ? <div
		className={`drop-highlight ${target.allowed ? '' : '-blocked'} ${exit === Exit.Drop ? '-landed' : ''}`}
		style={rectStyle(targetRect)}
	/> : null;

	return <>
		<style>{`${sourceSelector(source)} { opacity: 0.4; transition: opacity 120ms; }`}</style>
		{highlight}
		<div className={ghostClasses.join(' ')} ref={ghostRef} aria-hidden='true'>
			<div className={`card ${count > 1 ? '-stack' : ''}`}>
				<div className='item'>
					{dotColor ? <span className='folder-color-dot' style={{ '--folder-color': dotColor } as React.CSSProperties}/> : <i className={`icon ${iconClass}`}/>}
					<span className='title'>{title}</span>
				</div>
				{target ? <div className='target'>
					<i className={`icon fas ${target.allowed ? 'fa-arrow-right' : 'fa-ban'}`}/>
					<span className='label'>{target.label}</span>
				</div> : null}
			</div>
		</div>
	</>;
};

export default connect((state: AppState) => ({
	notes: stateUtils.windowStateById(state, defaultWindowId).notes,
	folders: state.folders,
}))(DragGhost);
