// Hue in degrees (0 to 360), saturation and value from 0 to 1.
export interface Hsv {
	h: number;
	s: number;
	v: number;
}

export const hexToHsv = (hex: string): Hsv => {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const delta = max - Math.min(r, g, b);

	let h = 0;
	if (delta) {
		if (max === r) h = ((g - b) / delta) % 6;
		else if (max === g) h = (b - r) / delta + 2;
		else h = (r - g) / delta + 4;
	}
	h = (h * 60 + 360) % 360;

	return { h, s: max ? delta / max : 0, v: max };
};

export const hsvToHex = ({ h, s, v }: Hsv) => {
	const channel = (n: number) => {
		const k = (n + h / 60) % 6;
		const value = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
		return Math.round(value * 255).toString(16).padStart(2, '0');
	};
	return `#${channel(5)}${channel(3)}${channel(1)}`;
};
