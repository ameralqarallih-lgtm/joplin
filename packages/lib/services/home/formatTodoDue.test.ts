import formatTodoDue, { TodoDueTone } from './formatTodoDue';

// Monday 9 November 2026, 10:00
const now = new Date(2026, 10, 9, 10, 0).getTime();
const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 0).getTime();

describe('formatTodoDue', () => {
	test.each([
		[0, null],
		[at(9, 18), { label: 'Today', tone: TodoDueTone.Today }],
		[at(9, 8), { label: 'Today', tone: TodoDueTone.Overdue }],
		[at(10, 8), { label: 'Tomorrow', tone: TodoDueTone.Normal }],
		[at(13, 8), { label: 'Fri', tone: TodoDueTone.Normal }],
		[at(5, 8), { label: expect.any(String), tone: TodoDueTone.Overdue }],
		[at(30, 8), { label: expect.any(String), tone: TodoDueTone.Normal }],
	])('should format %s', (due, expected) => {
		expect(formatTodoDue(due, now, 'en_GB')).toEqual(expected);
	});
});
