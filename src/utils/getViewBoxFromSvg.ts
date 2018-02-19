import parseViewBox from './parseViewBox';

export default function getViewBoxFromSvg(svg: SVGSVGElement) {
	const viewBoxAttr = svg.getAttribute('viewBox');

	if (viewBoxAttr) {
		return parseViewBox(viewBoxAttr);
	}

	let width = +svg.getAttribute('width');
	let height = +svg.getAttribute('height');

	if (!width && !height) {
		const boundingClientRect = svg.getBoundingClientRect();
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
