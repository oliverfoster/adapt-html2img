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


	var html2img = function($element, callback, prerender, offset) {

		offset = offset || 2;

		if ($("html").hasClass("ie8")) {
		    console.log("html2img not supported in ie8");
		    return;
		}
		
		var html = $element[0].outerHTML;
		var clone = $(html);
		clone.addClass("html2img").css({
			position: "fixed",
			"top": ($(window).height()) + 200 +  "px",
			"bottom": "auto" 
		});

		var par = $element.parent();
		par.append(clone[0]);

		var scrollPos = $(window).scrollTop();
		if (scrollPos === 0 ) scrollPos = 2;

		//ipad rendering fix, part 1
		$.scrollTo( scrollPos + offset );
		
		_.delay(function(){
			//ipad rendering fix, part 2
			$.scrollTo( scrollPos - offset );

		if (typeof prerender == "function") prerender(clone);

		html2canvas(clone, {
				logging: true,
		    onrendered: function(canvas) {
			    	if (typeof callback === "function") {
			    		var dataURL = canvas.toDataURL();
			    		callback(dataURL);
			    	}
		        clone.remove();
		    },
			    offset_top: -($(window).height() + 200)
		});
		}, 500);

	};

	window.html2img = html2img;

});
