adapt-html2img
================

Render html to a data url "data:image/png;base64,...." and use alternative css to do so

Formation:
```
[window.]html2img($jqueryElement, callbackFunction);
```

Example:
```
html2img( $(".selector"), function(dataurl) {

	var img = $("<img>").attr("src", dataurl);
	$("body").append(img);

});
```

Using Custom CSS:
```
.selector { 
	display:inline-block;

	.icons {
		display:block;
	}
}

.selector.html2img {
	display:inline-block;

	.icons {
		display:none;
	}	
}

```





