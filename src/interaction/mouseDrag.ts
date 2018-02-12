import clean from 'utils/clean';
import fire from 'utils/fire';

export default function draggable ( viewBox ) {
	var svg,
		lastX,
		lastY;

	svg = viewBox.svg;

	function mousedownHandler ( event ) {
		// we don't care about right-clicks etc
		if ( event.which !== undefined && event.which !== 1 ) return;

		fire( viewBox, 'dragstart' );

		lastX = event.clientX;
		lastY = event.clientY;

		window.addEventListener( 'mousemove', mousemoveHandler, false );
		window.addEventListener( 'mouseup', mouseupHandler, false );
	}

	function mousemoveHandler ( event ) {
		event.preventDefault(); // prevents user from selecting other parts of the document

		viewBox.pan( ( event.clientX - lastX ), ( event.clientY - lastY ) );

		fire( viewBox, 'dragmove' );

		lastX = event.clientX;
		lastY = event.clientY;
	}

	function mouseupHandler ( event ) {
		fire( viewBox, 'dragend' );

		window.removeEventListener( 'mousemove', mousemoveHandler, false );
		window.removeEventListener( 'mouseup', mouseupHandler, false );
	}

	svg.addEventListener( 'mousedown', mousedownHandler, false );
}
