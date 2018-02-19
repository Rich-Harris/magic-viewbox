# magic-viewbox

You have an SVG element in your webapp. You want to do one or more of the following:

* Pan it
* Zoom it
* Translate from screen coordinates to SVG coordinates and back again

I might be the only person in the world who has ever had this problem, but in case I'm not, **magic-viewbox** is the (or at least my) solution.


## Usage

Include `<script src='https://unpkg.com/magic-viewbox'></script>` on your page (or load it from npm, or whatever). Assuming `svg` is a reference to your SVG element, create a ViewBox instance like so:

```js
let vb = new ViewBox(svg);
```

## API

```js
// Set a new viewbox. Each value is optional, and will
// fall back to the current value
vb.set({ x: 0, y: 0, width: 100, height: 100 });

// Animate to a new viewbox. Again, values are optional
let animation = vb.animate({ x, y, width, height }, {
	duration: 800,
	smooth: true
});

animation.then(() => {
	console.log('animation completed!');
});
```

TODO finish writing this...
