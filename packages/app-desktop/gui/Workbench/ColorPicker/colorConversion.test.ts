import { hexToHsv, hsvToHex } from './colorConversion';

describe('colorConversion', () => {
	test.each([
		['#ff0000', { h: 0, s: 1, v: 1 }],
		['#00ff00', { h: 120, s: 1, v: 1 }],
		['#0000ff', { h: 240, s: 1, v: 1 }],
		['#ffffff', { h: 0, s: 0, v: 1 }],
		['#000000', { h: 0, s: 0, v: 0 }],
	])('should convert %s to HSV and back', (hex, hsv) => {
		expect(hexToHsv(hex)).toEqual(hsv);
		expect(hsvToHex(hsv)).toBe(hex);
	});

	test.each(['#3e63dd', '#e2a336', '#8b8d98', '#12a594'])('should round-trip %s', (hex) => {
		expect(hsvToHex(hexToHsv(hex))).toBe(hex);
	});
});
