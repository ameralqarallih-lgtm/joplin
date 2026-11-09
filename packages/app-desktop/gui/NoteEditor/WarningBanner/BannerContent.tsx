import * as React from 'react';
import { _ } from '@joplin/lib/locale';

interface Props {
	children: React.ReactNode;
	acceptMessage?: string;
	onAccept?: ()=> void;
	onDismiss?: ()=> void;
	dismissMessage?: string;
	visible: boolean;
}

const BannerContent: React.FC<Props> = props => {
	if (!props.visible) {
		return null;
	}

	// Fork: the links' brackets are drawn by warning-banner-link.scss, so that the Workbench theme can show buttons.
	return <div className='warning-banner'>
		{props.children}
		{ props.acceptMessage ? <>&nbsp;&nbsp;<a onClick={props.onAccept} className='warning-banner-link -action -accept' href="#">{props.acceptMessage}</a></> : null }
		&nbsp;&nbsp;{ props.onDismiss ? <a onClick={props.onDismiss} className='warning-banner-link -action' href="#">{props.dismissMessage ?? _('Dismiss')}</a> : null }
	</div>;
};

export default BannerContent;
