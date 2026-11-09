// Fork: what is being dragged and where it would land, shown by DragGhost. The sidebar and the note list report
// the drag source when a drag starts, and the drop target from their dragover handlers.

export enum DragKind {
	Notes = 'notes',
	Folders = 'folders',
}

export interface DragSource {
	kind: DragKind;
	ids: string[];
}

export interface DropTarget {
	label: string;
	allowed: boolean;
	// The element to highlight, if any. The note list shows its own insertion line instead.
	element: HTMLElement|null;
}

export interface DragFeedback {
	source: DragSource|null;
	target: DropTarget|null;
}

type Listener = ()=> void;

let feedback: DragFeedback = { source: null, target: null };
// The target reported during the current dragover event. DragGhost resets it before the event reaches the
// handlers (capture phase) and publishes it afterwards (bubble phase), so that leaving every target clears it.
let pendingTarget: DropTarget|null = null;
const listeners = new Set<Listener>();

const emit = () => {
	for (const listener of listeners) listener();
};

export const subscribe = (listener: Listener) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

export const getFeedback = () => feedback;

export const startDrag = (source: DragSource) => {
	feedback = { source, target: null };
	emit();
};

export const draggedIds = (kind: DragKind) => {
	return feedback.source?.kind === kind ? feedback.source.ids : [];
};

export const setDropTarget = (target: Omit<DropTarget, 'element'>|null, element: HTMLElement|null = null) => {
	pendingTarget = target ? { ...target, element } : null;
};

export const resetPendingTarget = () => {
	pendingTarget = null;
};

export const publishPendingTarget = () => {
	const current = feedback.target;
	const next = pendingTarget;
	const same = current === next || (current && next && current.label === next.label && current.allowed === next.allowed && current.element === next.element);
	if (same) return;
	feedback = { ...feedback, target: next };
	emit();
};

export const endDrag = () => {
	pendingTarget = null;
	if (!feedback.source && !feedback.target) return;
	feedback = { source: null, target: null };
	emit();
};
