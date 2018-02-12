import parseViewBox from 'utils/parseViewBox';

export default function getViewBoxFromSvg(svg) {
	var viewBoxAttr, width, height, boundingClientRect;

	viewBoxAttr = svg.getAttribute('viewBox');

	if (viewBoxAttr) {
		return parseViewBox(viewBoxAttr);
	}

	width = svg.getAttribute('width');
	height = svg.getAttribute('height');

	if (!width && !height) {
		boundingClientRect = svg.getBoundingClientRect();
		width = boundingClientRect.width;
		height = boundingClientRect.height;
	}

	return {
		x: 0,
		y: 0,
		width: width || 100,
		height: height || 100
	};
}
