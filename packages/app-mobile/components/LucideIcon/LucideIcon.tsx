// Fork: draws a Lucide line icon (lucideIcons.ts) in place of an icon font glyph, for the Workbench themes.
// It takes the same text style as the glyph: fontSize sets the size and color the stroke colour.

import * as React from 'react';
import { StyleProp, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Polygon, Polyline, Rect } from 'react-native-svg';
import { LucideIconNode } from './lucideIcons';

interface Props {
	nodes: LucideIconNode;
	style: StyleProp<TextStyle>;
	accessibilityLabel: string|null;
}

const shapes: Record<string, React.ElementType> = {
	circle: Circle, ellipse: Ellipse, line: Line, path: Path, polygon: Polygon, polyline: Polyline, rect: Rect,
};

// Text properties don't apply to the drawing, but layout properties such as margins do. "flex" is also
// dropped: on web, the "flex: 0" that some glyph styles have collapses the drawing to no width.
const droppedKeys = ['flex', 'color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textAlignVertical', 'textDecorationLine'];

// Icon fonts are sized so their glyphs nearly fill the font size, while Lucide icons are designed at 24
// with room around them. 0.8 makes a 30px header glyph a standard 24px icon.
const sizeRatio = 0.8;
// Draw lines 1.5px wide at any size, which looks lighter than Lucide's default stroke.
const strokePx = 1.5;

const LucideIcon: React.FC<Props> = ({ nodes, style, accessibilityLabel }) => {
	const flatStyle = StyleSheet.flatten(style) ?? {};
	const size = Math.round((flatStyle.fontSize ?? 30) * sizeRatio);
	const viewStyle = Object.fromEntries(Object.entries(flatStyle).filter(([key]) => !droppedKeys.includes(key))) as ViewStyle;
	const hidden = accessibilityLabel === null;

	return (
		<Svg
			width={size}
			height={size}
			viewBox='0 0 24 24'
			fill='none'
			stroke={typeof flatStyle.color === 'string' ? flatStyle.color : 'black'}
			strokeWidth={strokePx * 24 / size}
			strokeLinecap='round'
			strokeLinejoin='round'
			style={[viewStyle, { flexShrink: 0, width: size, height: size }]}
			accessibilityLabel={accessibilityLabel ?? undefined}
			accessibilityRole={hidden ? undefined : 'image'}
			importantForAccessibility={hidden ? 'no-hide-descendants' : 'yes'}
			accessibilityElementsHidden={hidden}
			aria-hidden={hidden}
		>
			{nodes.map(([tag, attrs], index) => {
				const Shape = shapes[tag];
				return Shape ? <Shape key={`${tag}-${index}`} {...attrs}/> : null;
			})}
		</Svg>
	);
};

export default LucideIcon;
