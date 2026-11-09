// Fork: when rendering for the Rich Text editor (the richTextEditor option), renders Markdown that the editor would
// otherwise lose or rewrite in a form that converts back unchanged (lib/utils/richTextTurndownRules.ts):
// - Reference and abbreviation definitions, HTML comments and [toc] keep their source in joplin-editable blocks.
// - Reference links and footnotes carry their labels.
// - A table whose header cells are all empty has no header row, so that the editor doesn't show an empty one.

import { RendererTheme } from '../../types';
import type * as MarkdownIt from 'markdown-it';
import type Token = require('markdown-it/lib/token');
import type Renderer = require('markdown-it/lib/renderer');
import type StateCore = require('markdown-it/lib/rules_core/state_core');
import type StateBlock = require('markdown-it/lib/rules_block/state_block');
import type StateInline = require('markdown-it/lib/rules_inline/state_inline');

type BlockRule = (state: StateBlock, startLine: number, endLine: number, silent: boolean)=> boolean;
type InlineRule = (state: StateInline, silent: boolean)=> boolean;

// markdown-it doesn't type the rule list, which is needed to wrap a rule while keeping its "alt" chains.
interface RulerInternals<T> {
	__rules__: { name: string; fn: T; alt: string[] }[];
	at(name: string, fn: T, options?: { alt?: string[] }): void;
}

export interface ReferenceLinkInfo {
	label: string;
	style: 'full' | 'collapsed' | 'shortcut';
}

const sourceTokenType = 'joplin_markdown_source';
const inlineSourceTokenType = 'joplin_markdown_source_inline';
export const markdownSourceLanguage = 'joplin-markdown';

const wrapped = new WeakSet<object>();

const wrapRule = <T extends object>(ruler: RulerInternals<T>, name: string, wrap: (original: T)=> T) => {
	const rule = ruler.__rules__.find(r => r.name === name);
	if (!rule || wrapped.has(rule.fn)) return;
	const fn = wrap(rule.fn);
	wrapped.add(fn);
	ruler.at(name, fn, { alt: rule.alt });
};

const wrapRendererRule = (renderer: Renderer, name: string, wrap: (original: Renderer.RenderRule)=> Renderer.RenderRule) => {
	const original = renderer.rules[name];
	if (!original || wrapped.has(original)) return;
	const fn = wrap(original);
	wrapped.add(fn);
	renderer.rules[name] = fn;
};

export const referenceLinkInfo = (source: string): ReferenceLinkInfo|null => {
	if (!source.startsWith('[') || !source.endsWith(']')) return null;
	const labelMatch = /\]\[((?:[^[\]\\]|\\.)*)\]$/.exec(source);
	if (!labelMatch) return { label: source.slice(1, -1), style: 'shortcut' };
	if (!labelMatch[1]) return { label: source.slice(1, labelMatch.index), style: 'collapsed' };
	return { label: labelMatch[1], style: 'full' };
};

const isSingleComment = (html: string) => /^<!--(?:(?!-->)[\s\S])*-->$/.test(html);

const removeEmptyTableHeaders = (state: StateCore) => {
	const tokens = state.tokens;
	for (let i = 0; i < tokens.length; i++) {
		if (tokens[i].type !== 'thead_open') continue;
		const closeIndex = tokens.findIndex((t, j) => j > i && t.type === 'thead_close');
		const cells = tokens.slice(i, closeIndex).filter(t => t.type === 'inline');
		if (closeIndex > i && cells.every(t => !t.content.trim())) tokens.splice(i, closeIndex - i + 1);
	}
};

const plugin = (markdownIt: MarkdownIt, options: { richTextEditor?: boolean }) => {
	if (!options.richTextEditor) return;
	markdownIt.core.ruler.push('joplin_empty_table_headers', removeEmptyTableHeaders);

	const escapeHtml = markdownIt.utils.escapeHtml;

	const sourceElement = (tagName: string, source: string) =>
		`<${tagName} class="joplin-source" hidden data-joplin-language="${markdownSourceLanguage}" data-joplin-source-open="" data-joplin-source-close="">${escapeHtml(source)}</${tagName}>`;

	markdownIt.renderer.rules[sourceTokenType] = (tokens: Token[], idx: number) => {
		const source = tokens[idx].content;
		return `<div class="joplin-editable joplin-markdown-source">${sourceElement('pre', source)}<pre class="joplin-markdown-source-preview">${escapeHtml(source)}</pre></div>\n`;
	};

	markdownIt.renderer.rules[inlineSourceTokenType] = (tokens: Token[], idx: number) => {
		const source = tokens[idx].content;
		return `<span class="joplin-editable joplin-markdown-source">${sourceElement('span', source)}<span class="joplin-markdown-source-preview">${escapeHtml(source)}</span></span>`;
	};

	const wrapDefinitionRule = (original: BlockRule): BlockRule => (state, startLine, endLine, silent) => {
		const found = original(state, startLine, endLine, silent);
		if (found && !silent) {
			const token = state.push(sourceTokenType, '', 0);
			token.content = state.getLines(startLine, state.line, state.blkIndent, false).replace(/\n+$/, '');
			token.map = [startLine, state.line];
			token.block = true;
		}
		return found;
	};

	const wrapLinkRule = (original: InlineRule): InlineRule => (state, silent) => {
		const start = state.pos;
		const tokenCount = state.tokens.length;
		const found = original(state, silent);
		if (found && !silent) {
			const info = referenceLinkInfo(state.src.slice(start, state.pos));
			const linkOpen = info ? state.tokens.slice(tokenCount).find(t => t.type === 'link_open') : null;
			if (linkOpen) linkOpen.meta = { ...linkOpen.meta, joplinReference: info };
		}
		return found;
	};

	const addAttributes = (html: string, tagName: string, attributes: string) => html.replace(new RegExp(`^<${tagName}\\b`), `<${tagName} ${attributes}`);

	// Plugins such as footnotes and [toc] are loaded after this rule, so their rules are wrapped when rendering starts.
	markdownIt.core.ruler.before('block', 'joplin_rich_text_source_setup', () => {
		wrapRule(markdownIt.block.ruler as unknown as RulerInternals<BlockRule>, 'reference', wrapDefinitionRule);
		wrapRule(markdownIt.block.ruler as unknown as RulerInternals<BlockRule>, 'abbr_def', wrapDefinitionRule);
		wrapRule(markdownIt.inline.ruler as unknown as RulerInternals<InlineRule>, 'link', wrapLinkRule);

		const renderer = markdownIt.renderer;
		if (!renderer.rules.link_open) renderer.rules.link_open = (tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options);
		wrapRendererRule(renderer, 'link_open', original => (tokens, idx, options, env, self) => {
			const html = original(tokens, idx, options, env, self);
			const reference = tokens[idx].meta?.joplinReference as ReferenceLinkInfo;
			if (!reference) return html;
			const href = /\shref=(["'])(.*?)\1/.exec(html);
			const attributes = [`data-joplin-reference-label="${escapeHtml(reference.label)}"`, `data-joplin-reference-style="${reference.style}"`];
			if (href) attributes.push(`data-joplin-reference-href=${href[1]}${href[2]}${href[1]}`);
			return addAttributes(html, 'a', attributes.join(' '));
		});

		const labelled = (tagName: string) => (original: Renderer.RenderRule): Renderer.RenderRule => (tokens, idx, options, env, self) => {
			const html = original(tokens, idx, options, env, self);
			const label = tokens[idx].meta?.label;
			return typeof label === 'string' ? addAttributes(html, tagName, `data-footnote-label="${escapeHtml(label)}"`) : html;
		};
		wrapRendererRule(renderer, 'footnote_ref', labelled('sup'));
		wrapRendererRule(renderer, 'footnote_open', labelled('li'));

		wrapRendererRule(renderer, 'tocOpen', original => (tokens, idx, options, env, self) => {
			const source = tokens[idx].meta?.joplinSource;
			const html = original(tokens, idx, options, env, self);
			return typeof source === 'string' ? `<div class="joplin-editable joplin-toc">${sourceElement('pre', source)}${html}` : html;
		});
		wrapRendererRule(renderer, 'tocClose', original => (tokens, idx, options, env, self) => {
			const html = original(tokens, idx, options, env, self);
			return typeof tokens[idx - 2]?.meta?.joplinSource === 'string' ? `${html}</div>` : html;
		});
	});

	markdownIt.core.ruler.push('joplin_rich_text_source', (state: StateCore) => {
		const tokens = state.tokens;
		let sourceLines: string[] = null;
		const linesOf = (map: [number, number]) => {
			sourceLines ??= state.src.split('\n');
			return sourceLines.slice(map[0], map[1]).join('\n').trim();
		};

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			if (token.type === 'html_block' && isSingleComment(token.content.trim())) {
				token.type = sourceTokenType;
				token.content = token.content.trim();
			} else if (token.type === 'inline') {
				for (const child of token.children ?? []) {
					if (child.type === 'html_inline' && isSingleComment(child.content)) child.type = inlineSourceTokenType;
				}
			} else if (token.type === 'tocOpen' && token.map) {
				token.meta = { ...token.meta, joplinSource: linesOf(token.map) };
			}
		}

		// Definitions on consecutive lines become one block, so that no blank lines are added between them.
		for (let i = tokens.length - 1; i > 0; i--) {
			const previous = tokens[i - 1];
			const token = tokens[i];
			if (token.type !== sourceTokenType || previous.type !== sourceTokenType) continue;
			if (!previous.map || !token.map || previous.map[1] !== token.map[0]) continue;
			previous.content = `${previous.content}\n${token.content}`;
			previous.map = [previous.map[0], token.map[1]];
			tokens.splice(i, 1);
		}
	});
};

const assets = (theme: RendererTheme) => [
	{
		inline: true,
		mime: 'text/css',
		text: `
			.joplin-markdown-source {
				display: none;
			}

			.mce-content-body .joplin-markdown-source {
				display: block;
				margin: 0 0 .6em;
			}

			.mce-content-body span.joplin-markdown-source {
				display: inline;
				margin: 0;
			}

			.joplin-markdown-source-preview {
				display: block;
				margin: 0;
				padding: 2px 8px;
				border: 1px dashed ${theme.dividerColor ?? 'currentColor'};
				border-radius: 4px;
				background: none;
				font-family: monospace;
				font-size: .85em;
				white-space: pre-wrap;
				opacity: .7;
			}

			span.joplin-markdown-source-preview {
				display: inline;
				padding: 0 4px;
			}
		`,
	},
];

export default {
	plugin,
	assets,
};
