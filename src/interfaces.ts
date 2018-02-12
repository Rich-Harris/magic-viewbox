export type ViewBoxOptions = {
	x?: number;
	y?: number;
	width?: number;
	height?: number;

	constraints?: Constraints;

	inertia?: boolean;
};

export type Constraints = {
	left?: number;
	top?: number;
	right?: number;
	bottom?: number;
	maxZoom?: number;
};

export type Box = {
	x?: number;
	y?: number;
	width?: number;
	height?: number;
};

export type Point = {
	x: number;
	y: number;
}