// Fork: two-line note list rows. The title and date go on the first line, the tags and a plain-text
// excerpt of the note on the second.

import { _ } from '../../locale';
import { ItemFlow, ListRenderer } from '../plugins/api/noteListType';
import defaultListRenderer from './defaultListRenderer';
import checkboxPieCss from './checkboxPieCss';
import noteExcerpt from './noteExcerpt';
import isNoteLockEnabled from '../noteLock/isNoteLockEnabled';
import { TagEntity } from '../database/types';
import time from '../../time';

interface Props {
	note: {
		title: string;
		body: string;
		is_locked: number;
		encryption_applied: number;
		tags: TagEntity[];
		user_updated_time: number;
	};
}

// The time for notes changed today, otherwise the date: short enough to fit a narrow list.
const shortDate = (ms: number) => {
	const isToday = new Date(ms).toDateString() === new Date().toDateString();
	return time.formatMsToLocal(ms, isToday ? time.timeFormat() : time.dateFormat());
};

const renderer: ListRenderer = {
	id: 'detailed',

	label: async () => _('Detailed'),

	flow: ItemFlow.TopToBottom,

	itemSize: {
		width: 0,
		height: 52,
	},

	dependencies: [
		...defaultListRenderer.dependencies,
		'note.body',
		'note.encryption_applied',
		'note.tags',
		'note.user_updated_time',
	],

	itemCss: // css
		`
		> .content {
			display: flex;
			box-sizing: border-box;
			width: 100%;
			height: 100%;
			padding: 0 12px 0 16px;
			border-bottom: 1px solid var(--joplin-divider-color);
			cursor: default;

			> .checkbox {
				display: flex;
				align-items: center;

				> input {
					margin: 0 10px 1px 0;
				}
			}

			> .text {
				flex: 1 1 0%;
				min-width: 0;
				display: flex;
				flex-direction: column;
				justify-content: center;
				gap: 2px;

				> .line {
					display: flex;
					align-items: baseline;
					gap: 8px;
					min-width: 0;
					white-space: nowrap;
				}
			}

			.title {
				flex: 1 1 0%;
				overflow: hidden;
				text-overflow: ellipsis;
				font-family: var(--joplin-font-family);
				font-size: var(--joplin-font-size);
				color: var(--joplin-color);

				> .watchedicon {
					display: none;
					padding-right: 4px;
				}

				> .lockedicon {
					padding-right: 4px;
				}

				> .syncdisabledicon {
					background-color: var(--joplin-color-faded);
					display: inline-block;
					height: 12px;
					width: 12px;
					margin-right: 4px;
					mask: url('vendor/lib/images/cloud-offline-outline.svg') center / contain no-repeat;
					-webkit-mask: url('vendor/lib/images/cloud-offline-outline.svg') center / contain no-repeat;
				}
			}

			.date {
				flex-shrink: 0;
				font-size: calc(var(--joplin-font-size) * 0.9);
				font-variant-numeric: tabular-nums;
				color: var(--joplin-color-faded);
			}

			.tag {
				flex-shrink: 0;
				font-size: calc(var(--joplin-font-size) * 0.9);
				color: var(--joplin-color4);
			}

			.excerpt {
				overflow: hidden;
				text-overflow: ellipsis;
				font-size: calc(var(--joplin-font-size) * 0.9);
				color: var(--joplin-color-faded);
			}

			> .checkbox-pie {
				display: flex;
				align-items: center;
				padding-left: 8px;
			}
		}

		&:hover > .content, &.-focus-visible > .content {
			background-color: var(--joplin-background-color-hover3);
		}

		> .content.-selected {
			background-color: var(--joplin-selected-color);
		}

		> .content.-shared .title {
			color: var(--joplin-color-warn3);
		}

		> .content.-published .title {
			color: var(--joplin-color4);
		}

		> .content.-completed .title {
			opacity: 0.5;
		}

		> .content.-watched .title > .watchedicon {
			display: inline;
		}

		${checkboxPieCss}
	`,

	itemTemplate: // html
		`
		<div class="content {{#item.selected}}-selected{{/item.selected}} {{#note.is_shared}}-shared{{/note.is_shared}} {{#note.is_published}}-published{{/note.is_published}} {{#note.todo_completed}}-completed{{/note.todo_completed}} {{#note.isWatched}}-watched{{/note.isWatched}}">
			{{#note.is_todo}}
				<div class="checkbox">
					<input
						data-id="todo-checkbox"
						type="checkbox"
						aria-label="{{note.todoStatusText}}"
						tabindex="-1"
						{{#note.todo_completed}}checked="checked"{{/note.todo_completed}}
					>
				</div>
			{{/note.is_todo}}
			<div class="text">
				<div class="line">
					<div class="title" data-id="{{note.id}}">
						{{#note.syncDisabled}}<i class="syncdisabledicon" role="img" aria-label="{{note.syncDisabledLabel}}"></i>{{/note.syncDisabled}}
						<i class="watchedicon fa fa-share-square"></i>
						{{#note.is_locked}}<i class="lockedicon fa fa-lock" role="img" aria-label="{{note.lockedLabel}}"></i>{{/note.is_locked}}
						<span>{{note.title}}</span>
					</div>
					<span class="date" title="{{fullDate}}">{{shortDate}}</span>
				</div>
				<div class="line">
					{{#tagTitles}}<span class="tag">#{{.}}</span>{{/tagTitles}}
					<span class="excerpt">{{excerpt}}</span>
				</div>
			</div>
			{{#checkboxStats}}
				<div class="checkbox-pie" title="{{checked}}/{{total}}">
					{{#isComplete}}
						<div class="pie -complete">✓</div>
					{{/isComplete}}
					{{^isComplete}}
						<div class="pie" style="--percent: {{percent}};"></div>
					{{/isComplete}}
				</div>
			{{/checkboxStats}}
		</div>
	`,

	onRenderNote: async (props: Props) => {
		const view = await defaultListRenderer.onRenderNote(props);
		const { note } = props;
		// Locked and still-encrypted notes must not show their content.
		const hideContent = (isNoteLockEnabled() && note.is_locked) || note.encryption_applied;

		return {
			...view,
			note: {
				...view.note,
				// The body is only needed for the excerpt, so don't pass it to the template.
				body: '',
			},
			excerpt: hideContent ? '' : noteExcerpt(note.body, note.title),
			shortDate: shortDate(note.user_updated_time),
			fullDate: time.formatMsToLocal(note.user_updated_time),
			tagTitles: (note.tags ?? []).map(tag => tag.title),
		};
	},
};

export default renderer;
