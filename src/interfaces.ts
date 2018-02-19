export type ViewBoxOptions = {
	x?: number;
	y?: number;
	width?: number;
	height?: number;

	constraints?: Constraints;

	inertia?: boolean;
	mouseDrag?: boolean;
	singleFingerDrag?: boolean;
	twoFingerDrag?: boolean;
	pinchZoom?: boolean;
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

export type AnimationOptions = {
	smooth?: boolean;
	V?: number;
	rho?: number;
	duration?: number;
	easing?: (t: number) => number;
	step?: () => void;
};

export interface StoppablePromise<T> extends Promise<T> {
	stop?: () => void;
}

export interface SVG extends SVGSVGElement {
	offsetWidth?: number;
	offsetHeight?: number;
}

export type TouchOptions = {
	singleFingerDrag?: boolean;
	twoFingerDrag?: boolean;
	pinchZoom?: boolean;
}