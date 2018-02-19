import ViewBox from '../index';
import { Box, Point } from '../interfaces';

const DEFAULT_V = 0.9;
const DEFAULT_RHO = 1.42;

export default class VanWijk {
	running: boolean;

	constructor(
		vb: ViewBox,
		target: Box,
		options: { V?: number, rho?: number, step?: () => void },
		easing: (t: number) => number,
		fulfil: () => void
	) {
		const c0: Point = {
			x: vb.x + vb.width / 2,
			y: vb.y + vb.height / 2
		};

		const c1: Point = {
			x: target.x + target.width / 2,
			y: target.y + target.height / 2
		};

		const maximisedStart = vb._maximise(vb.x, vb.y, vb.width, vb.height, vb._elWidth / vb._elHeight);
		const maximisedEnd = vb._maximise(target.x, target.y, target.width, target.height, vb._elWidth / vb._elHeight);

		vb.set(maximisedStart);

		const w0 = maximisedStart.width;
		const w1 = maximisedEnd.width;

		// defaults, as per the original paper
		const V: number = options.V || DEFAULT_V;
		const rho: number = options.rho || DEFAULT_RHO;

		const aspectRatio = maximisedStart.width / maximisedStart.height;

		// the following is taken from https://gist.github.com/RandomEtc/600144
		// via https://gist.github.com/mbostock/600164. I don't understand
		// any of it.
		var u0 = 0,
			u1 = dist(c0, c1);

		// i = 0 or 1
		function b(i: number) {
			var n = sq(w1) - sq(w0) + (i ? -1 : 1) * Math.pow(rho, 4) * sq(u1 - u0);
			var d = 2 * (i ? w1 : w0) * sq(rho) * (u1 - u0);
			return n / d;
		}

		// give this a b(0) or b(1)
		function r(b: number) {
			return Math.log(-b + Math.sqrt(sq(b) + 1));
		}

		var r0 = r(b(0)),
			r1 = r(b(1)),
			S = (r1 - r0) / rho; // "distance"

		const normaliseFactor = 1 / S;

		let u = (s: number) => {
			var a = w0 / sq(rho),
				b = a * cosh(r0) * tanh(rho * s + r0),
				c = a * sinh(r0);
			return b - c + u0;
		};

		let w = (s: number) => {
			return w0 * cosh(r0) / cosh(rho * s + r0);
		};

		// special case
		if (Math.abs(u0 - u1) < 0.000001) {
			if (Math.abs(w0 - w1) < 0.000001) return;

			var k = w1 < w0 ? -1 : 1;
			S = Math.abs(Math.log(w1 / w0)) / rho;
			u = () => u0;
			w = s => w0 * Math.exp(k * rho * s);
		}

		var t0 = Date.now();
		const loop = () => {
			if (!this.running) return;
			requestAnimationFrame(loop);

			var eased, pos, width, height, complete;

			const timeNow = Date.now();
			const elapsed = (timeNow - t0) / 1000; // elapsed time in seconds
			const s = V * elapsed;

			if (s > S) {
				vb.set(target);

				if (options.step) options.step.call(vb);

				fulfil();
				return;
			}

			eased = easing(s * normaliseFactor) / normaliseFactor;

			pos = lerp2(c0, c1, (u(eased) - u0) / (u1 - u0));

			width = w(eased);
			height = width / aspectRatio;

			vb.set({
				x: pos.x - width / 2,
				y: pos.y - height / 2,
				width: width,
				height: height
			});

			if (options.step) options.step.call(vb);
		};

		this.running = true;
		loop();
	}

	stop() {
		this.running = false;
	}
}

function sq(n: number) {
	return n * n;
}

function dist(a: Point, b: Point) {
	return Math.sqrt(sq(b.x - a.x) + sq(b.y - a.y));
}

function lerp1(a: number, b: number, p: number) {
	return a + (b - a) * p;
}

function lerp2(a: Point, b: Point, p: number) {
	return { x: lerp1(a.x, b.x, p), y: lerp1(a.y, b.y, p) };
}

function cosh(x: number) {
	return (Math.exp(x) + Math.exp(-x)) / 2;
}

function sinh(x: number) {
	return (Math.exp(x) - Math.exp(-x)) / 2;
}

function tanh(x: number) {
	return sinh(x) / cosh(x);
}
