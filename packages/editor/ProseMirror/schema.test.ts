import createTestEditorWithSerializer from './testing/createTestEditorWithSerializer';

describe('schema', () => {
	test.each([
		{ html: '<p><s>gone</s></p>', expected: '<p><s>gone</s></p>' },
		{ html: '<p><del>gone</del></p>', expected: '<p><s>gone</s></p>' },
		{ html: '<p><strike>gone</strike></p>', expected: '<p><s>gone</s></p>' },
		{ html: '<p><ins>added</ins></p>', expected: '<p><ins>added</ins></p>' },
		{ html: '<p><i>slanted</i></p>', expected: '<p><em>slanted</em></p>' },
	])('should keep inline formatting from $html', ({ html, expected }) => {
		const { toHtml, normalizeHtml } = createTestEditorWithSerializer({ html, plugins: [] });
		expect(toHtml()).toBe(normalizeHtml(expected));
	});

	test('should keep table cell alignment', () => {
		const html = '<table><tr><th style="text-align: center;">a</th><td align="right">b</td><td>c</td></tr></table>';
		const { view } = createTestEditorWithSerializer({ html, plugins: [] });
		const cells = view.dom.querySelectorAll<HTMLElement>('th, td');
		expect([...cells].map(cell => cell.style.textAlign)).toEqual(['center', 'right', '']);
	});
});
