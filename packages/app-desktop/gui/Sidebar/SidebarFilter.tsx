// Fork: a box at the top of the sidebar that narrows the notebooks and tags to those matching what is typed.

import * as React from 'react';
import { useCallback } from 'react';
import { _ } from '@joplin/lib/locale';

interface Props {
	value: string;
	onChange: (value: string)=> void;
}

const SidebarFilter: React.FC<Props> = ({ value, onChange }) => {
	const onInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		onChange(event.target.value);
	}, [onChange]);

	const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Escape' && value) {
			event.preventDefault();
			event.stopPropagation();
			onChange('');
		}
	}, [onChange, value]);

	return (
		<div className='sidebar-filter'>
			<input
				type='search'
				value={value}
				onChange={onInputChange}
				onKeyDown={onKeyDown}
				placeholder={_('Filter notebooks and tags')}
				aria-label={_('Filter notebooks and tags')}
				spellCheck={false}
			/>
		</div>
	);
};

export default SidebarFilter;
