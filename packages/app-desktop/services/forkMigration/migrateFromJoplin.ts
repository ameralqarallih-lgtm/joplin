// Fork: on the first start of a renamed build (Inkbench), offers to copy the user's Joplin desktop profile, so
// that their notes, notebooks, attachments and settings carry over. Joplin's profile is left untouched: renamed
// builds have a profile folder of their own (see .github/fork/desktop-branding.js). Builds that keep Joplin's name
// use Joplin's folder, so there is nothing to offer.

import { copy, pathExists, readJson, writeJson } from 'fs-extra';
import { homedir } from 'os';
import { join, relative, resolve } from 'path';
import { DatabaseDriverNode } from '@joplin/lib/database-driver-node';
import Setting from '@joplin/lib/models/Setting';

export const joplinProfileDir = () => join(homedir(), '.config', 'joplin-desktop');

// Files of the running app, rebuilt on start, and the database, which is copied as a snapshot.
const skippedTopLevelNames = ['lock', 'ipc_secret_key.txt', 'cache', 'tmp', 'database.sqlite', 'database.sqlite-journal', 'database.sqlite-wal', 'database.sqlite-shm'];
const isSkipped = (name: string) => skippedTopLevelNames.includes(name) || /^log.*\.txt$/.test(name);

const darkThemes = [Setting.THEME_DARK, Setting.THEME_OLED_DARK, Setting.THEME_SOLARIZED_DARK, Setting.THEME_DRACULA, Setting.THEME_NORD, Setting.THEME_ARITIM_DARK];

export const shouldOfferJoplinMigration = async (profileDir: string, sourceDir: string, profileFromArgs: boolean) => {
	if (profileFromArgs) return false;
	if (resolve(profileDir).toLowerCase() === resolve(sourceDir).toLowerCase()) return false;
	if (await pathExists(join(profileDir, 'database.sqlite'))) return false;
	return pathExists(join(sourceDir, 'database.sqlite'));
};

export interface CopyResult {
	// Whether Joplin was syncing. Its sync password stays in Joplin's keychain, so it has to be entered again.
	hadSyncTarget: boolean;
}

export const copyJoplinProfile = async (sourceDir: string, targetDir: string): Promise<CopyResult> => {
	await copy(sourceDir, targetDir, {
		filter: path => {
			const name = relative(sourceDir, path);
			return !name || !isSkipped(name);
		},
	});

	// VACUUM INTO writes a consistent copy, even while Joplin is open.
	const source = new DatabaseDriverNode();
	await source.open({ name: join(sourceDir, 'database.sqlite') });
	try {
		await source.exec('VACUUM INTO ?', [join(targetDir, 'database.sqlite')]);
	} finally {
		await source.close();
	}

	// The copy is a new device for the sync server, so it gets its own client ID when it starts.
	const target = new DatabaseDriverNode();
	await target.open({ name: join(targetDir, 'database.sqlite') });
	try {
		await target.exec('DELETE FROM settings WHERE key = \'clientId\'');
	} finally {
		await target.close();
	}

	let hadSyncTarget = false;
	const settingsPath = join(targetDir, 'settings.json');
	if (await pathExists(settingsPath)) {
		const settings = await readJson(settingsPath);
		hadSyncTarget = !!settings['sync.target'];
		// Joplin's themes become the Workbench theme of the same appearance.
		if (settings.theme !== undefined) {
			settings.theme = darkThemes.includes(settings.theme) ? Setting.THEME_WORKBENCH_DARK : Setting.THEME_WORKBENCH_LIGHT;
		}
		delete settings.preferredLightTheme;
		delete settings.preferredDarkTheme;
		await writeJson(settingsPath, settings, { spaces: '\t' });
	}

	return { hadSyncTarget };
};
