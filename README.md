js-svg-pannner is a Javascript module that easily enables panning and zooming of SVG content that is "inline" in your HTML/DOM structure.  For now, it cannot deal with SVG included via `<embed>`, `<object>`, or `<img>`.
 
To use it, include svg-panner.js in your HTML, then specify the path to the SVG `<g>` element whose contents you want to pan by calling svgPanner.setTargetGroup with an appropriate JQuery path string.  A transform will be applied to the `<g>` that scales and translates it during user mouse interactions.

See tester.html in the repository root directory for an example.

js-svg-pannner currently depends on JQuery.  I've only tested it against jquery-1.10.2.

I've verified js-svg-panner works in IE 11, Firefox 16, Firefox 25, Chrome 23, and Chrome 31 on desktop/laptop.  I've done no testing against Safari or any mobile browser.