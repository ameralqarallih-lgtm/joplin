// Fork: a theme colour with transparency, for tints. React Native has no color-mix(), but takes 8-digit hex colours.

const withAlpha = (color: string, alpha: number) => {
	if (!/^#[0-9a-f]{6}$/i.test(color)) return color;
	const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
	return `${color}${alphaHex}`;
};

export default withAlpha;
