import mouseDrag from './interaction/mouse';
import touch from './interaction/touch';
import Tween from './animation/Tween';
import VanWijk from './animation/VanWijk';

import easing from './utils/easing';
import getViewBoxFromSvg from './utils/getViewBoxFromSvg';

import { AnimationOptions, Box, Constraints, Point, ViewBoxOptions, StoppablePromise, SVG } from './interfaces';

export default class ViewBox {
	svg: SVG;
	constraints: Constraints;

	inertia: boolean;

	x: number;
	y: number;
	width: number;
	height: number;

	animation: Tween | VanWijk;

	_dirty: boolean;
	_elWidth: number;
	_elHeight: number;
	_aspectRatio: number;
	_ctm: SVGMatrix;
	_velocity: { x: number, y: number, t: number };

	_callbacks: Record<string, Array<(vb: ViewBox) => void>>;

	constructor(svg: SVG, options: ViewBoxOptions = {}) {
		if (!(svg instanceof SVGSVGElement)) {
			throw new Error('First argument must be an svg element');
		}

		this.svg = svg;
		this.constraints = options.constraints || {};

		window.addEventListener('resize', () => this.dirty());
		window.addEventListener('scroll', () => this.dirty());

		const initialViewBox = getViewBoxFromSvg(this.svg);

		if ('x' in options) initialViewBox.x = options.x;
		if ('y' in options) initialViewBox.y = options.y;
		if ('width' in options) initialViewBox.width = options.width;
		if ('height' in options) initialViewBox.height = options.height;

		this._dirty = true;
		this._clean();

		this.set(initialViewBox);

		// set up interactions
		this.inertia = !!options.inertia;

		// mouse interactions
		if (options.mouseDrag) {
			mouseDrag(this);
		}

		// touch interactions
		if ('ontouchstart' in this.svg) {
			if (
				options.singleFingerDrag ||
				options.twoFingerDrag ||
				options.pinchZoom
			) {
				touch(this, options);
			}
		}

		this._callbacks = {};
	}

	animate({ x = this.x, y = this.y, width = this.width, height = this.height }, options: AnimationOptions) {
		this._clean();

		if (this.animation) this.animation.stop();

		const box = this._constrain(x, y, width, height);

		const easingFn =
			(typeof options.easing === 'function'
				? options.easing
				: easing[options.easing]) || easing.easeOut;

		const promise: StoppablePromise<any> = new Promise((fulfil) => {
			this.animation = options.smooth ?
				new VanWijk(this, box, options, easingFn, fulfil) :
				new Tween(this, box, options, easingFn, fulfil);
		});

		promise.stop = () => this.animation.stop();

		return promise;
	}

	dirty() {
		// register as dirty whenever user resizes or scrolls (manually invoke using
		// the viewBox.dirty() method)
		this._dirty = true;
	}

	getClientCoords({ x, y }: { x: number, y: number }) {
		this._clean();

		const ctm = this._ctm;

		return {
			x: x * ctm.a + ctm.e,
			y: y * ctm.a + ctm.f
		};
	}

	getSvgCoords({ x, y }: { x: number, y: number }) {
		this._clean();

		const ctm = this._ctm;

		return {
			x: (x - ctm.e) / ctm.a,
			y: (y - ctm.f) / ctm.a
		};
	}

	getZoom() {
		this._clean();
		return Math.min(this._elWidth / this.width, this._elHeight / this.height);
	}

	on(eventName: string, callback: (vb: ViewBox) => void) {
		const callbacks = (this._callbacks[eventName] || (this._callbacks[eventName] = []));
		callbacks.push(callback);

		return {
			cancel: () => {
				const index = callbacks.indexOf(callback);
				if (~index) callbacks.splice(index, 1);
			}
		};
	}

	pan(dx: number, dy: number, animate?: AnimationOptions) {
		this._clean();

		const zoom = this.getZoom();

		const newX = this.x - dx / zoom;
		const newY = this.y - dy / zoom;

		const box = this._constrain(newX, newY, this.width, this.height);

		if (animate) {
			this.animate(box, animate);
		} else {
			this.set(box);
		}
	}

	set({ x = this.x, y = this.y, width = this.width, height = this.height }) {
		this._clean();

		const box = this._constrain(x, y, width, height);

		if (this.x === box.x && this.y === box.y && this.width === box.width && this.height === box.height) {
			return;
		}

		this.x = box.x;
		this.y = box.y;
		this.width = box.width;
		this.height = box.height;

		this.svg.setAttribute('viewBox', this.toString());
		this._dirty = true;
	}

	toString() {
		return `${this.x} ${this.y} ${this.width} ${this.height}`;
	}

	zoom({ x, y, factor }: { x: number, y: number, factor: number }, animate?: AnimationOptions) {
		if (isNaN(x) || isNaN(y) || isNaN(factor)) {
			throw new Error(
				'Bad arguments: ' + Array.prototype.slice.call(arguments).join(', ')
			);
		}

		const coords = this.getSvgCoords({ x, y });

		const { constraints } = this;

		// make sure we don't zoom past the maximum...
		if (constraints.maxZoom !== undefined) {
			factor = Math.min(factor, constraints.maxZoom / this.getZoom());
		}

		// ... or the minimum
		if (constraints.left !== undefined && constraints.right !== undefined) {
			const maxWidth = constraints.right - constraints.left;
			factor = Math.max(factor, this.width / maxWidth);
		}

		if (constraints.top !== undefined && constraints.bottom !== undefined) {
			const maxHeight = constraints.bottom - constraints.top;
			factor = Math.max(factor, this.height / maxHeight);
		}

		const x1_to_cx = coords.x - this.x;
		const y1_to_cy = coords.y - this.y;

		const zoomed = {
			x: coords.x - (x1_to_cx / factor),
			y: coords.y - (y1_to_cy / factor),
			width: this.width / factor,
			height: this.height / factor
		};

		const box = this._constrain(zoomed.x, zoomed.y, zoomed.width, zoomed.height);

		if (animate) {
			this.animate(box, animate);
		} else {
			this.set(box);
		}
	}

	_clean() {
		if (!this._dirty) return;

		this._elWidth = this.svg.offsetWidth;
		this._elHeight = this.svg.offsetHeight;

		if (this._elWidth === undefined) {
			// We must be in FireFox. Goddammit.
			const computedStyle = getComputedStyle(this.svg);

			this._elWidth = stripPx(computedStyle.width);
			this._elHeight = stripPx(computedStyle.height);
		}

		this._aspectRatio = this._elWidth / this._elHeight;
		this._ctm = this.svg.getScreenCTM();
		this._dirty = false;
	}

	_constrain(x: number, y: number, width: number, height: number) {
		const desiredAspectRatio = width / height;

		const { _elWidth, _elHeight, constraints } = this;

		const maximised = this._maximise(x, y, width, height, _elWidth / _elHeight);

		const currentZoom = _elWidth / maximised.width;

		let maxZoomFactor = 1;

		// If we're past the maxZoom, we need to zoom out
		if (constraints.maxZoom !== undefined && currentZoom > constraints.maxZoom) {
			maxZoomFactor = constraints.maxZoom / currentZoom;
		}

		// But if we violate our bounds, we need to zoom in
		const minZoomX = (constraints.left !== undefined && constraints.right !== undefined)
			? _elWidth / (constraints.right - constraints.left)
			: 0;

		const minZoomY = (constraints.top !== undefined && constraints.bottom !== undefined)
			? _elHeight / (constraints.bottom - constraints.top)
			: 0;

		const minZoom = Math.max(minZoomX || 0, minZoomY || 0);

		// Bounds take priority over maxZoom
		const zoomFactor = Math.max(minZoom / currentZoom, maxZoomFactor);

		if (zoomFactor !== 1) {
			// Apply zoom
			const cx = maximised.x + maximised.width / 2;
			const cy = maximised.y + maximised.height / 2;

			maximised.width /= zoomFactor;
			maximised.height /= zoomFactor;

			maximised.x = cx - maximised.width / 2;
			maximised.y = cy - maximised.height / 2;
		}

		// Ensure that we're in bounds
		if (constraints.left !== undefined && maximised.x < constraints.left) {
			maximised.x = constraints.left;
		}

		if (
			constraints.right !== undefined &&
			maximised.x + maximised.width > constraints.right
		) {
			maximised.x = constraints.right - maximised.width;
		}

		if (constraints.top !== undefined && maximised.y < constraints.top) {
			maximised.y = constraints.top;
		}

		if (
			constraints.bottom !== undefined &&
			maximised.y + maximised.height > constraints.bottom
		) {
			maximised.y = constraints.bottom - maximised.height;
		}

		// Minimise the result, so it better matches the user's intentions (i.e. same aspect ratio)
		return this._minimise(
			maximised.x,
			maximised.y,
			maximised.width,
			maximised.height,
			desiredAspectRatio
		);
	}

	_maximise(x: number, y: number, width: number, height: number, containerAspectRatio: number): Box {
		const maximised: Box = {};

		if (width / height < containerAspectRatio) {
			// preserve height
			maximised.width = height * containerAspectRatio;
			maximised.height = height;

			maximised.x = x - (maximised.width - width) / 2;
			maximised.y = y;
		} else {
			// preserve width
			maximised.width = width;
			maximised.height = width / containerAspectRatio;

			maximised.x = x;
			maximised.y = y - (maximised.height - height) / 2;
		}

		return maximised;
	}

	_minimise(x: number, y: number, width: number, height: number, originalAspectRatio: number): Box {
		const minimised: Box = {};

		if (width / height > originalAspectRatio) {
			// preserve height
			minimised.width = height * originalAspectRatio;
			minimised.height = height;

			minimised.x = x + (width - minimised.width) / 2;
			minimised.y = y;
		} else {
			// preserve width
			minimised.width = width;
			minimised.height = width / originalAspectRatio;

			minimised.x = x;
			minimised.y = y + (height - minimised.height) / 2;
		}

		return minimised;
	}

	_applyInertia() {
		if (!this.inertia || !this._velocity) {
			return;
		}

		const v = this._velocity;

		const time = window.performance.now();
		const elapsed = time - v.t;

		this.pan(v.x * elapsed, v.y * elapsed);

		const attenuation = Math.pow(0.99, elapsed);

		v.x *= attenuation;
		v.y *= attenuation;

		const absoluteVelocity = Math.sqrt(v.x * v.x + v.y * v.y);
		if (absoluteVelocity < 0.001) return;

		v.t = time;
		requestAnimationFrame(() => this._applyInertia());
	}

	_fire(eventName: string) {
		const callbacks = this._callbacks[eventName];
		if (!callbacks) return;

		callbacks.slice().forEach(callback => {
			callback(this);
		});
	}
}

function stripPx(length: string) {
	return +(length.replace('px', ''));
}