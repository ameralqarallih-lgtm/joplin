// Fork: the due date of a to-do as the Home page shows it: "Today", "Tomorrow", a weekday for the
// coming week, otherwise the date.

import { _, currentLocale } from '../../locale';
import time from '../../time';

export enum TodoDueTone {
	Normal = 'normal',
	Today = 'today',
	Overdue = 'overdue',
}

const dayLength = 24 * 60 * 60 * 1000;

const startOfDay = (ms: number) => {
	const date = new Date(ms);
	date.setHours(0, 0, 0, 0);
	return date.getTime();
};

const formatTodoDue = (due: number, now: number, locale = currentLocale()) => {
	if (!due) return null;

	const days = Math.round((startOfDay(due) - startOfDay(now)) / dayLength);
	if (days === 0) return { label: _('Today'), tone: due < now ? TodoDueTone.Overdue : TodoDueTone.Today };
	if (days === 1) return { label: _('Tomorrow'), tone: TodoDueTone.Normal };
	if (days > 1 && days < 7) {
		const label = new Date(due).toLocaleDateString(locale.replace('_', '-'), { weekday: 'short' });
		return { label, tone: TodoDueTone.Normal };
	}
	return { label: time.formatMsToLocal(due, time.dateFormat()), tone: days < 0 ? TodoDueTone.Overdue : TodoDueTone.Normal };
};

export default formatTodoDue;
