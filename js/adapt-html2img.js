/*
* adapt-html2img
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

define(function(require) {

	var Adapt = require('coreJS/adapt');
	var Backbone = require('backbone');
	var html2can = require('extensions/adapt-html2img/js/html2canvas-v0_4_1');
	var html2canMod = require('extensions/adapt-html2img/js/html2canvas-v0_4_1-ext');


	var html2img = function($element, callback) {

		if ($("html").hasClass("ie8")) {
		    console.log("html2img not supported in ie8");
		    return;
		}
		
		var html = $element[0].outerHTML;
		var clone = $(html);
		clone.addClass("html2img").css({
			position: "fixed",
			"top": "-2000px",
			"bottom": "auto" 
		});

		var par = $element.parent();
		par.append(clone);

		html2canvas(clone, {
		    onrendered: function(canvas) {
		    	if (typeof callback === "function") callback(canvas.toDataURL());
		        clone.remove();
		    },
		    offset_top: 2000
		});

	};

	window.html2img = html2img;

})

//


/*
var doc = document.implementation.createHTMLDocument("");
doc.write(html);

// You must manually set the xmlns if you intend to immediately serialize the HTML
// document to a string as opposed to appending it to a <foreignObject> in the DOM
doc.documentElement.setAttribute("xmlns", doc.documentElement.namespaceURI);

// Get well-formed markup
html = (new XMLSerializer).serializeToString(doc);
*/


/*
var canvas = document.getElementById('canvas');
var ctx    = canvas.getContext('2d');

var data   = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
               '<foreignObject width="100%" height="100%">' +
                 '<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:40px">' +
                   '<em>I</em> like <span style="color:white; text-shadow:0 0 2px blue;">cheese</span>' +
                 '</div>' +
               '</foreignObject>' +
             '</svg>';

var DOMURL = window.URL || window.webkitURL || window;

var img = new Image();
var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
var url = DOMURL.createObjectURL(svg);

img.onload = function () {
  ctx.drawImage(img, 0, 0);
  DOMURL.revokeObjectURL(url);
}

img.src = url;
*/