import noteExcerpt from './noteExcerpt';

describe('noteExcerpt', () => {
	test.each([
		['# Roadmap\n\nStart **here**, then the look.', 'Roadmap', 'Start here, then the look.'],
		['- [x] Fork CI\n- [ ] Themes\n1. One', '', 'Fork CI Themes One'],
		['See [the docs](https://example.com) ![logo](:/abc123) and `code`', '', 'See the docs and code'],
		['```js\nconst a = 1;\n```\n---\n> Quoted *text*', '', 'const a = 1; Quoted text'],
		['| Phase | Status |\n| :--- | :---: |\n| 0 | Done |', '', 'Phase · Status 0 · Done'],
		['---\ntitle: Front matter\n---\nBody text', '', 'Body text'],
		['<p>Clipped&nbsp;<b>page</b> &amp; more</p>', '', 'Clipped page & more'],
		['Keeps snake_case_names, C++ and a == b', '', 'Keeps snake_case_names, C++ and a == b'],
		['~~old~~ ==marked== ++added++ __strong__', '', 'old marked added strong'],
		['', 'Empty', ''],
	])('should make a plain text excerpt of %j', (body, title, expected) => {
		expect(noteExcerpt(body, title)).toBe(expected);
	});

	test('should shorten long text', () => {
		const excerpt = noteExcerpt('word '.repeat(100), '', 20);
		expect(excerpt).toBe('word word word word…');
	});
});
