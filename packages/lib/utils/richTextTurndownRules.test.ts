import MdToHtml from '@joplin/renderer/MdToHtml';
import HtmlToMd from '../HtmlToMd';

const plugins = { footnote: true, deflist: true, sub: true, sup: true, insert: true };

const renderForRichText = async (markdown: string) => {
	const pluginOptions: Record<string, { enabled: boolean }> = { softbreaks: { enabled: false } };
	for (const name of ['sub', 'sup', 'insert', 'deflist', 'abbr', 'footnote', 'toc']) pluginOptions[name] = { enabled: true };
	const mdToHtml = new MdToHtml({ pluginOptions });
	const result = await mdToHtml.render(markdown, {}, { bodyOnly: true, plugins: { checkbox: { checkboxRenderingType: 2 }, link_open: { linkRenderingType: 2 }, richTextSource: { richTextEditor: true } } });
	return result.html;
};

const toMarkdown = (html: string) => new HtmlToMd().parse(html, { richTextMarkdownPlugins: plugins });

describe('richTextTurndownRules', () => {

	test.each([
		['footnotes', 'First[^note] and second[^2] and again[^note].\n\n[^note]: Named note.\n[^2]: Numbered note.'],
		['multi-paragraph footnote', 'Text[^long].\n\n[^long]: First paragraph.\n\n    Second paragraph.'],
		['table of contents', '[toc]\n\n# One\n\n## Two'],
		['definition list', 'Term\n: Definition'],
		['abbreviation', 'The HTML spec\n\n*[HTML]: Hyper Text Markup Language'],
		['sub, sup and insert', 'H~2~O, x^2^, a~b c~ and ++new++'],
		['mixed list', '- [ ] task\n- bullet\n- [x] done'],
		['nested mixed list', '- [ ] task\n    - plain\n    - [x] sub task'],
		['reference links', 'See [the site][site], [docs][] and [docs].\n\n[site]: https://example.com "Example"\n[docs]: https://example.com/docs\n\nMore text.'],
		['HTML comments', 'Before <!-- inline --> after\n\n<!--\nline one\nline two\n-->\n\nAfter'],
		['table without a header', '|     |     |\n| --- | --- |\n| a   | b   |'],
	])('should keep %s unchanged', async (_name, markdown) => {
		expect(toMarkdown(await renderForRichText(markdown))).toBe(markdown);
	});

	test('should render a table whose header cells are empty without a header row', async () => {
		const html = await renderForRichText('|     |     |\n| --- | --- |\n| a   | b   |');
		expect(html).not.toContain('<thead');
	});

	test('should write a reference link inline when its address was changed', async () => {
		const html = (await renderForRichText('See [docs].\n\n[docs]: https://example.com/docs')).replace(/ href='https:\/\/example.com\/docs'/, ' href=\'https://example.com/other\'');
		expect(toMarkdown(html)).toMatch(/^See \[docs\]\(https:\/\/example\.com\/other\b/);
	});

	test('should write a reference link inline when its definition was deleted', async () => {
		const html = (await renderForRichText('See [docs].\n\n[docs]: https://example.com/docs')).replace(/<div class="joplin-editable joplin-markdown-source">[\s\S]*?<\/div>/, '');
		expect(toMarkdown(html)).toBe('See [docs](https://example.com/docs).');
	});
});
