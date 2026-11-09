// Fork: chooses a notebook colour from the presets, or any colour from a saturation and brightness area, a hue
// slider and a hex field. An empty value means no colour.

import * as React from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { _ } from '@joplin/lib/locale';
import { folderColorPresets, isValidFolderColor } from '@joplin/lib/models/utils/folderColor';
import { Hsv, hexToHsv, hsvToHex } from './colorConversion';

interface Props {
	value: string;
	onChange: (value: string)=> void;
}

const defaultCustomColor = '#3e63dd';
const clamp = (value: number) => Math.min(1, Math.max(0, value));

const ColorPicker: React.FC<Props> = props => {
	const { value, onChange } = props;
	const isPreset = !value || folderColorPresets.some(preset => preset.value === value);
	const [customOpen, setCustomOpen] = useState(!isPreset);
	// Kept apart from the value so that the hue doesn't jump to red when the colour reaches grey or black.
	const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(isValidFolderColor(value) ? value : defaultCustomColor));
	const [hexText, setHexText] = useState(value || defaultCustomColor);
	const areaRef = useRef<HTMLDivElement>(null);
	const hexFieldId = useId();

	useEffect(() => {
		if (!isValidFolderColor(value)) return;
		setHexText(value);
		setHsv(current => hsvToHex(current) === value ? current : hexToHsv(value));
	}, [value]);

	const applyHsv = useCallback((newHsv: Hsv) => {
		setHsv(newHsv);
		onChange(hsvToHex(newHsv));
	}, [onChange]);

	const onCustomClick = useCallback(() => {
		setCustomOpen(true);
		onChange(hsvToHex(hsv));
	}, [hsv, onChange]);

	const updateFromPointer = useCallback((event: React.PointerEvent) => {
		const rect = areaRef.current.getBoundingClientRect();
		applyHsv({
			h: hsv.h,
			s: clamp((event.clientX - rect.left) / rect.width),
			v: 1 - clamp((event.clientY - rect.top) / rect.height),
		});
	}, [hsv.h, applyHsv]);

	const onAreaPointerDown = useCallback((event: React.PointerEvent) => {
		event.currentTarget.setPointerCapture(event.pointerId);
		updateFromPointer(event);
	}, [updateFromPointer]);

	const onAreaPointerMove = useCallback((event: React.PointerEvent) => {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) updateFromPointer(event);
	}, [updateFromPointer]);

	const onAreaKeyDown = useCallback((event: React.KeyboardEvent) => {
		const step = event.shiftKey ? 0.1 : 0.02;
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, step],
			ArrowDown: [0, -step],
		};
		const move = moves[event.key];
		if (!move) return;
		event.preventDefault();
		applyHsv({ h: hsv.h, s: clamp(hsv.s + move[0]), v: clamp(hsv.v + move[1]) });
	}, [hsv, applyHsv]);

	const onHueChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		applyHsv({ ...hsv, h: Number(event.target.value) });
	}, [hsv, applyHsv]);

	const onHexChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const text = event.target.value.trim();
		setHexText(text);
		const hex = text.startsWith('#') ? text : `#${text}`;
		if (isValidFolderColor(hex)) onChange(hex.toLowerCase());
	}, [onChange]);

	const swatch = (color: string, label: string) => {
		const selected = color === value && (color === '' || !customOpen);
		return <button
			key={color || 'none'}
			type='button'
			role='radio'
			aria-checked={selected}
			aria-label={label}
			title={label}
			className={`swatch ${color ? '' : '-none'} ${selected ? '-selected' : ''}`}
			style={color ? { '--swatch-color': color } as React.CSSProperties : undefined}
			onClick={() => {
				setCustomOpen(false);
				onChange(color);
			}}
		/>;
	};

	const customSelected = customOpen && !!value;

	return <div className='color-picker'>
		<div className='swatches' role='radiogroup' aria-label={_('Colour')}>
			{swatch('', _('No colour'))}
			{folderColorPresets.map(preset => swatch(preset.value, preset.label()))}
			<button
				type='button'
				role='radio'
				aria-checked={customSelected}
				aria-label={_('Custom colour')}
				title={_('Custom colour')}
				className={`swatch -custom ${customSelected ? '-selected' : ''}`}
				style={customSelected ? { '--swatch-color': value } as React.CSSProperties : undefined}
				onClick={onCustomClick}
			/>
		</div>
		{customOpen ? <div className='custom'>
			<div
				ref={areaRef}
				className='area'
				style={{ '--hue': hsv.h } as React.CSSProperties}
				role='slider'
				tabIndex={0}
				aria-label={_('Saturation and brightness')}
				aria-valuetext={_('Saturation %d%%, brightness %d%%', Math.round(hsv.s * 100), Math.round(hsv.v * 100))}
				onPointerDown={onAreaPointerDown}
				onPointerMove={onAreaPointerMove}
				onKeyDown={onAreaKeyDown}
			>
				<div className='thumb' style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hsvToHex(hsv) }}/>
			</div>
			<input
				className='hue'
				type='range'
				min={0}
				max={359}
				value={Math.round(hsv.h)}
				aria-label={_('Hue')}
				onChange={onHueChange}
			/>
			<div className='hex-row'>
				<span className='preview' style={{ backgroundColor: isValidFolderColor(value) ? value : 'transparent' }}/>
				<label className='label' htmlFor={hexFieldId}>{_('Hex')}</label>
				<input id={hexFieldId} className='hex' type='text' spellCheck={false} maxLength={7} value={hexText} onChange={onHexChange}/>
			</div>
		</div> : null}
	</div>;
};

export default ColorPicker;
