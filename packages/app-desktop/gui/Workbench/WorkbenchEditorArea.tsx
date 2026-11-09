// Fork: with a Workbench theme, the main window's editor pane gets the tab bar and the Home page. The editor stays
// mounted while Home is shown, so switching back to a note is instant.

import * as React from 'react';
import { connect } from 'react-redux';
import { defaultWindowId } from '@joplin/lib/reducer';
import isWorkbenchTheme from '@joplin/lib/themes/utils/isWorkbenchTheme';
import { AppState } from '../../app.reducer';
import NoteTabs from './NoteTabs/NoteTabs';
import HomeView from './HomeView/HomeView';
import NoteOutline from './NoteOutline/NoteOutline';

interface Props {
	windowId: string;
	themeId: number;
	homeTabActive: boolean;
	children: React.ReactNode;
}

const WorkbenchEditorArea: React.FC<Props> = props => {
	if (props.windowId !== defaultWindowId || !isWorkbenchTheme(props.themeId)) return <>{props.children}</>;

	return <div className='workbench-editor'>
		<NoteTabs/>
		<HomeView visible={props.homeTabActive}/>
		<div className={`editor ${props.homeTabActive ? '-hidden' : ''}`}>
			{props.children}
			<NoteOutline/>
		</div>
	</div>;
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
	homeTabActive: state.homeTabActive,
}))(WorkbenchEditorArea);
