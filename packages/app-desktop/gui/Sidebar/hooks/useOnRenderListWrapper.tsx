import * as React from 'react';
import { useCallback } from 'react';
import { _ } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import Setting from '@joplin/lib/models/Setting';
import bridge from '../../../services/bridge';
import { customFolderOrderField } from '@joplin/lib/models/utils/folderOrder';

interface Props {
	selectedIndex: number;
	onKeyDown: React.KeyboardEventHandler;
	allFoldersCollapsed: boolean;
	hasSubFolders: boolean;
}

const onAddFolderButtonClick = () => {
	void CommandService.instance().execute('newFolder');
};

const onToggleAllFolders = (allFoldersCollapsed: boolean) => {
	void CommandService.instance().execute('toggleAllFolders', !allFoldersCollapsed);
};

interface CollapseExpandAllButtonProps {
	allFoldersCollapsed: boolean;
	hasSubFolders: boolean;
}

const CollapseExpandAllButton = (props: CollapseExpandAllButtonProps) => {
	// To allow it to be accessed by accessibility tools, the toggle button
	// is not included in the portion of the list with role='tree'.
	const icon = props.allFoldersCollapsed ? 'far fa-caret-square-right' : 'far fa-caret-square-down';
	const label = props.allFoldersCollapsed ? _('Expand all notebooks') : _('Collapse all notebooks');

	return <button
		onClick={() => onToggleAllFolders(props.allFoldersCollapsed)}
		className={`sidebar-header-button -collapseall ${props.hasSubFolders ? '' : '-disabled'}`}
		title={label}
		disabled={!props.hasSubFolders}
	>
		<i
			aria-label={label}
			role='img'
			className={icon}
		/>
	</button>;
};

const NewFolderButton = () => {
	// To allow it to be accessed by accessibility tools, the new folder button
	// is not included in the portion of the list with role='tree'.
	const label = _('New notebook');

	return <button onClick={onAddFolderButtonClick} className='sidebar-header-button -newfolder' title={label}>
		<i
			aria-label={label}
			role='img'
			className='fas fa-plus'
		/>
	</button>;
};

// Fork: chooses how notebooks are sorted, including the custom order that dragging notebooks sets.
const onSortFoldersButtonClick = () => {
	const Menu = bridge().Menu;
	const MenuItem = bridge().MenuItem;
	const field = Setting.value('folders.sortOrder.field');
	const menu = new Menu();
	const options: Record<string, string> = Setting.enumOptions('folders.sortOrder.field');
	for (const [value, label] of Object.entries(options)) {
		menu.append(new MenuItem({
			label,
			type: 'radio',
			checked: field === value,
			click: () => Setting.setValue('folders.sortOrder.field', value),
		}));
	}
	menu.append(new MenuItem({ type: 'separator' }));
	menu.append(new MenuItem({
		label: Setting.settingMetadata('folders.sortOrder.reverse').label(),
		type: 'checkbox',
		checked: Setting.value('folders.sortOrder.reverse'),
		enabled: field !== customFolderOrderField,
		click: () => Setting.setValue('folders.sortOrder.reverse', !Setting.value('folders.sortOrder.reverse')),
	}));
	menu.popup({ window: bridge().activeWindow() });
};

const SortFoldersButton = () => {
	const label = _('Sort notebooks');
	return <button onClick={onSortFoldersButtonClick} className='sidebar-header-button -sort' title={label}>
		<i
			aria-label={label}
			role='img'
			className='fas fa-sort-amount-down'
		/>
	</button>;
};

const useOnRenderListWrapper = (props: Props) => {
	return useCallback((listItems: React.ReactNode[]) => {
		const listHasValidSelection = props.selectedIndex >= 0;
		const allowContainerFocus = !listHasValidSelection;
		return <>
			<SortFoldersButton/>
			<CollapseExpandAllButton allFoldersCollapsed={props.allFoldersCollapsed} hasSubFolders={props.hasSubFolders}/>
			<NewFolderButton/>
			<div
				role='tree'
				className='sidebar-list-items-wrapper'
				tabIndex={allowContainerFocus ? 0 : undefined}
				onKeyDown={props.onKeyDown}
			>
				{...listItems}
			</div>
		</>;
	}, [props.selectedIndex, props.onKeyDown, props.allFoldersCollapsed, props.hasSubFolders]);
};

export default useOnRenderListWrapper;
