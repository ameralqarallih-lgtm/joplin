// Fork: the Workbench icon rail: Home, the open notes, all open to-dos, tags and settings.

import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { _ } from '@joplin/lib/locale';
import BaseModel from '@joplin/lib/BaseModel';
import CommandService from '@joplin/lib/services/CommandService';
import { AppState } from '../../../app.reducer';
import { UiType } from '../../WindowCommandsAndDialogs/commands/gotoAnything';

interface Props {
	homeTabActive: boolean;
	showingTodos: boolean;
	dispatch: Dispatch;
}

export const todoSearchId = 'workbench-todos';

interface RailButtonProps {
	icon: string;
	label: string;
	active?: boolean;
	onClick: ()=> void;
}

const RailButton: React.FC<RailButtonProps> = props => {
	return <button
		type='button'
		className={`rail-button ${props.active ? '-active' : ''}`}
		aria-label={props.label}
		aria-current={props.active ? 'page' : undefined}
		title={props.label}
		onClick={props.onClick}
	>
		<i className={props.icon} aria-hidden={true}></i>
	</button>;
};

const Rail: React.FC<Props> = props => {
	const showTodos = () => {
		props.dispatch({
			type: 'SEARCH_UPDATE',
			search: {
				id: todoSearchId,
				title: _('To-dos'),
				query_pattern: 'type:todo iscompleted:0',
				query_folder_id: null,
				type_: BaseModel.TYPE_SEARCH,
			},
		});
		props.dispatch({ type: 'SEARCH_SELECT', id: todoSearchId });
	};

	return <nav className='workbench-rail' aria-label={_('Sections')}>
		<RailButton icon='fas fa-home' label={_('Home')} active={props.homeTabActive} onClick={() => props.dispatch({ type: 'WORKBENCH_HOME_SHOW' })}/>
		<RailButton icon='icon-note' label={_('Notes')} active={!props.homeTabActive && !props.showingTodos} onClick={() => props.dispatch({ type: 'WORKBENCH_HOME_HIDE' })}/>
		<RailButton icon='icon-to-do-list' label={_('To-dos')} active={props.showingTodos} onClick={showTodos}/>
		<RailButton icon='icon-tags' label={_('Tags')} onClick={() => void CommandService.instance().execute('gotoAnything', UiType.GotoAnything, { startString: '#' })}/>
		<div className='spacer'></div>
		<RailButton icon='fas fa-cog' label={_('Options')} onClick={() => props.dispatch({ type: 'NAV_GO', routeName: 'Config' })}/>
	</nav>;
};

export default connect((state: AppState) => ({
	homeTabActive: state.homeTabActive,
	showingTodos: state.notesParentType === 'Search' && state.selectedSearchId === todoSearchId,
}))(Rail);
