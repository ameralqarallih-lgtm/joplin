// Fork: saves the order a notebook's notes are shown in as their custom order. Switching the sort
// order to "Custom order" then leaves the list as it was, so a note dragged before the switch can
// still be dropped where it was aimed.

import Note from '../../models/Note';
import time from '../../time';

interface Options {
	field: string;
	reverse: boolean;
	uncompletedTodosOnTop: boolean;
	showCompletedTodos: boolean;
}

const saveDisplayedOrderAsCustomOrder = async (folderId: string, options: Options) => {
	const notes = await Note.previews(folderId, {
		order: [{ by: options.field, dir: options.reverse ? 'DESC' : 'ASC' }],
		uncompletedTodosOnTop: options.uncompletedTodosOnTop,
		showCompletedTodos: options.showCompletedTodos,
		fields: ['id', 'parent_id', 'order', 'user_updated_time'],
	});

	// Custom order sorts by "order", highest first. Like Note.updateNoteOrder_, keep the user timestamps.
	const top = time.unixMs();
	for (let i = 0; i < notes.length; i++) {
		await Note.save({
			...notes[i],
			order: top - i * 1000,
			user_updated_time: notes[i].user_updated_time,
			updated_time: time.unixMs(),
		}, { autoTimestamp: false, dispatchUpdateAction: false });
	}
};

export default saveDisplayedOrderAsCustomOrder;
