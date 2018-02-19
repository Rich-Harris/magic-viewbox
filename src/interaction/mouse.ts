import ViewBox from '../index';

export default function setupMouse(vb: ViewBox) {
	const svg = vb.svg;

	let lastX: number;
	let lastY: number;

	function mousedownHandler(event: MouseEvent) {
		// we don't care about right-clicks etc
		if (event.which !== undefined && event.which !== 1) return;

		vb._fire('dragstart');

		lastX = event.clientX;
		lastY = event.clientY;

		window.addEventListener('mousemove', mousemoveHandler, false);
		window.addEventListener('mouseup', mouseupHandler, false);
	}

	function mousemoveHandler(event: MouseEvent) {
		event.preventDefault(); // prevents user from selecting other parts of the document

		vb.pan(event.clientX - lastX, event.clientY - lastY);

		vb._fire('dragmove');

		lastX = event.clientX;
		lastY = event.clientY;
	}

	function mouseupHandler() {
		vb._fire('dragend');

		window.removeEventListener('mousemove', mousemoveHandler, false);
		window.removeEventListener('mouseup', mouseupHandler, false);
	}

	svg.addEventListener('mousedown', mousedownHandler, false);
}
