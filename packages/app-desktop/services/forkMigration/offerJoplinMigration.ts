// Fork: on the first start of a renamed build, asks whether to copy the notes of an installed Joplin (see
// migrateFromJoplin.ts). Runs before the app opens its database, so the copy is what it opens.

import { remove } from 'fs-extra';
import { join } from 'path';
import { _ } from '@joplin/lib/locale';
import Logger from '@joplin/utils/Logger';
import bridge from '../bridge';
import { copyJoplinProfile, joplinProfileDir, shouldOfferJoplinMigration } from './migrateFromJoplin';

const logger = Logger.create('offerJoplinMigration');

const offerJoplinMigration = async (argv: string[]) => {
	// Development runs use a profile of their own, which shouldn't fill up with the developer's notes.
	if (bridge().env() === 'dev') return;

	const profileDir = bridge().rootProfileDir();
	const sourceDir = joplinProfileDir();
	if (!await shouldOfferJoplinMigration(profileDir, sourceDir, argv.includes('--profile'))) return;

	const appName = bridge().electronApp().electronApp().getName();
	const copyFromJoplin = bridge().showConfirmMessageBox(
		_('Joplin is set up on this computer. Copy its notes, notebooks, attachments and settings into %s?', appName),
		{ buttons: [_('Copy from Joplin'), _('Start empty')], detail: _('Joplin and its notes stay as they are.') },
	);
	if (!copyFromJoplin) return;

	try {
		const result = await copyJoplinProfile(sourceDir, profileDir);
		logger.info('Copied the Joplin profile from', sourceDir);
		if (result.hadSyncTarget) {
			bridge().showInfoMessageBox(_('Your notes were copied from Joplin. To keep syncing, enter your sync password again in Settings > Synchronisation: Joplin keeps it in its own keychain.'));
		}
	} catch (error) {
		logger.error('Could not copy the Joplin profile:', error);
		// Without a database, the next start offers the copy again.
		await remove(join(profileDir, 'database.sqlite'));
		bridge().showErrorMessageBox(_('Your notes could not be copied from Joplin: %s', error.message));
	}
};

export default offerJoplinMigration;
