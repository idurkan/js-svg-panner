/**************************************************************************

Copyright 2013 Ian Durkan <ian.durkan@gmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

**************************************************************************/

"use strict";

var svgPanner = (function() {
	// the current transformation matrix to SVG coordinates
	var currentTfMatrix;

	// TODO: set minimum and maximum scale parameters
	// TODO: allow user to add handlers for panning and zooming.
	// TODO: allow user to set initial scale and translation transform.
	// TODO: test in Firefox, IE, Safari browsers

	var targetSvgSel;
	var targetSvg;
	var targetGroup;

	var zoomScale = 0.30;
	var doZoom = true;

	var nowPanning = false;
	var panStartCoords;

	function setTargetGroup(queryString) {
		var groupSel = $(queryString);
		init(groupSel);
	}

	function init(groupSel) {
		targetGroup = groupSel[0];
		targetSvgSel = groupSel.parent('svg');
		targetSvg = targetSvgSel[0];

		currentTfMatrix = targetGroup.getCTM().inverse();
		
		addMouseHandlers();
	}

	function setSettings(settings) {
		zoomScale = settings.zoomScale || 0.30;
		doZoom = settings.doZoom && true;
		console.log('foo');
	}

	function addMouseHandlers() {
		targetSvgSel.on('mouseup', onMouseUp);
		targetSvgSel.on('mousedown', onMouseDown);
		targetSvgSel.on('mousemove', onMouseMove);
		targetSvgSel.on('mousewheel', onMouseWheel);
		targetSvgSel.on('wheel', onMouseWheel);
	}

	function getSvgElem() {
		return targetSvg
	}

	function getPointForEvent(event) {
		var point = targetSvg.createSVGPoint();
		point.x = event.clientX;
		point.y = event.clientY;
		return point;
	}

	function onMouseUp(event) {
		event.preventDefault();

		if (nowPanning) {
			nowPanning = false;
		}
	}

	function onMouseDown(event) {
		event.preventDefault();

		if (!nowPanning) {
			nowPanning = true;
		}

		currentTfMatrix = targetGroup.getCTM().inverse();
		panStartCoords = getPointForEvent(event);
	}

	function onMouseMove(event) {
		event.preventDefault();
		var curClientCoords;

		if (nowPanning) {
			curClientCoords = getPointForEvent(event);
			setTransformMatrix(currentTfMatrix.translate(panStartCoords.x - curClientCoords.x, panStartCoords.y - curClientCoords.y).inverse())
		}
	}

	function onMouseWheel(event) {
		event.preventDefault();

		if (!doZoom || nowPanning) {
			return;
		}

		var delta = event.originalEvent.wheelDelta / 360
		var zoomFactor = Math.pow(1 + zoomScale, delta);

		var mousePoint = getPointForEvent(event);

		// point in SVG coord system
		var svgPoint = mousePoint.matrixTransform(targetGroup.getCTM().inverse());

		var adjustmentMatrix = targetSvg.createSVGMatrix().translate(svgPoint.x, svgPoint.y).scale(zoomFactor).translate(-svgPoint.x, -svgPoint.y);

		// update matrix going to screen coords
        setTransformMatrix(targetGroup.getCTM().multiply(adjustmentMatrix));

        // store inverse matrix going to SVG coords...
        currentTfMatrix = currentTfMatrix.multiply(adjustmentMatrix.inverse());
	}

	function setTransformMatrix(matrix) {
		var matrixStr = "matrix(" + [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].join() + ")";
		targetGroup.setAttribute('transform', matrixStr);
	}

	function svgToClientCoords(x, y) {
		var svgPoint = targetSvg.createSVGPoint();
		svgPoint.x = x;
		svgPoint.y = y;

		return svgPoint.matrixTransform(currentTfMatrix.inverse());
	}

	function clientToSvgCoords(x, y) {
		var svgPoint = targetSvg.createSVGPoint();
		svgPoint.x = x;
		svgPoint.y = y;

		return svgPoint.matrixTransform(currentTfMatrix);
	}

	function addPanStartListener(listener) {

	}

	function addPanEndListener(listener) {

	}

	function addZoomChangeListener(listener) {

	}

	return {
		setTargetGroup: setTargetGroup,
		setSettings: setSettings,

		svgToClientCoords: svgToClientCoords,
		clientToSvgCoords: clientToSvgCoords,

		addPanStartListener: addPanStartListener,
		addPanEndListener: addPanEndListener,

		addZoomChangeListener: addZoomChangeListener,

		getSvgElem: getSvgElem
	}
})();

