// Fork: the link to the Home page at the top of the Workbench sidebar.

import * as React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { _ } from '@joplin/lib/locale';
import { AppState } from '../../../app.reducer';

interface Props {
	homeTabActive: boolean;
	dispatch: Dispatch;
}

const SidebarHome: React.FC<Props> = props => {
	return <nav className='sidebar-home' aria-label={_('Home')}>
		<button
			type='button'
			className={`item ${props.homeTabActive ? '-selected' : ''}`}
			aria-current={props.homeTabActive ? 'page' : undefined}
			onClick={() => props.dispatch({ type: 'WORKBENCH_HOME_SHOW' })}
		>
			<i className='icon fas fa-home' aria-hidden={true}></i>
			<span className='label'>{_('Home')}</span>
		</button>
	</nav>;
};

export default connect((state: AppState) => ({
	homeTabActive: state.homeTabActive,
}))(SidebarHome);
