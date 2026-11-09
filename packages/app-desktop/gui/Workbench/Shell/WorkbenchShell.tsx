// Fork: the Workbench shell around the main layout: the top bar, the icon rail and the status bar. MainScreen
// takes their room off the layout's size, see shellSize.ts. It also hosts the drag preview.

import * as React from 'react';
import TopBar from './TopBar';
import Rail from './Rail';
import StatusBar from './StatusBar';
import DragGhost from '../DragDrop/DragGhost';

interface Props {
	children: React.ReactNode;
}

const WorkbenchShell: React.FC<Props> = props => {
	return <div className='workbench-shell'>
		<TopBar/>
		<div className='body'>
			<Rail/>
			<div className='main'>{props.children}</div>
		</div>
		<StatusBar/>
		<DragGhost/>
	</div>;
};

export default WorkbenchShell;
