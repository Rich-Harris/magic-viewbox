export default function parseViewBox(str: string) {
	const [x, y, width, height] = str.split(' ');

	return {
		x: +x,
		y: +y,
		width: +width,
		height: +height
	};
};
