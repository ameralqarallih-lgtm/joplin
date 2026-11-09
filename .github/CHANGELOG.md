# Inkbench changelog

Inkbench versions and what changed in each. Every entry links to its issue, which lists the commits. Builds published between versions (the `desktop-latest` and `android-latest` releases) list their own changes.

Inkbench 0.1.0 to 0.4.0 are based on Joplin 3.7.22 (desktop) and 3.7.11 (Android).

## Inkbench 0.4.0 (2026-11-10)

Polish, drag and drop, notebook colours and order, wide layouts, installers and moving from Joplin.

### New and improved

- Restyle dialogs, Link to note, the emoji picker and banners ([#41](https://github.com/ameralqarallih-lgtm/joplin/issues/41))
- Drag and drop that shows where items land ([#43](https://github.com/ameralqarallih-lgtm/joplin/issues/43))
- Notebook colours ([#46](https://github.com/ameralqarallih-lgtm/joplin/issues/46))
- Arrange notebooks and notes by dragging, and sort notebooks from the sidebar ([#47](https://github.com/ameralqarallih-lgtm/joplin/issues/47))
- Home in the sidebar ([#48](https://github.com/ameralqarallih-lgtm/joplin/issues/48))
- Sync activity in the status bar ([#49](https://github.com/ameralqarallih-lgtm/joplin/issues/49))
- Tags as chips ([#50](https://github.com/ameralqarallih-lgtm/joplin/issues/50))
- Mobile: outlined text fields and line icons in settings ([#51](https://github.com/ameralqarallih-lgtm/joplin/issues/51))
- Tablets and wide windows: two panes and a docked notebooks menu ([#52](https://github.com/ameralqarallih-lgtm/joplin/issues/52))
- Windows installer that installs beside Joplin ([#53](https://github.com/ameralqarallih-lgtm/joplin/issues/53))
- Bring notes over from Joplin ([#54](https://github.com/ameralqarallih-lgtm/joplin/issues/54))

### Fixed

- New profiles show the "Markdown is now rendered in the editor" banner ([#40](https://github.com/ameralqarallih-lgtm/joplin/issues/40))
- A stray icon appears in the Edit notebook dialog ([#42](https://github.com/ameralqarallih-lgtm/joplin/issues/42))
- Dropping notes on a tag, or notebooks on the Notebooks header, does nothing ([#44](https://github.com/ameralqarallih-lgtm/joplin/issues/44))
- Dropping a notebook into its own sub-notebook fails with an error ([#45](https://github.com/ameralqarallih-lgtm/joplin/issues/45))

### Build and repository

- Keep private information out of the public repository ([#55](https://github.com/ameralqarallih-lgtm/joplin/issues/55))
- README, changelog and versioned releases ([#56](https://github.com/ameralqarallih-lgtm/joplin/issues/56))

## Inkbench 0.3.0 (2026-11-09)

Studio Home: a Home page, note tabs, pinned notes and a new app shell on desktop and mobile.

### New and improved

- Pinned notes ([#37](https://github.com/ameralqarallih-lgtm/joplin/issues/37))
- Studio Home layout on desktop ([#38](https://github.com/ameralqarallih-lgtm/joplin/issues/38))
- Studio Home layout on mobile ([#39](https://github.com/ameralqarallih-lgtm/joplin/issues/39))

## Inkbench 0.2.0 (2026-11-09)

Workbench design: themes, line icons, the Inter font, and faster navigation on desktop and mobile.

### New and improved

- Workbench light and dark themes ([#26](https://github.com/ameralqarallih-lgtm/joplin/issues/26))
- Lucide line icons and the Inter font ([#27](https://github.com/ameralqarallih-lgtm/joplin/issues/27))
- Detailed note list with two-line rows ([#28](https://github.com/ameralqarallih-lgtm/joplin/issues/28))
- Recent notes in Goto Anything, and Back/Forward shortcuts ([#29](https://github.com/ameralqarallih-lgtm/joplin/issues/29))
- Notebook path above the note title ([#30](https://github.com/ameralqarallih-lgtm/joplin/issues/30))
- Choose the note sort order from a menu ([#31](https://github.com/ameralqarallih-lgtm/joplin/issues/31))
- Filter box in the sidebar ([#33](https://github.com/ameralqarallih-lgtm/joplin/issues/33))
- Mobile: two-line note rows with the date and an excerpt ([#34](https://github.com/ameralqarallih-lgtm/joplin/issues/34))
- Mobile: browse sub-notebooks and go up to the parent ([#35](https://github.com/ameralqarallih-lgtm/joplin/issues/35))
- Mobile: pull down the note list to synchronise ([#36](https://github.com/ameralqarallih-lgtm/joplin/issues/36))

### Fixed

- A dragged note loses its position when the list switches to custom order ([#32](https://github.com/ameralqarallih-lgtm/joplin/issues/32))

## Inkbench 0.1.0 (2026-11-09)

Foundations: the fork, CI, Android builds and fixes for bugs that change note content.

### Fixed

- Four invalid CSS declarations in the desktop styles ([#17](https://github.com/ameralqarallih-lgtm/joplin/issues/17))
- Pipes in a table cell collapse when converting HTML to Markdown ([#18](https://github.com/ameralqarallih-lgtm/joplin/issues/18), reported upstream as [joplin#17065](https://github.com/laurent22/joplin/issues/17065))
- Numbered lists from 100 break when converting HTML to Markdown ([#19](https://github.com/ameralqarallih-lgtm/joplin/issues/19))
- An unclosed $$ turns the rest of a note into a maths error ([#20](https://github.com/ameralqarallih-lgtm/joplin/issues/20), reported upstream as [joplin#17066](https://github.com/laurent22/joplin/issues/17066))
- Diagram fences are case-sensitive, and unsupported code languages are guessed ([#21](https://github.com/ameralqarallih-lgtm/joplin/issues/21))
- A leading --- block is treated as front matter even when it isn't YAML ([#22](https://github.com/ameralqarallih-lgtm/joplin/issues/22))
- Checklists written with * or + bullets aren't recognised ([#23](https://github.com/ameralqarallih-lgtm/joplin/issues/23))
- Code blocks have no inner padding, and comments are hard to read ([#24](https://github.com/ameralqarallih-lgtm/joplin/issues/24))
- Mobile Rich Text editor drops strikethrough, inserted text and table alignment ([#25](https://github.com/ameralqarallih-lgtm/joplin/issues/25))

### Build and repository

- Track upstream Joplin: mirror branch and release issues ([#14](https://github.com/ameralqarallih-lgtm/joplin/issues/14))
- Continuous integration for the fork ([#15](https://github.com/ameralqarallih-lgtm/joplin/issues/15))
- Signed Android builds under the Inkbench name ([#16](https://github.com/ameralqarallih-lgtm/joplin/issues/16))

## Planned

Work planned for the next versions is tracked in the [Inkbench 0.5.0 milestone](https://github.com/ameralqarallih-lgtm/joplin/milestone/5).
