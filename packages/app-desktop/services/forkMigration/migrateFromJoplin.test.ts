import { mkdirp, pathExists, readJson, writeFile, writeJson } from 'fs-extra';
import { join } from 'path';
import { DatabaseDriverNode } from '@joplin/lib/database-driver-node';
import Setting from '@joplin/lib/models/Setting';
import { createTempDir } from '@joplin/lib/testing/test-utils';
import { copyJoplinProfile, shouldOfferJoplinMigration } from './migrateFromJoplin';

const makeJoplinProfile = async (dir: string) => {
	await mkdirp(join(dir, 'resources'));
	await writeFile(join(dir, 'resources', 'image.png'), 'image');
	await writeFile(join(dir, 'lock'), '');
	await writeFile(join(dir, 'log.txt'), 'log');
	await writeJson(join(dir, 'settings.json'), { 'sync.target': 9, theme: Setting.THEME_DRACULA, preferredDarkTheme: Setting.THEME_NORD });

	const db = new DatabaseDriverNode();
	await db.open({ name: join(dir, 'database.sqlite') });
	await db.exec('CREATE TABLE settings (key TEXT, value TEXT)');
	await db.exec('INSERT INTO settings VALUES (\'clientId\', \'joplin-client\'), (\'sync.9.path\', \'https://example.com\')');
	await db.exec('CREATE TABLE notes (id TEXT)');
	await db.exec('INSERT INTO notes VALUES (\'note1\'), (\'note2\')');
	await db.close();
};

describe('migrateFromJoplin', () => {
	test('should only offer to copy into a new profile of a renamed build', async () => {
		const joplin = await createTempDir();
		const fresh = await createTempDir();
		await makeJoplinProfile(joplin);

		expect(await shouldOfferJoplinMigration(fresh, joplin, false)).toBe(true);
		expect(await shouldOfferJoplinMigration(fresh, joplin, true)).toBe(false);
		expect(await shouldOfferJoplinMigration(joplin, joplin, false)).toBe(false);
		expect(await shouldOfferJoplinMigration(joplin, fresh, false)).toBe(false);
	});

	test('should copy the notes and settings as a new device, leaving Joplin as it was', async () => {
		const joplin = await createTempDir();
		const target = await createTempDir();
		await makeJoplinProfile(joplin);

		expect(await copyJoplinProfile(joplin, target)).toEqual({ hadSyncTarget: true });

		expect(await pathExists(join(target, 'resources', 'image.png'))).toBe(true);
		expect(await pathExists(join(target, 'lock'))).toBe(false);
		expect(await pathExists(join(target, 'log.txt'))).toBe(false);
		expect(await readJson(join(target, 'settings.json'))).toEqual({ 'sync.target': 9, theme: Setting.THEME_WORKBENCH_DARK });

		const db = new DatabaseDriverNode();
		await db.open({ name: join(target, 'database.sqlite') });
		expect(await db.selectAll('SELECT id FROM notes')).toEqual([{ id: 'note1' }, { id: 'note2' }]);
		expect(await db.selectAll('SELECT key FROM settings')).toEqual([{ key: 'sync.9.path' }]);
		await db.close();

		const joplinDb = new DatabaseDriverNode();
		await joplinDb.open({ name: join(joplin, 'database.sqlite') });
		expect(await joplinDb.selectOne('SELECT value FROM settings WHERE key = \'clientId\'')).toEqual({ value: 'joplin-client' });
		await joplinDb.close();
	});
});
