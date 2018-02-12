import rAF from 'utils/rAF';
import now from 'utils/now';

export default function applyInertia ( viewBox ) {
	var time, v, elapsed, absoluteVelocity, attenuation;

	if ( !viewBox.inertia || !viewBox._velocity ) {
		return;
	}

	v = viewBox._velocity;

	time = now();
	elapsed = ( time - v.t );

	viewBox.pan( v.x * elapsed, v.y * elapsed );

	attenuation = Math.pow( 0.99, elapsed );

	v.x *= attenuation;
	v.y *= attenuation;

	absoluteVelocity = Math.sqrt( v.x * v.x + v.y * v.y );

	if ( absoluteVelocity < 0.001 ) {
		return;
	}

	v.t = time;
	rAF( viewBox._applyInertia );
};
