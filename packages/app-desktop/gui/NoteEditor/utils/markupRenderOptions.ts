import { LinkRenderingType } from '@joplin/renderer/MdToHtml';
import { MarkupToHtmlOptions } from './types';
import { getGlobalSettings, ResourceInfos } from '@joplin/renderer/types';
import Setting from '@joplin/lib/models/Setting';

interface OptionOverride {
	bodyOnly: boolean;
	resourceInfos?: ResourceInfos;
	allowedFilePrefixes?: string[];
	// Fork: rendering for the Rich Text editor (renderer/MdToHtml/rules/richTextSource.ts)
	richTextEditor?: boolean;
}

export default (override: OptionOverride = null): MarkupToHtmlOptions => {
	const { richTextEditor = false, ...otherOverrides } = override ?? ({} as OptionOverride);
	return {
		plugins: {
			checkbox: {
				checkboxRenderingType: 2,
			},
			link_open: {
				linkRenderingType: LinkRenderingType.HrefHandler,
			},
			richTextSource: {
				richTextEditor,
			},
		},
		replaceResourceInternalToExternalLinks: true,
		globalSettings: getGlobalSettings(Setting),
		...otherOverrides,
	};
};
