import ViewBox from '../index';
import { TouchOptions } from '../interfaces';

const now = () => window.performance.now();

type Finger = {
	x: number;
	y: number;
	px: number;
	py: number;
	vx: number;
	vy: number;
	dx: number;
	dy: number;
	t: number;
	id: number;
	inactive?: boolean;
};

export default function setupTouch(vb: ViewBox, options: TouchOptions) {
	var zoom,
		action;

	const svg = vb.svg;

	const activeFingers: Finger[] = [];
	const fingerById: Record<string, Finger> = {};

	let dragging: boolean;
	let lastX: number;
	let lastY: number;

	function touchstartHandler(event: TouchEvent) {
		var touch, finger, i, time;

		time = now();

		i = event.changedTouches.length;
		while (i--) {
			touch = event.changedTouches[i];
			finger = {
				x: touch.clientX,
				y: touch.clientY,
				px: touch.clientX,
				py: touch.clientY,
				vx: 0,
				vy: 0,
				dx: 0,
				dy: 0,
				t: time,
				id: touch.identifier
			};

			activeFingers.push(finger);
			fingerById[touch.identifier] = finger;
		}

		if (!dragging) {
			window.addEventListener('touchmove', touchmoveHandler, false);
			window.addEventListener('touchend', touchendHandler, false);
			window.addEventListener('touchcancel', touchendHandler, false);

			action = {};
			dragging = true;
		}
	}

	function touchmoveHandler(event: TouchEvent) {
		var touch,
			finger,
			finger1,
			finger2,
			moved,
			i,
			time,
			elapsed,
			dx,
			dy,
			dz,
			previousDistance,
			currentDistance,
			power;

		time = now();

		i = event.changedTouches.length;
		while (i--) {
			touch = event.changedTouches[i];
			finger = fingerById[touch.identifier];

			if (!finger) {
				continue; // maybe from outside the SVG
			}

			moved = true;

			// keep track of velocity
			elapsed = time - finger.t;

			finger.vx = (touch.clientX - finger.x) / elapsed;
			finger.vy = (touch.clientY - finger.y) / elapsed;
			finger.t = time;

			finger.dx = touch.clientX - finger.x;
			finger.dy = touch.clientY - finger.y;

			finger.px = finger.x;
			finger.py = finger.y;

			finger.x = touch.clientX;
			finger.y = touch.clientY;
		}

		if (moved) {
			event.preventDefault();

			// pinch zoom, or two-finger drag?
			if (
				activeFingers.length >= 2 &&
				(options.pinchZoom || options.twoFingerDrag)
			) {
				finger1 = activeFingers[0];
				finger2 = activeFingers[1];

				if (options.twoFingerDrag || options.pinchZoom) {
					dx = (finger1.dx + finger2.dx) / 2;
					dy = (finger1.dy + finger2.dy) / 2;
				}

				if (options.pinchZoom) {
					previousDistance = Math.sqrt(
						sq(finger1.px - finger2.px) + sq(finger1.py - finger2.py)
					);
					currentDistance = Math.sqrt(
						sq(finger1.x - finger2.x) + sq(finger1.y - finger2.y)
					);

					dz = currentDistance / previousDistance;

					// heuristic - if fingers are very close, then we probably don't intend to zoom
					// TODO what should these magic numbers be on different devices?
					if (currentDistance < 140) {
						power = Math.min(currentDistance - 100, 0) / 40;
						dz = Math.pow(dz, power);
					}
				}
			} else if (activeFingers.length >= 1 && options.singleFingerDrag) {
				dx = activeFingers[0].dx;
				dy = activeFingers[0].dy;
			}

			// apply changes
			if (dx || dy) {
				vb.pan(dx, dy);
			}

			if (dz !== undefined && dz !== 1) {
				vb.zoom({
					x: (finger1.x + finger2.x) / 2,
					y: (finger1.y + finger2.y) / 2,
					factor: dz
				});
			}
		}
	}

	function touchendHandler(event: TouchEvent) {
		var touch,
			finger,
			finger1,
			finger2,
			ended,
			i,
			remainingTouches,
			newPrimaryNeeded;

		if (!dragging) {
			return;
		}

		remainingTouches = activeFingers.length;

		i = event.changedTouches.length;
		while (i--) {
			touch = event.changedTouches[i];
			finger = fingerById[touch.identifier];

			if (!finger) {
				continue; // maybe from outside the SVG
			}

			ended = true;
			remainingTouches -= 1;

			finger.inactive = true;
		}

		finger1 = activeFingers[0];

		// if we've gone from two-or-more fingers to less-than-two fingers,
		// we may need to apply inertia
		if (activeFingers.length >= 2 && remainingTouches < 2) {
			if (vb.inertia && options.twoFingerDrag && !options.singleFingerDrag) {
				finger2 = activeFingers[1];

				vb._velocity = {
					x: (finger1.vx + finger2.vx) / 2,
					y: (finger1.vy + finger2.vy) / 2,
					t: now()
				};

				requestAnimationFrame(() => vb._applyInertia());

				end();
			}
		} else if (activeFingers.length >= 1 && !remainingTouches) {
			// ditto for single-finger dragging
			if (vb.inertia && options.singleFingerDrag) {
				vb._velocity = {
					x: finger1.vx,
					y: finger1.vy,
					t: now()
				};

				requestAnimationFrame(() => vb._applyInertia());

				end();
			}
		}

		// remove newly inactive fingers
		i = activeFingers.length;
		while (i--) {
			finger = activeFingers[i];

			if (!dragging || finger.inactive) {
				activeFingers.splice(i, 1);
				fingerById[finger.id] = null;
			}
		}

		if (ended) event.preventDefault();
	}

	function end() {
		window.removeEventListener('touchmove', touchmoveHandler, false);
		window.removeEventListener('touchend', touchendHandler, false);
		window.removeEventListener('touchcancel', touchendHandler, false);

		dragging = false;
	}

	svg.addEventListener('touchstart', touchstartHandler, false);
}

function sq(num: number) {
	return num * num;
}
