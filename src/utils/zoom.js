export default function zoom ( current, x, y, factor ) {
	var newX, newY, newWidth, newHeight, x1_to_cx, y1_to_cy;

	newWidth = current.width / factor;
	newHeight = current.height / factor;

	x1_to_cx = x - current.x;
	y1_to_cy = y - current.y;

	newX = x - ( x1_to_cx / factor );
	newY = y - ( y1_to_cy / factor );

	return {
		x: newX,
		y: newY,
		width: newWidth,
		height: newHeight
	};
};
