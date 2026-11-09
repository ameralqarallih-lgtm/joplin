// Fork: converts what the Rich Text editor shows back to the Markdown it came from, where the default rules would
// rewrite or drop it. Works with renderer/MdToHtml/rules/richTextSource.ts.

export interface RichTextMarkdownPlugins {
	footnote: boolean;
	deflist: boolean;
	sub: boolean;
	sup: boolean;
	insert: boolean;
}

interface TurndownRule {
	filter: string | ((node: HTMLElement)=> boolean);
	replacement: (content: string, node: HTMLElement)=> string;
}

export interface TurndownRules {
	addRule(key: string, rule: TurndownRule): void;
}

const hasClass = (node: Element|null, className: string) => !!node?.classList?.contains(className);

const indentFollowingLines = (text: string, indent: string) => text.replace(/\n(?=[^\n])/g, `\n${indent}`);

const normalizeLabel = (label: string) => label.trim().replace(/\s+/g, ' ').toLowerCase();

const definedReferenceLabels = (node: Node) => {
	let root = node;
	while (root.parentNode) root = root.parentNode;
	const labels = new Set<string>();
	const sources: Element[] = [...((root as ParentNode).querySelectorAll?.('.joplin-markdown-source .joplin-source') ?? [])];
	for (const source of sources) {
		for (const match of (source.textContent ?? '').matchAll(/^ {0,3}\[((?:[^\]\\]|\\.)+)\]:/gm)) labels.add(normalizeLabel(match[1]));
	}
	return labels;
};

const isKeptReferenceLink = (node: HTMLElement) => {
	if (node.nodeName !== 'A') return false;
	const label = node.getAttribute('data-joplin-reference-label');
	if (label === null || node.getAttribute('href') !== node.getAttribute('data-joplin-reference-href')) return false;
	return definedReferenceLabels(node).has(normalizeLabel(label));
};

const footnoteNumber = (id: string|null) => /^fn(?:ref)?(\d+)/.exec(id ?? '')?.[1];

const addDelimiterRule = (turndown: TurndownRules, tagName: 'sub'|'sup', delimiter: string) => {
	turndown.addRule(`richText_${tagName}`, {
		filter: node => node.nodeName === tagName.toUpperCase() && !hasClass(node, 'footnote-ref'),
		replacement: content => {
			if (!/^[^\n~^*_`[\]\\<>&]+$/.test(content)) return `<${tagName}>${content}</${tagName}>`;
			return `${delimiter}${content.replace(/ /g, '\\ ')}${delimiter}`;
		},
	});
};

export const addRichTextRules = (turndown: TurndownRules, plugins: RichTextMarkdownPlugins) => {
	if (plugins.sub) addDelimiterRule(turndown, 'sub', '~');
	if (plugins.sup) addDelimiterRule(turndown, 'sup', '^');

	if (plugins.insert) {
		turndown.addRule('richTextInsert', {
			filter: 'ins',
			replacement: content => content.trim() ? `++${content}++` : content,
		});
	}

	if (plugins.deflist) {
		turndown.addRule('richTextDefinitionList', {
			filter: 'dl',
			replacement: content => `\n\n${content.replace(/^\n+|\n+$/g, '')}\n\n`,
		});
		turndown.addRule('richTextDefinitionTerm', {
			filter: node => node.nodeName === 'DT' && node.parentNode?.nodeName === 'DL',
			replacement: (content, node) => `${node.previousElementSibling ? '\n\n' : ''}${content.trim()}\n`,
		});
		turndown.addRule('richTextDefinition', {
			filter: node => node.nodeName === 'DD' && node.parentNode?.nodeName === 'DL',
			replacement: (content, node) => {
				const loose = Array.from(node.childNodes).some(child => child.nodeName === 'P');
				return `${loose ? '\n' : ''}: ${indentFollowingLines(content.trim(), '  ')}\n`;
			},
		});
	}

	if (plugins.footnote) {
		turndown.addRule('richTextFootnoteSeparator', {
			filter: node => node.nodeName === 'HR' && hasClass(node, 'footnotes-sep'),
			replacement: () => '',
		});
		turndown.addRule('richTextFootnoteBackLink', {
			filter: node => node.nodeName === 'A' && hasClass(node, 'footnote-backref'),
			replacement: () => '',
		});
		turndown.addRule('richTextFootnotes', {
			filter: node => (node.nodeName === 'SECTION' && hasClass(node, 'footnotes')) || (node.nodeName === 'OL' && hasClass(node, 'footnotes-list')),
			replacement: content => `\n\n${content.replace(/^\n+|\n+$/g, '')}\n\n`,
		});
		turndown.addRule('richTextFootnote', {
			filter: node => node.nodeName === 'LI' && hasClass(node.parentElement, 'footnotes-list'),
			replacement: (content, node) => {
				const index = Array.prototype.indexOf.call(node.parentElement.children, node);
				const label = node.getAttribute('data-footnote-label') ?? footnoteNumber(node.getAttribute('id')) ?? `${index + 1}`;
				return `[^${label}]: ${indentFollowingLines(content.trim(), '    ')}\n`;
			},
		});
		turndown.addRule('richTextFootnoteReference', {
			filter: node => node.nodeName === 'SUP' && hasClass(node, 'footnote-ref'),
			replacement: (_content, node) => {
				const link = node.querySelector('a');
				const label = node.getAttribute('data-footnote-label') ?? footnoteNumber(link?.getAttribute('href')?.replace(/^#/, '') ?? null) ?? '1';
				return `[^${label}]`;
			},
		});
	}

	turndown.addRule('richTextReferenceLink', {
		filter: isKeptReferenceLink,
		replacement: (content, node) => {
			const label = node.getAttribute('data-joplin-reference-label');
			const style = node.getAttribute('data-joplin-reference-style');
			const sameText = normalizeLabel(content) === normalizeLabel(label);
			if (style === 'collapsed' && sameText) return `[${content}][]`;
			if (style === 'shortcut' && sameText) return `[${content}]`;
			return `[${content}][${label}]`;
		},
	});
};
