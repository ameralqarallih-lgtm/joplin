# About this fork

This is a fork of [laurent22/joplin](https://github.com/laurent22/joplin). We add our own improvements on top of upstream Joplin and keep pulling in upstream releases and fixes.

## Branches

| Branch | Purpose | Rules |
| --- | --- | --- |
| `dev` | Exact mirror of `upstream/dev`, updated automatically. | Never commit to it. Never resolve conflicts on it. |
| `next` | Working branch: upstream plus our changes. | Commit and push directly. CI and the Android build run on every push. |
| `main` | Stable branch. Default branch. | Takes `next` through a single reviewed PR once `next` is ready. |
| `feat/*`, `fix/*` | Optional, for large or risky changes. | Branch from `next` and merge back into it. |

Keep our changes small and self-contained, so upstream merges stay easy. Put new code in new files where possible, rather than spreading edits through upstream files. If a change would be useful to everyone, consider sending it upstream too: every change upstream accepts is one less thing to maintain here.

## Local setup

```bash
git clone https://github.com/ameralqarallih-lgtm/joplin.git
cd joplin
git config core.longpaths true
git remote add upstream https://github.com/laurent22/joplin.git
git remote set-url --push upstream DISABLED
git fetch upstream --tags
git switch next
```

For building and running the apps, see [readme/dev/BUILD.md](readme/dev/BUILD.md) and [readme/dev/index.md](readme/dev/index.md).

## Upstream tracking (automated)

[.github/workflows/fork-upstream-sync.yml](.github/workflows/fork-upstream-sync.yml) runs daily at 04:17 UTC. You can also start it by hand from the Actions tab, with a dry-run option. It runs [.github/fork/upstream-sync.sh](.github/fork/upstream-sync.sh), which:

1. **Mirrors `dev`.** It fast-forwards `dev` to `upstream/dev`. If someone has committed to `dev`, it stops with an error instead of merging or overwriting.
2. **Opens a sync PR.** When `main` is behind `dev`, it opens a `dev → main` PR labelled `upstream-sync`. The PR updates itself as `dev` advances.
3. **Tracks releases.** It opens an issue labelled `upstream-release` for each new upstream GitHub release (desktop, `v*`) and for the newest `android-v*` and `server-v*` tags. Each issue links the release notes or changelog, says how many of the release's commits are missing from `main`, and has a review checklist.

The sync PR targets `main`. While our work lives on `next`, bring upstream into `next` as well (see [Bringing upstream into next](#bringing-upstream-into-next)).

The script can also run locally: `DRY_RUN=1 bash .github/fork/upstream-sync.sh`. It needs `gh` to be signed in.

### Required secret: `FORK_SYNC_TOKEN`

Upstream changes `.github/workflows/` often. The default `GITHUB_TOKEN` is not allowed to push those commits, and it cannot open PRs unless that is enabled in settings. So the workflow uses a fine-grained personal access token:

1. Go to GitHub → Settings → Developer settings → Fine-grained tokens → **Generate new token**.
2. Under repository access, choose **Only select repositories** → this fork.
3. Under repository permissions, set **Contents**, **Pull requests**, **Issues** and **Workflows** to *Read and write*.
4. Save the token as a repository secret named `FORK_SYNC_TOKEN`: Settings → Secrets and variables → Actions.

Without the secret, the workflow falls back to `GITHUB_TOKEN`. Syncing then fails whenever upstream has touched a workflow file.

## Continuous integration

Upstream's CI only runs in `laurent22/joplin`, so the fork has its own, in [.github/workflows/fork-ci.yml](.github/workflows/fork-ci.yml). It runs on every push to `next` or `main`, and on every PR into `main`:

1. `yarn install`. This builds every package and runs `yarn tsc`, so it also type-checks the code.
2. ESLint. For a PR, on the files it changes. For a push, on every file the fork changes relative to upstream `dev`.
3. Tests for `utils`, `renderer`, `editor`, `lib`, `app-desktop`, `app-mobile` and `app-cli`. The `app-cli` tests include the HTML-to-Markdown fixtures in `packages/app-cli/tests/html_to_md`, which cover the rich-text editor's conversion.

Fix a failing run on `next` before adding more work on top. Merge a PR only when this check passes.

## Android builds

[.github/workflows/fork-android.yml](.github/workflows/fork-android.yml) builds a signed APK whenever a push to `next` or `main` changes the mobile app or a package it uses. It can also be started by hand from the Actions tab. The APK is attached to the workflow run, and published on the `android-latest` pre-release on the repository's Releases page, which you can open from your phone to install or update.

The build uses our own app ID and name, so it installs alongside the official Joplin app instead of replacing it. [.github/fork/android-branding.sh](.github/fork/android-branding.sh) applies them during the build only; the committed Android files stay identical to upstream's. Version numbers follow upstream's, with the build number added (for example `3.7.11-fork.12`).

Configuration (Settings → Secrets and variables → Actions):

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `FORK_APP_ID` | Android application ID, e.g. `io.github.example.notes` |
| Variable | `FORK_APP_NAME` | Name under the app icon. Letters, digits, spaces, `.`, `_` and `-` only. |
| Secret | `FORK_ANDROID_KEYSTORE_BASE64` | Base64 of the release keystore |
| Secret | `FORK_ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| Secret | `FORK_ANDROID_KEY_ALIAS` | Key alias |
| Secret | `FORK_ANDROID_KEY_PASSWORD` | Key password |

Keep a backup of the keystore and its password outside GitHub. Android only installs an update that is signed with the same key. Changing the key means uninstalling the app first, which deletes its local data.

## Workbench design

The fork's look is called Workbench: cool grey surfaces, a cobalt accent, compact rows and 4px corners.

- **Themes.** [workbenchLight.ts](packages/lib/themes/workbenchLight.ts) and [workbenchDark.ts](packages/lib/themes/workbenchDark.ts), registered in `lib/theme.ts`, `Setting.ts` (IDs 1001 and 1002) and `builtInMetadata.ts`, where they are also the defaults. Mobile builds its Paper theme from these colours, so it picks them up too.
- **Desktop layer.** [gui/Workbench/style.scss](packages/app-desktop/gui/Workbench/style.scss), loaded last from `style.scss`. Its rules sit inside `@container style(--joplin-ui-style: workbench)`, so they only apply while a Workbench theme is active. Upstream's themes look exactly as before.
- **Tokens.** `--wb-*` CSS variables for spacing, corner radius, type sizes and shadows, at the top of the layer.
- **Components.** The layer includes one partial per area: `controls.scss` (buttons, text fields, dropdowns), `dialogs.scss` (dialog windows and their buttons, prompts, the tag picker, Goto Anything and "Link to note"), `emoji-picker.scss`, `banners.scss` and `settings.scss`. Dialogs that build their styles inline get a few class names upstream (`dialog-button-row`, `-primary`) so the layer can reach them, and Goto Anything takes its compact row heights from `workbenchItemHeight` in [GotoAnything.tsx](packages/app-desktop/plugins/GotoAnything.tsx).
- **First start.** A new profile skips the "Markdown is now rendered in the editor" banner, which is meant for people upgrading from the old editor.
- **Icons.** Lucide line icons replace Font Awesome and Joplin's own icon font while a Workbench theme is active. [packages/tools/buildWorkbenchIcons.ts](packages/tools/buildWorkbenchIcons.ts) maps each icon class to a Lucide icon and generates `gui/Workbench/icons/_icons.scss`. To add an icon, add its class to the map and run the tool, as its header comment describes. Unmapped classes, such as a plugin's unusual icon, keep the Font Awesome glyph. The same tool writes the mobile icons, [lucideIcons.ts](packages/app-mobile/components/LucideIcon/lucideIcons.ts), drawn with react-native-svg by the mobile `Icon` component.
- **Font.** Inter is bundled in `gui/Workbench/fonts`, and loaded by the main window and the note viewer. It is the UI font and the default note font of the Workbench themes ([workbenchStyle.ts](packages/lib/themes/utils/workbenchStyle.ts)); a font chosen in Settings → Appearance still wins. Code uses the system monospace font. Mobile keeps the platform font (Roboto on Android, San Francisco on iOS).
- **Note list.** The Detailed list style ([detailedListRenderer.ts](packages/lib/services/noteList/detailedListRenderer.ts)) shows two-line rows with the date, tags and an excerpt, and is the default. Locked and encrypted notes never show an excerpt. The View menu switches back to Compact.

Restyle components in the layer rather than editing upstream's files. That keeps upstream merges clean.

### Layout ("Studio Home")

With a Workbench theme, both apps also get the Studio Home layout. Upstream's themes keep upstream's layout.

- **Pinned notes.** A pin lives in the note's user data under `org.inkbench` ([pinnedNotes.ts](packages/lib/models/utils/pinnedNotes.ts)), so it syncs and upstream clients ignore it. `state.pinnedNotes` reloads only when a pin may have changed ([handlePinnedNotesAction.ts](packages/lib/services/pinnedNotes/handlePinnedNotesAction.ts)). The `togglePinNote` command pins and unpins.
- **Home.** [loadHomeData.ts](packages/lib/models/utils/loadHomeData.ts) loads the recent notes, open to-dos (plus those ticked in the last day), pinned notes and top-level notebooks for both apps.
- **Desktop.** Everything is under [gui/Workbench](packages/app-desktop/gui/Workbench):
  - `Shell/` holds the top bar (search opens Goto Anything, sync status, New to-do, New note), the icon rail and the status bar. `MainScreen` takes their room off the layout's size ([shellSize.ts](packages/app-desktop/gui/Workbench/Shell/shellSize.ts)).
  - `NoteTabs/` puts the open notes in tabs above the editor; Home is opened from the top of the sidebar (`SidebarHome/`) or the rail. A note opened from the list goes into a preview tab (italic) until it is edited or its tab is double-clicked ([noteTabsReducer.ts](packages/app-desktop/gui/Workbench/NoteTabs/noteTabsReducer.ts)). The app starts on Home. A plain `NOTE_SELECT` doesn't leave Home, because the app selects notes by itself when a notebook opens; the note list dispatches `WORKBENCH_HOME_HIDE` when the user opens a note.
  - `HomeView/` is the Home page (with the tags as chips at the end), `NoteOutline/` the headings and backlinks beside the editor, and `SidebarPinned/` the pinned notes at the top of the sidebar.
  - The status bar shows sync activity, attachments being fetched and items being decrypted, which upstream shows below the sidebar; hovering it shows the full sync report ([syncActivity.ts](packages/app-desktop/gui/Workbench/Shell/syncActivity.ts)).
- **Mobile.** The app starts on [HomeScreen.tsx](packages/app-mobile/components/screens/Home/HomeScreen.tsx), with a bottom bar ([WorkbenchTabBar.tsx](packages/app-mobile/components/screens/Home/WorkbenchTabBar.tsx)) on Home, the note list and Tags. The note list gets All / To-dos / Pinned filters ([NoteListFilterBar.tsx](packages/app-mobile/components/screens/Notes/NoteListFilterBar.tsx)), and the note menu has Pin / Unpin.
  In wide windows ([workbenchLayout.ts](packages/app-mobile/utils/workbenchLayout.ts)), the note list and the open note are side by side from 760 wide, and the notebooks menu stays open on the left from 1100 wide.
  With a Workbench theme, text fields are outlined with rounded corners ([TextInput.tsx](packages/app-mobile/components/TextInput.tsx)), the Tags screen shows chips with note counts ([TagChips.tsx](packages/app-mobile/components/screens/TagChips.tsx)), and the settings sections use Lucide icons.

### Notebook colours

A notebook's colour lives in its user data under `org.inkbench` ([folderColor.ts](packages/lib/models/utils/folderColor.ts), which also lists the presets), so it syncs and upstream clients ignore it. It shows in every theme:

- **Desktop.** The Edit notebook dialog has the presets and a custom picker ([ColorPicker.tsx](packages/app-desktop/gui/Workbench/ColorPicker/ColorPicker.tsx)). The notebook context menu has a Colour submenu ([folderColorMenu.ts](packages/app-desktop/gui/Workbench/folderColorMenu.ts)). The sidebar, the note list title and the Home tiles show the colour.
- **Mobile.** The notebook screen has the presets ([FolderColorPicker.tsx](packages/app-mobile/components/FolderColorPicker.tsx)), and keeps a custom colour chosen on desktop. The drawer and the Home tiles show the colour.

### Notebook order

"Sort notebooks by" gets a Custom order, which notebooks' user data holds (`org.inkbench`, [folderOrder.ts](packages/lib/models/utils/folderOrder.ts)), so it syncs and the mobile drawer follows it. On desktop, dropping notebooks on the top or bottom edge of another notebook places them above or below it (and switches to the custom order); the middle of the row still moves them inside. A button beside "Notebooks" in the sidebar chooses the sort order.

### Drag and drop (desktop)

With a Workbench theme, dragging notes or notebooks shows a tilted card under the pointer that names what is dragged and where a drop would land, and outlines the target ([DragGhost.tsx](packages/app-desktop/gui/Workbench/DragDrop/DragGhost.tsx)). The sidebar and the note list report the drag and the target through [dragFeedback.ts](packages/app-desktop/gui/Workbench/DragDrop/dragFeedback.ts). In every theme, the sidebar refuses impossible drops, such as a notebook into one of its own sub-notebooks ([dropTargets.ts](packages/app-desktop/gui/Workbench/DragDrop/dropTargets.ts)), opens a collapsed notebook when the pointer rests on it, and accepts drops on tags and on the "Notebooks" header, which upstream handled but never accepted. With a Workbench theme, dropping notes into a list that isn't in custom order switches to it without asking, since the drag preview says so.

## Spelling

The pre-commit hook spellchecks new and changed files. Add the fork's unknown words to [packages/tools/cspell/dictionary-fork.txt](packages/tools/cspell/dictionary-fork.txt), not to upstream's `dictionary*.txt` files, which upstream appends to.

## Bringing upstream into next

```bash
git fetch origin
git switch next
git merge origin/dev           # fix conflicts, then: git add ... && git commit
git push
```

Conflicts in the generated block at the end of `.gitignore` or `.ignore.eslint` don't need resolving by hand: take either side, run `yarn updateIgnored`, and add the result.

## Merging a sync PR

- Always merge with **Create a merge commit**. Squash or rebase would rewrite upstream's history, and every later sync would conflict again.
- Watch out for upstream changes that touch the same code as ours. Re-test our features after each sync.

### Resolving a conflicted sync

Don't use GitHub's **Resolve conflicts** button on the sync PR. It commits into `dev`, which breaks the mirror. Resolve locally instead:

```bash
git fetch origin
git switch -c sync/$(date +%Y-%m-%d) origin/main
git merge origin/dev           # fix conflicts, then: git add ... && git commit
git push -u origin HEAD
gh pr create --base main --title "Sync upstream dev into main"
```

Merge that PR with a merge commit. The automatic `dev → main` PR closes itself once `main` contains `dev`.

### If `dev` was committed to by mistake

```bash
git switch -c rescue/dev-commits origin/dev   # keep the stray commits
git push -u origin HEAD
git fetch upstream
git push --force origin upstream/dev:dev      # restore the mirror
```

Then cherry-pick the rescued commits into a feature branch off `main`.

## Release-only fixes

Upstream sometimes publishes a release from a release branch, with fixes that reach `dev` later. A release issue that reports missing commits after the latest sync has been merged points to this. Cherry-pick what we need:

```bash
git fetch upstream --tags
git log --oneline origin/main..v3.7.22      # commits in the release that main lacks
git switch -c fix/upstream-v3.7.22 origin/main
git cherry-pick -x <sha>...
```

## Upstream workflows in this fork

Upstream's build, test and release workflows check `github.repository == 'laurent22/joplin'`, so they skip here. Upstream's maintenance workflows don't make sense in a fork and are disabled in the Actions settings: `automerge`, `check-pr-title`, `comment-on-failure` and `delete-coderabbit-comments`. Disabling a workflow in the settings survives syncs, because the workflow files stay unchanged.

## Licensing and naming

- Code is AGPL-3.0-or-later, except directories with their own licence. `packages/server` is under the [Joplin Server Personal Use License](packages/server/LICENSE.md). If we distribute modified apps, or run a modified service for other people, we must share the source.
- "Joplin" is a registered trademark of JOPLIN SAS. Builds we hand out to others should use our own app name and application ID.
