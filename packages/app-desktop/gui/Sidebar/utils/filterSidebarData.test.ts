import { filterFolders, filterTags } from './filterSidebarData';

const folders = [
	{ id: 'projects', title: 'Projects', parent_id: '' },
	{ id: 'fork', title: 'Joplin fork', parent_id: 'projects' },
	{ id: 'resume', title: 'Résumé', parent_id: 'fork' },
	{ id: 'home', title: 'Home', parent_id: '' },
];

describe('filterSidebarData', () => {
	test.each([
		['', ['projects', 'fork', 'resume', 'home']],
		['FORK', ['projects', 'fork']],
		['resume', ['projects', 'fork', 'resume']],
		['  home ', ['home']],
		['nothing', []],
	])('should keep notebooks matching %j and their parents', (filter, expectedIds) => {
		expect(filterFolders(folders, filter).map(folder => folder.id)).toEqual(expectedIds);
	});

	test('should keep matching tags', () => {
		const tags = [{ id: '1', title: 'plan', note_count: 1 }, { id: '2', title: 'server', note_count: 2 }];
		expect(filterTags(tags, 'Serv').map(tag => tag.id)).toEqual(['2']);
	});
});
