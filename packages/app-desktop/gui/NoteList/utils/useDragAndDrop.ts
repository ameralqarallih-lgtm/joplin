import * as React from 'react';
import { useCallback, DragEventHandler, MutableRefObject, useState, useEffect } from 'react';
import Note from '@joplin/lib/models/Note';
import canManuallySortNotes from './canManuallySortNotes';
import Setting from '@joplin/lib/models/Setting';
import saveDisplayedOrderAsCustomOrder from '@joplin/lib/services/sortOrder/saveDisplayedOrderAsCustomOrder';
import { Size } from '@joplin/utils/types';
import { ItemFlow } from '@joplin/lib/services/plugins/api/noteListType';
import { _ } from '@joplin/lib/locale';
import { DragKind, setDropTarget, startDrag } from '../../Workbench/DragDrop/dragFeedback';
import isWorkbenchTheme from '@joplin/lib/themes/utils/isWorkbenchTheme';

const useDragAndDrop = (
	parentFolderIsReadOnly: boolean,
	selectedNoteIds: string[],
	selectedFolderId: string,
	listRef: MutableRefObject<HTMLDivElement>,
	scrollTop: number,
	itemSize: Size,
	notesParentType: string,
	noteSortOrder: string,
	uncompletedTodosOnTop: boolean,
	showCompletedTodos: boolean,
	flow: ItemFlow,
	itemsPerLine: number,
	selectedFolderInTrash: boolean,
) => {
	const [dragOverTargetNoteIndex, setDragOverTargetNoteIndex] = useState(null);

	const onGlobalDrop = useCallback(() => {
		setDragOverTargetNoteIndex(null);
	}, []);

	// Fork: hides the insertion line once the pointer leaves the list, so that it doesn't suggest the notes would
	// land there.
	const onGlobalDragOver = useCallback((event: DragEvent) => {
		if (!listRef.current?.contains(event.target as Node)) setDragOverTargetNoteIndex(null);
	}, [listRef]);

	useEffect(() => {
		document.addEventListener('dragend', onGlobalDrop);
		document.addEventListener('dragover', onGlobalDragOver);
		return () => {
			document.removeEventListener('dragend', onGlobalDrop);
			document.removeEventListener('dragover', onGlobalDragOver);
		};
	}, [onGlobalDrop, onGlobalDragOver]);

	const onDragStart: DragEventHandler = useCallback(event => {
		if (parentFolderIsReadOnly) return false;

		let noteIds = [];

		// Here there is two cases:
		// - If multiple notes are selected, we drag the group
		// - If only one note is selected, we drag the note that was clicked on
		//   (which might be different from the currently selected note)
		if (selectedNoteIds.length >= 2) {
			noteIds = selectedNoteIds;
		} else {
			const clickedNoteId = event.currentTarget.getAttribute('data-id');
			if (clickedNoteId) noteIds.push(clickedNoteId);
		}

		if (!noteIds.length) return false;

		event.dataTransfer.setDragImage(new Image(), 1, 1);
		event.dataTransfer.clearData();
		event.dataTransfer.setData('text/x-jop-note-ids', JSON.stringify(noteIds));
		startDrag({ kind: DragKind.Notes, ids: noteIds });
		return true;
	}, [parentFolderIsReadOnly, selectedNoteIds]);


	const dragTargetNoteIndex = useCallback((event: React.DragEvent) => {
		const rect = listRef.current.getBoundingClientRect();
		const lineIndexFloat = (event.clientY - rect.top + scrollTop) / itemSize.height;
		if (flow === ItemFlow.TopToBottom) {
			return Math.abs(Math.round(lineIndexFloat));
		} else {
			const lineIndex = Math.floor(lineIndexFloat);
			const rowIndexFloat = (event.clientX - rect.left) / itemSize.width;
			const rowIndex = Math.round(rowIndexFloat);
			return lineIndex * itemsPerLine + rowIndex;
		}
	}, [listRef, itemSize, scrollTop, flow, itemsPerLine]);

	const onDragOver: DragEventHandler = useCallback(event => {
		if (notesParentType !== 'Folder') return;
		if (selectedFolderInTrash) return;

		const dt = event.dataTransfer;

		if (dt.types.indexOf('text/x-jop-note-ids') >= 0) {
			event.preventDefault();
			// Fork: for the drag preview. Dropping into a list that isn't in custom order offers to switch to it.
			setDropTarget({ label: noteSortOrder === 'order' ? _('Move here') : _('Move here (switches to custom order)'), allowed: true });
			const newIndex = dragTargetNoteIndex(event);
			if (dragOverTargetNoteIndex === newIndex) return;
			setDragOverTargetNoteIndex(newIndex);
		}
	}, [notesParentType, dragTargetNoteIndex, dragOverTargetNoteIndex, selectedFolderInTrash, noteSortOrder]);

	const onDrop: DragEventHandler = useCallback(async (event) => {
		const dt = event.dataTransfer;
		if (!dt.types.includes('text/x-jop-note-ids')) return;

		// TODO: check that parent type is folder
		let switchedToCustomOrder = false;
		// Fork: with a Workbench theme, the drag preview has already said that the drop switches to the custom order,
		// so it switches without asking.
		const switchWithoutAsking = noteSortOrder !== 'order' && notesParentType === 'Folder' && !selectedFolderInTrash && isWorkbenchTheme(Setting.value('theme'));
		if (switchWithoutAsking) {
			Setting.setValue('notes.sortOrder.field', 'order');
			switchedToCustomOrder = true;
		} else if (!canManuallySortNotes(notesParentType, noteSortOrder, selectedFolderInTrash)) {
			// Fork: if the user has just switched to custom order, still make the move they dropped.
			if (noteSortOrder === 'order' || Setting.value('notes.sortOrder.field') !== 'order') return;
			switchedToCustomOrder = true;
		}

		setDragOverTargetNoteIndex(null);

		const targetNoteIndex = dragTargetNoteIndex(event);
		const noteIds: string[] = JSON.parse(dt.getData('text/x-jop-note-ids'));

		if (switchedToCustomOrder) {
			await saveDisplayedOrderAsCustomOrder(selectedFolderId, { field: noteSortOrder, reverse: Setting.value('notes.sortOrder.reverse'), uncompletedTodosOnTop, showCompletedTodos });
		}

		await Note.insertNotesAt(selectedFolderId, noteIds, targetNoteIndex, uncompletedTodosOnTop, showCompletedTodos);
	}, [notesParentType, dragTargetNoteIndex, noteSortOrder, selectedFolderId, uncompletedTodosOnTop, showCompletedTodos, selectedFolderInTrash]);

	return { onDragStart, onDragOver, onDrop, dragOverTargetNoteIndex };
};

export default useDragAndDrop;
