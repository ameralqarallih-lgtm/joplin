// Rebrands the desktop app for fork builds without committing changes to upstream files. See FORK.md.
//
// Required env: FORK_APP_ID (e.g. io.github.example.notes), FORK_APP_NAME (e.g. Notes).
// Optional env: FORK_BUILD_NUMBER (defaults to 0), added to the version shown in the installer's name.
//
// Run from the repository root, before building the desktop app. It edits the working tree only. The branded app
// keeps its own profile folder (~/.config/<name>-desktop), Windows app ID and keychain entries, so that it can be
// installed beside Joplin without touching its notes. It doesn't check Joplin's releases for updates.

const { readFileSync, writeFileSync, appendFileSync } = require('fs');

const fail = message => {
	console.error(`::error::${message}`);
	process.exit(1);
};

const appId = process.env.FORK_APP_ID || '';
const appName = process.env.FORK_APP_NAME || '';
const buildNumber = Number(process.env.FORK_BUILD_NUMBER || 0);

if (!/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/.test(appId)) fail(`FORK_APP_ID '${appId}' is not a valid application ID`);
if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,29}$/.test(appName)) fail('FORK_APP_NAME may only contain letters, digits, spaces, \'.\', \'_\' and \'-\' (max 30 characters)');

// The profile folder name, such as "inkbench" for "Inkbench".
const profileName = appName.toLowerCase().replace(/[^a-z0-9]/g, '');
if (!profileName) fail('FORK_APP_NAME must contain a letter or a digit');

const replaceOnce = (path, search, replacement) => {
	const content = readFileSync(path, 'utf8');
	if (!content.includes(search)) fail(`Could not find in ${path}: ${search} (upstream may have changed it)`);
	writeFileSync(path, content.replace(search, replacement), 'utf8');
};

// The main process: Windows app ID and profile folder.
replaceOnce(
	'packages/app-desktop/main.ts',
	'const appId = `net.cozic.joplin${env === \'dev\' ? \'dev\' : \'\'}-desktop`;',
	`const appId = \`${appId}\${env === 'dev' ? 'dev' : ''}-desktop\`;`,
);
replaceOnce(
	'packages/app-desktop/main.ts',
	'let appName = env === \'dev\' ? \'joplindev\' : \'joplin\';',
	`let appName = env === 'dev' ? '${profileName}dev' : '${profileName}';`,
);

// The renderer works out the profile folder again from this name.
replaceOnce(
	'packages/lib/getAppName.ts',
	'let appName = isDev ? \'joplindev\' : \'joplin\';',
	`let appName = isDev ? '${profileName}dev' : '${profileName}';`,
);

// Joplin's releases aren't updates of the fork.
replaceOnce(
	'packages/lib/models/settings/builtInMetadata.ts',
	'autoUpdateEnabled: { value: true,',
	'autoUpdateEnabled: { value: false,',
);

// The installer: name, app ID and a single unsigned 64-bit NSIS installer.
const packagePath = 'packages/app-desktop/package.json';
const packageInfo = JSON.parse(readFileSync(packagePath, 'utf8'));
const version = `${packageInfo.version}-fork.${buildNumber}`;
const build = packageInfo.build;
build.appId = `${appId}-desktop`;
build.productName = appName;
delete build.afterSign;
delete build.win.signtoolOptions;
build.win.target = [{ target: 'nsis', arch: ['x64'] }];
build.nsis = {
	...build.nsis,
	artifactName: `${appName.replace(/ /g, '-')}-Setup-${version}.\${ext}`,
	shortcutName: appName,
	uninstallDisplayName: appName,
};
writeFileSync(packagePath, `${JSON.stringify(packageInfo, null, 2)}\n`, 'utf8');

console.info(`Branded desktop build: id=${build.appId} name=${appName} profile=~/.config/${profileName}-desktop version=${version}`);
if (process.env.GITHUB_OUTPUT) {
	appendFileSync(process.env.GITHUB_OUTPUT, `version_name=${version}\n`);
}
