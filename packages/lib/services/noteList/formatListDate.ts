// Fork: the date shown in note list rows. The time for notes changed today, otherwise the date: short
// enough to fit a narrow list.

import time from '../../time';

const formatListDate = (ms: number) => {
	const isToday = new Date(ms).toDateString() === new Date().toDateString();
	return time.formatMsToLocal(ms, isToday ? time.timeFormat() : time.dateFormat());
};

export default formatListDate;
