// Fork: plain-text preview of a note body for the detailed note list (detailedListRenderer.ts).

const entities: Record<string, string> = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': '\'' };

const lineToText = (line: string) => {
	return line
		.replace(/<[^>]*>/g, ' ')
		.replace(/&(nbsp|amp|lt|gt|quot|#39);/g, entity => entities[entity])
		.replace(/^\s*(#{1,6}\s+|>\s*)+/, '')
		.replace(/^\s*([-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?/, '')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/(\*\*|__|~~|==|\+\+)(\S(?:.*?\S)?)\1/g, '$2')
		.replace(/`/g, '')
		.replace(/(^|\s)\*(\S[^*]*)\*/g, '$1$2')
		.replace(/^\s*\|/, '')
		.replace(/\|\s*$/, '')
		.replace(/\s*\|\s*/g, ' · ')
		.trim();
};

const isSkippedLine = (line: string) => {
	return /^\s*(```|~~~)/.test(line) || /^\s*([-*_]\s*){3,}$/.test(line) || /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
};

export default (body: string, title: string, maxLength = 160) => {
	if (!body) return '';

	// Notes can be very long, and the preview only needs the beginning.
	let lines = body.slice(0, 3000).split('\n');

	if (lines[0]?.trim() === '---') {
		const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
		if (end > 0) lines = lines.slice(end + 1);
	}

	const texts = lines.filter(line => !isSkippedLine(line)).map(lineToText).filter(text => !!text);

	// Notes often repeat their title as a first heading.
	if (texts.length && texts[0].toLowerCase() === title.trim().toLowerCase()) texts.shift();

	const text = texts.join(' ').replace(/\s+/g, ' ');
	return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
};
