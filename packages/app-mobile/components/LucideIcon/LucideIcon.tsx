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

// Text properties don't apply to the drawing, but layout properties such as margins do.
const textOnlyKeys = ['color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textAlignVertical', 'textDecorationLine'];

const LucideIcon: React.FC<Props> = ({ nodes, style, accessibilityLabel }) => {
	const flatStyle = StyleSheet.flatten(style) ?? {};
	const size = flatStyle.fontSize ?? 24;
	const viewStyle = Object.fromEntries(Object.entries(flatStyle).filter(([key]) => !textOnlyKeys.includes(key))) as ViewStyle;
	const hidden = accessibilityLabel === null;

	return (
		<Svg
			width={size}
			height={size}
			viewBox='0 0 24 24'
			fill='none'
			stroke={typeof flatStyle.color === 'string' ? flatStyle.color : 'black'}
			strokeWidth={2}
			strokeLinecap='round'
			strokeLinejoin='round'
			style={viewStyle}
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
