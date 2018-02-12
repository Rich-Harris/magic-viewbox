import ViewBox from '../index';
import { Box } from '../interfaces';

export default class Tween {
	running: boolean;

	constructor(
		vb: ViewBox,
		target: Box,
		options: { duration?: number, step: () => void },
		easing: (t: number) => number,
		fulfil: () => void
	) {
		const constrained = vb._constrain(target.x, target.y, target.width, target.height);

		const maximisedStart = vb._maximise(vb.x, vb.y, vb.width, vb.height, vb._aspectRatio);
		const maximisedEnd = vb._maximise(constrained.x, constrained.y, constrained.width, constrained.height, vb._aspectRatio);

		vb.set(maximisedStart);

		const fx = maximisedStart.x;
		const fy = maximisedStart.y;
		const fw = maximisedStart.width;
		const fh = maximisedStart.height;

		const dx = maximisedEnd.x - fx;
		const dy = maximisedEnd.y - fy;
		const dw = maximisedEnd.width - fw;
		const dh = maximisedEnd.height - fh;

		const duration: number = (options.duration !== undefined ? options.duration : 400);

		const startTime = Date.now();

		const loop = () => {
			if (!this.running) return;
			requestAnimationFrame(loop);

			const timeNow = Date.now();
			const elapsed = timeNow - startTime;

			if (elapsed > duration) {
				this.running = false;

				vb.set(constrained);

				if (options.step) {
					options.step.call(vb);
				}

				fulfil();
				return;
			}

			const t = easing(elapsed / duration);

			vb.set({
				x: fx + ( t * dx ),
				y: fy + ( t * dy ),
				width: fw + ( t * dw ),
				height: fh + ( t * dh )
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
