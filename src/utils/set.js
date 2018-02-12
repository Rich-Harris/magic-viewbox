export default function set ( viewBox, box ) {
	var i, len;

	if (
		viewBox.x === box.x &&
		viewBox.y === box.y &&
		viewBox.width === box.width &&
		viewBox.height === box.height
	) {
		return;
	}

	viewBox.x = box.x;
	viewBox.y = box.y;
	viewBox.width = box.width;
	viewBox.height = box.height;

	viewBox.svg.setAttribute( 'viewBox', viewBox.toString() );
	viewBox._dirty = true;

	len = viewBox._observers.length;
	for ( i = 0; i < len; i += 1 ) {
		viewBox._observers[i]( viewBox );
	}
};
