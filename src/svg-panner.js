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

var SvgPanner = function(queryString) {
    // the current transformation matrix to SVG coordinates
    this.currentTfMatrix = undefined;

    this.targetSvgSel = undefined;
    this.targetSvg = undefined;
    this.targetGroup = undefined;

    this.zoomScale = undefined;
    this.doZoom = undefined;

    this.maxZoomFactor = undefined;
    this.minZoomFactor = undefined;

    this.nowPanning = false;
    this.panStartCoords;

    this.panStartListeners = [];
    this.panEndListeners = [];
    this.zoomChangeListeners = [];

    var groupSel = $(queryString);
    this.init(groupSel);
}

SvgPanner.prototype.init = function(groupSel) {
    this.targetGroup = groupSel[0];
    this.targetSvgSel = groupSel.parent('svg');
    this.targetSvg = this.targetSvgSel[0];

    this.currentTfMatrix = this.targetGroup.getCTM().inverse();

    this.setSettings({});        
    this.addMouseHandlers();
}

SvgPanner.prototype.setSettings = function(settings) {
    this.zoomScale = settings['zoomScale'] || 0.30;
    this.doZoom = settings['doZoom'] && true;
    this.minZoomFactor = settings['minZoomFactor'] || 0.50;
    this.maxZoomFactor = settings['maxZoomFactor'] || 5.00;
}


SvgPanner.prototype.setTransformation = function(scaleFactor, transX, transY) {
    this.setTransformMatrix(this.targetSvg.createSVGMatrix().scale(scaleFactor).translate(transX, transY));
    this.currentTfMatrix = targetGroup.getCTM().inverse();
}

SvgPanner.prototype.setScale = function(scaleFactor) {
    this.setTransformMatrix(this.currentTfMatrix.inverse().scale(scaleFactor));
}

SvgPanner.prototype.setTranslation = function(transX, transY) {
    this.setTransformMatrix(this.currentTfMatrix.inverse().translate(transX, transY));
}

SvgPanner.prototype.getSvgElem = function() {
    return this.targetSvg;
}

SvgPanner.prototype.getPointForEvent = function(event) {
    var point = this.targetSvg.createSVGPoint();
    var svgElemOffset = this.targetSvgSel.offset()

    console.log('Client event coords: ' + event.originalEvent.clientX + '; ' + event.originalEvent.clientY)
    console.log('offset left/top:' + svgElemOffset.left + ', ' + svgElemOffset.top)

    point.x = event.originalEvent.clientX - svgElemOffset.left + $(window).scrollLeft();
    point.y = event.originalEvent.clientY - svgElemOffset.top + $(window).scrollTop();
    return point;
}

SvgPanner.prototype.addMouseHandlers = function() {
    this.targetSvgSel.on('mouseup', $.proxy(onMouseUp, this));
    this.targetSvgSel.on('mousedown', $.proxy(onMouseDown, this));
    this.targetSvgSel.on('mousemove', $.proxy(onMouseMove, this));
    this.targetSvgSel.on('mousewheel wheel DOMMouseScroll', $.proxy(onMouseWheel, this));
}

function onMouseUp(event) {
    this.currentTfMatrix = this.targetGroup.getCTM().inverse();

    if (this.nowPanning) {
        this.nowPanning = false;
        notify(panEndListeners, event.originalEvent);
    }
}

function onMouseDown(event) {
    this.currentTfMatrix = this.targetGroup.getCTM().inverse();
    this.panStartCoords = this.getPointForEvent(event);

    if (!this.nowPanning) {
        this.nowPanning = true;
        notify(panStartListeners, event.originalEvent);
    }
}

function onMouseMove(event) {
    var eventClientCoords;

    if (this.nowPanning) {
        eventClientCoords = this.getPointForEvent(event);
        this.setTransformMatrix(this.currentTfMatrix.translate(this.panStartCoords.x - eventClientCoords.x, this.panStartCoords.y - eventClientCoords.y).inverse())
    }
}

function onMouseWheel(event) {
    // don't scroll the page if the user rolls the wheel on a page with a scroll bar.
    event.preventDefault();

    if (!this.doZoom || this.nowPanning) {
        return;
    }

    var delta = zoomInOrOut(event);
    var zoomFactor = Math.pow(1 + this.zoomScale, delta);

    var mousePoint = this.getPointForEvent(event);

    // point in SVG coord system
    var svgPoint = mousePoint.matrixTransform(this.targetGroup.getCTM().inverse());

    var adjustmentMatrix = this.targetSvg.createSVGMatrix().translate(svgPoint.x, svgPoint.y).scale(zoomFactor).translate(-svgPoint.x, -svgPoint.y);
    var newTfMatrix = this.targetGroup.getCTM().multiply(adjustmentMatrix);

    // a and d fields control the scaling; they should be identical so check only a.
    var zoomNow = true;
    if (newTfMatrix.a < this.minZoomFactor) {
        zoomNow = false;
    } else if (newTfMatrix.a > this.maxZoomFactor) {
        zoomNow = false;
    }

    // update matrix going to screen coords
    if (zoomNow) {
        this.setTransformMatrix(newTfMatrix);

        // store inverse matrix going back to SVG coords...
        this.currentTfMatrix = this.currentTfMatrix.multiply(adjustmentMatrix.inverse());

        notify(zoomChangeListeners, event.originalEvent);
    }
}

// returns 1 if the user wants to 'zoom in' on a mouse wheel event or -1 for 'zoom out'
function zoomInOrOut(jqueryWheelEvent) {
    var origEvt = jqueryWheelEvent.originalEvent;
    return (origEvt.detail < 0 || origEvt.wheelDelta > 0 || origEvt.deltaY < 0) ? 1 : -1;
}

function notify(listenerList, event) {
    for (var i = 0, listener; listener = listenerList[i]; ++i) {
        listener(event);
    }
}

SvgPanner.prototype.setTransformMatrix = function(matrix) {
    var matrixStr = "matrix(" + [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f].join() + ")";
    this.targetGroup.setAttribute('transform', matrixStr);
}

SvgPanner.prototype.svgToClientCoords = function(x, y) {
    var svgPoint = this.targetSvg.createSVGPoint();
    svgPoint.x = x;
    svgPoint.y = y;

    return svgPoint.matrixTransform(this.currentTfMatrix.inverse());
}

SvgPanner.prototype.clientToSvgCoords = function(x, y) {
    var svgPoint = this.targetSvg.createSVGPoint();
    svgPoint.x = x;
    svgPoint.y = y;

    return svgPoint.matrixTransform(this.currentTfMatrix);
}

SvgPanner.prototype.addPanStartListener = function(listener) {
    panStartListeners.push(listener);
}

SvgPanner.prototype.addPanEndListener = function(listener) {
    panEndListeners.push(listener);
}

SvgPanner.prototype.addZoomChangeListener = function(listener) {
    zoomChangeListeners.push(listener);
}

