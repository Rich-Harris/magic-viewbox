// These are a subset of the easing equations found at
// https://raw.github.com/danro/easing-js - license info
// follows:

// --------------------------------------------------
// easing.js v0.5.4
// Generic set of easing functions with AMD support
// https://github.com/danro/easing-js
// This code may be freely distributed under the MIT license
// http://danro.mit-license.org/
// --------------------------------------------------
// All functions adapted from Thomas Fuchs & Jeremy Kahn
// Easing Equations (c) 2003 Robert Penner, BSD license
// https://raw.github.com/danro/easing-js/master/LICENSE
// --------------------------------------------------

// In that library, the functions named easeIn, easeOut, and
// easeInOut below are named easeInCubic, easeOutCubic, and
// (you guessed it) easeInOutCubic.

export default {
	linear: (pos: number) => pos,

	easeIn: (pos: number) => Math.pow(pos, 3),

	easeOut: (pos: number) => Math.pow(pos - 1, 3) + 1,

	easeInOut: (pos: number) => {
		if ((pos /= 0.5) < 1) {
			return 0.5 * Math.pow(pos, 3);
		}

		return 0.5 * (Math.pow(pos - 2, 3) + 2);
	}
};
