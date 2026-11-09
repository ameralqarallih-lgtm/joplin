import { useMemo } from 'react';
import { FolderListItem, HeaderId, HeaderListItem, ListItem, ListItemType, TagListItem } from '../types';
import { FolderEntity, TagsWithNoteCountEntity } from '@joplin/lib/services/database/types';
import { buildFolderTree, renderFolders, renderTags } from '@joplin/lib/components/shared/side-menu-shared';
import { _ } from '@joplin/lib/locale';
import toggleHeader from './utils/toggleHeader';
import Folder from '@joplin/lib/models/Folder';
import Tag from '@joplin/lib/models/Tag';
import { filterFolders, filterTags } from '../utils/filterSidebarData';

interface Props {
	tags: TagsWithNoteCountEntity[];
	folders: FolderEntity[];
	collapsedFolderIds: string[];
	folderHeaderIsExpanded: boolean;
	tagHeaderIsExpanded: boolean;
	// Fork: text from the sidebar filter box.
	filter?: string;
}

const useSidebarListData = (props: Props): ListItem[] => {
	const filter = props.filter ?? '';
	const isFiltering = !!filter.trim();

	const tagItems = useMemo(() => {
		return renderTags<ListItem>(filterTags(props.tags, filter), (tag): TagListItem => {
			return {
				kind: ListItemType.Tag,
				label: Tag.displayTitle(tag),
				tag,
				key: tag.id,
				depth: 1,
				hasChildren: false,
			};
		});
	}, [props.tags, filter]);

	const folderTree = useMemo(() => {
		return buildFolderTree(filterFolders(props.folders, filter));
	}, [props.folders, filter]);

	const folderItems = useMemo(() => {
		const renderProps = {
			folderTree,
			// Show every match while filtering, even inside collapsed notebooks.
			collapsedFolderIds: isFiltering ? [] : props.collapsedFolderIds,
		};
		return renderFolders<ListItem>(renderProps, (folder, hasChildren, depth): FolderListItem => {
			return {
				kind: ListItemType.Folder,
				label: Folder.displayTitle(folder),
				folder,
				hasChildren,
				// The toplevel headers have depth 1, so the toplevel notebook needs
				// depth 2.
				depth: depth + 1,
				key: folder.id,
			};
		});
	}, [folderTree, props.collapsedFolderIds, isFiltering]);

	return useMemo(() => {
		const folderHeaderIsExpanded = props.folderHeaderIsExpanded || isFiltering;
		const tagHeaderIsExpanded = props.tagHeaderIsExpanded || isFiltering;
		const foldersHeader: HeaderListItem = {
			kind: ListItemType.Header,
			label: _('Notebooks'),
			iconName: 'icon-notebooks',
			expanded: folderHeaderIsExpanded,
			id: HeaderId.FolderHeader,
			key: HeaderId.FolderHeader,
			onClick: toggleHeader,
			extraProps: {
				['data-folder-id']: '',
			},
			supportsFolderDrop: true,
			depth: 1,
			hasChildren: folderItems.items.length > 0,
		};
		const foldersSectionContent: ListItem[] = folderHeaderIsExpanded ? [
			{ kind: ListItemType.AllNotes, label: _('All notes'), key: 'all-notes', depth: 2, hasChildren: false },
			...folderItems.items,
			{ kind: ListItemType.Spacer, label: '', key: 'after-folders-spacer', depth: 1, hasChildren: false },
		] : [];

		const tagsHeader: HeaderListItem = {
			kind: ListItemType.Header,
			label: _('Tags'),
			iconName: 'icon-tags',
			expanded: tagHeaderIsExpanded,
			id: HeaderId.TagHeader,
			key: HeaderId.TagHeader,
			onClick: toggleHeader,
			extraProps: { },
			supportsFolderDrop: false,
			depth: 1,
			hasChildren: tagItems.items.length > 0,
		};
		const tagsSectionContent: ListItem[] = tagHeaderIsExpanded ? tagItems.items : [];

		const items: ListItem[] = [
			foldersHeader,
			...foldersSectionContent,
			tagsHeader,
			...tagsSectionContent,
		];
		return items;
	}, [tagItems, folderItems, props.folderHeaderIsExpanded, props.tagHeaderIsExpanded, isFiltering]);
};

export default useSidebarListData;
