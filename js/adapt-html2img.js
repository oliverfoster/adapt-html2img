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


	var html2img = function($element, callback, prerender) {

		if ($("html").hasClass("ie8")) {
		    console.log("html2img not supported in ie8");
		    return;
		}
		
		var html = $element[0].outerHTML;
		var clone = $(html);
		clone.addClass("html2img").css({
			position: "fixed",
			"top": ($(window).height() + 2000) + "px",
			"bottom": "auto" 
		});

		var par = $element.parent();
		par.append(clone);

		if (typeof prerender == "function") prerender(clone);

		html2canvas(clone, {
		    onrendered: function(canvas) {
		    	if (typeof callback === "function") callback(canvas.toDataURL());
		        clone.remove();
		    },
		    offset_top: -$(window).height() - 2000
		});

	};

	window.html2img = html2img;

});
