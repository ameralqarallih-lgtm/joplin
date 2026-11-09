// Fork: the headings of a Markdown note, for the Workbench outline. The slugs match the anchors the renderer
// gives headings (markdown-it-anchor with uslug, see renderer/MdToHtml.ts), so they work with scrollToHash.

import uslug from '@joplin/fork-uslug/lib/uslug';

export interface NoteHeading {
	level: number;
	text: string;
	slug: string;
}

// The text markdown-it-anchor builds the slug from: the heading's text, without formatting or images.
const headingText = (markdown: string) => {
	return markdown
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/(\*\*|__|\*|_|~~|`)/g, '')
		.trim();
};

const noteHeadings = (body: string): NoteHeading[] => {
	const output: NoteHeading[] = [];
	const usedSlugs = new Set<string>();
	let openFence = '';

	for (const line of body.split('\n')) {
		const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/);
		if (fence) {
			if (!openFence) {
				openFence = fence[1];
			} else if (fence[1][0] === openFence[0] && fence[1].length >= openFence.length) {
				openFence = '';
			}
			continue;
		}
		if (openFence) continue;

		const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*?)(\s+#+)?\s*$/);
		if (!heading) continue;
		const text = headingText(heading[2]);
		if (!text) continue;

		const baseSlug = uslug(text);
		let slug = baseSlug;
		for (let index = 2; usedSlugs.has(slug); index++) slug = `${baseSlug}-${index}`;
		usedSlugs.add(slug);

		output.push({ level: heading[1].length, text, slug });
	}

	return output;
};

export default noteHeadings;
