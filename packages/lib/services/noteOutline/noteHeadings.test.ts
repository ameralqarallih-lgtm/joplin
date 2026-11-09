import noteHeadings from './noteHeadings';

describe('noteHeadings', () => {
	test('should list headings with their level, plain text and anchor slug', () => {
		const body = [
			'# Plan',
			'Text',
			'## Next **steps** ##',
			'```md',
			'# Not a heading',
			'```',
			'### [Linked](https://example.com) `code`',
			'## Next steps',
			'#NoSpace',
		].join('\n');

		expect(noteHeadings(body)).toEqual([
			{ level: 1, text: 'Plan', slug: 'plan' },
			{ level: 2, text: 'Next steps', slug: 'next-steps' },
			{ level: 3, text: 'Linked code', slug: 'linked-code' },
			{ level: 2, text: 'Next steps', slug: 'next-steps-2' },
		]);
	});
});
