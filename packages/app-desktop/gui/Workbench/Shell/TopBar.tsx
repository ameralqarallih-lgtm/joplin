// Fork: the Workbench top bar: the app name, a search field that opens Goto Anything, the sync status and a
// New note button.

import * as React from 'react';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { _ } from '@joplin/lib/locale';
import CommandService from '@joplin/lib/services/CommandService';
import KeymapService from '@joplin/lib/services/KeymapService';
import Synchronizer, { ProgressReport } from '@joplin/lib/Synchronizer';
import shim from '@joplin/lib/shim';
import { AppState } from '../../../app.reducer';
import Button, { ButtonLevel } from '../../Button/Button';
import formatSyncStatus, { SyncStatusIcon } from '@joplin/lib/services/home/formatSyncStatus';

interface Props {
	syncTargetSet: boolean;
	syncStarted: boolean;
	syncPending: boolean;
	syncReport: ProgressReport;
}

const syncIcons: Record<SyncStatusIcon, string> = {
	[SyncStatusIcon.Off]: 'wb-icon-sync-off',
	[SyncStatusIcon.Sync]: 'icon-sync',
	[SyncStatusIcon.Synced]: 'wb-icon-synced',
	[SyncStatusIcon.Error]: 'fas fa-exclamation-triangle',
};

const formatAccelerator = (accelerator: string) => {
	if (!accelerator) return '';
	return accelerator.replace(/CommandOrControl|CmdOrCtrl/, shim.isMac() ? '⌘' : 'Ctrl');
};

// Re-renders every half minute, so that "Synced 2 min ago" stays true.
const useNow = () => {
	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		const interval = shim.setInterval(() => setNow(Date.now()), 30 * 1000);
		return () => shim.clearInterval(interval);
	}, []);
	return now;
};

const SyncChip: React.FC<Props> = props => {
	const now = useNow();
	const status = formatSyncStatus({ ...props, now });
	const details = Synchronizer.reportToLines(props.syncReport).join('\n');

	const onClick = () => {
		if (!props.syncTargetSet) {
			void CommandService.instance().execute('openSyncWizard');
		} else {
			void CommandService.instance().execute('synchronize', props.syncStarted);
		}
	};

	return <button type='button' className={`sync-chip -${status.tone}`} title={details || status.label} onClick={onClick}>
		<i className={`icon ${syncIcons[status.icon]}`} aria-hidden={true}></i>
		<span className='label' aria-live='polite'>{status.label}</span>
	</button>;
};

const TopBar: React.FC<Props> = props => {
	const shortcut = formatAccelerator(KeymapService.instance().getAccelerator('gotoAnything'));

	return <header className='workbench-top-bar'>
		<div className='brand'>
			<span className='mark'><i className='wb-icon-logo' aria-hidden={true}></i></span>
			<span className='name'>Inkbench</span>
		</div>
		<div className='search'>
			<button type='button' className='field' onClick={() => void CommandService.instance().execute('gotoAnything')}>
				<i className='icon icon-search' aria-hidden={true}></i>
				<span className='placeholder'>{_('Search or jump to…')}</span>
				{shortcut ? <kbd className='shortcut'>{shortcut}</kbd> : null}
			</button>
		</div>
		<SyncChip {...props}/>
		<Button
			className='todo'
			level={ButtonLevel.Secondary}
			iconName='icon-to-do-list'
			tooltip={_('New to-do')}
			aria-label={_('New to-do')}
			onClick={() => void CommandService.instance().execute('newTodo')}
		/>
		<Button
			className='note'
			level={ButtonLevel.Primary}
			iconName='fas fa-plus'
			title={_('New note')}
			onClick={() => void CommandService.instance().execute('newNote')}
		/>
	</header>;
};

export default connect((state: AppState) => ({
	syncTargetSet: !!state.settings['sync.target'],
	syncStarted: state.syncStarted,
	syncPending: state.syncPending,
	syncReport: state.syncReport,
}))(TopBar);
