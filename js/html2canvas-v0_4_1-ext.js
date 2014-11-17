/*
* adapt-html2img
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Oliver Foster <oliver.foster@kineo.com>
*/

_html2canvas.Util.Bounds = function (element) {
  //return this.OffsetBounds(element);
  var clientRect, bounds = {};

  if (element.getBoundingClientRect){
    clientRect = element.getBoundingClientRect();

    // TODO add scroll position to bounds, so no scrolling of window necessary
    bounds.top = clientRect.top;
    bounds.bottom = (clientRect.top + element.offsetHeight);
    bounds.left = clientRect.left;
    bounds.width = element.offsetWidth;
    bounds.height = element.offsetHeight;
    bounds.right = bounds.left + bounds.width;
  }

  return bounds;
};

window.html2canvas = function(elements, opts) {
  if ($("html").hasClass("ie8")) {
    console.log("html2canvas not supported in ie8");
    return;
  }
  elements = (elements.length) ? elements : [elements];
  var queue,
  canvas,
  options = {
    // general
    logging: false,
    elements: elements,
    background: "#fff",

    // preload options
    proxy: null,
    timeout: 0,    // no timeout
    useCORS: false, // try to load images as CORS (where available), before falling back to proxy
    allowTaint: false, // whether to allow images to taint the canvas, won't need proxy if set to true

    // parse options
    svgRendering: false, // use svg powered rendering where available (FF11+)
    ignoreElements: "IFRAME|OBJECT|PARAM",
    useOverflow: true,
    letterRendering: false,
    chinese: false,

    // render options

    width: null,
    height: null,
    taintTest: true, // do a taint test with all images before applying to canvas
    renderer: "Canvas",

    offset_top: 0,
    offset_left: 0
  };

  options = _html2canvas.Util.Extend(opts, options);

  _html2canvas.logging = options.logging;
  options.complete = function( images ) {

    if (typeof options.onpreloaded === "function") {
      if ( options.onpreloaded( images ) === false ) {
        return;
      }
    }
    queue = _html2canvas.Parse( images, options );

    if (typeof options.onparsed === "function") {
      if ( options.onparsed( queue ) === false ) {
        return;
      }
    }

    canvas = _html2canvas.Renderer( queue, options );

    if (typeof options.onrendered === "function") {
      options.onrendered( canvas );
    }


  };

  // for pages without images, we still want this to be async, i.e. return methods before executing
  window.setTimeout( function(){
    _html2canvas.Preload( options );
  }, 0 );

  return {
    render: function( queue, opts ) {
      return _html2canvas.Renderer( queue, _html2canvas.Util.Extend(opts, options) );
    },
    parse: function( images, opts ) {
      return _html2canvas.Parse( images, _html2canvas.Util.Extend(opts, options) );
    },
    preload: function( opts ) {
      return _html2canvas.Preload( _html2canvas.Util.Extend(opts, options) );
    },
    log: _html2canvas.Util.log
  };
};


_html2canvas.Renderer.Canvas = function(options) {
  options = options || {};

  var doc = document,
  safeImages = [],
  testCanvas = document.createElement("canvas"),
  testctx = testCanvas.getContext("2d"),
  Util = _html2canvas.Util,
  canvas = options.canvas || doc.createElement('canvas');

  function createShape(ctx, args) {
    ctx.beginPath();
    args.forEach(function(arg) {
      ctx[arg.name].apply(ctx, arg['arguments']);
    });
    ctx.closePath();
  }

  function safeImage(item) {
    if (safeImages.indexOf(item['arguments'][0].src ) === -1) {
      testctx.drawImage(item['arguments'][0], 0, 0);
      try {
        testctx.getImageData(0, 0, 1, 1);
      } catch(e) {
        testCanvas = doc.createElement("canvas");
        testctx = testCanvas.getContext("2d");
        return false;
      }
      safeImages.push(item['arguments'][0].src);
    }
    return true;
  }

  function renderItem(ctx, item) {
    switch(item.type){
      case "variable":
        ctx[item.name] = item['arguments'];
        break;
      case "function":
        switch(item.name) {
          case "createPattern":
            if (item['arguments'][0].width > 0 && item['arguments'][0].height > 0) {
              try {
                ctx.fillStyle = ctx.createPattern(item['arguments'][0], "repeat");
              }
              catch(e) {
                Util.log("html2canvas: Renderer: Error creating pattern", e.message);
              }
            }
            break;
          case "drawShape":
            createShape(ctx, item['arguments']);
            break;
          case "drawImage":
            if (item['arguments'][8] > 0 && item['arguments'][7] > 0) {
              if (!options.taintTest || (options.taintTest && safeImage(item))) {
                ctx.drawImage.apply( ctx, item['arguments'] );
              }
            }
            break;
          default:
            ctx[item.name].apply(ctx, item['arguments']);
        }
        break;
    }
  }

  return function(parsedData, options, document, queue, _html2canvas) {
    var ctx = canvas.getContext("2d"),
    newCanvas,
    bounds,
    fstyle,
    zStack = parsedData.stack;

    canvas.width = canvas.style.width =  options.width || zStack.ctx.width;
    canvas.height = canvas.style.height = options.elements[0].offsetHeight;//zStack.transform.origin[1] * -1; //options.height || zStack.ctx.height;

    fstyle = ctx.fillStyle;
    ctx.fillStyle = (Util.isTransparent(zStack.backgroundColor) && options.background !== undefined) ? options.background : parsedData.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = fstyle;

    queue.forEach(function(storageContext) {
      // set common settings for canvas
      ctx.textBaseline = "bottom";
      ctx.save();

      if (storageContext.transform.matrix) {
        ctx.translate(storageContext.transform.origin[0] + options.offset_left, storageContext.transform.origin[1] + options.offset_top);
        ctx.transform.apply(ctx, storageContext.transform.matrix);
        ctx.translate(-(storageContext.transform.origin[0] + options.offset_left), -(storageContext.transform.origin[1] + options.offset_top));
      }

      if (storageContext.clip){
        ctx.beginPath();
        ctx.rect(storageContext.clip.left + options.offset_left, storageContext.clip.top + options.offset_top, storageContext.clip.width, storageContext.clip.height);
        ctx.clip();
      }

      if (storageContext.ctx.storage) {
        storageContext.ctx.storage.forEach(function(item) {
            switch (item.name) {
            case "fillStyle":
            case "save":
            case "font":
            case "textAlign":
            case "restore":
            case "globalAlpha":
            case "clip":
            case "fill":
            case "shadowColor":
            case "shadowOffsetY":
            case "shadowOffsetX":
            case "shadowBlur":
              break;
            case "drawShape":
              if (item.arguments.length > 4) break; //fixc for odd rendering in ie9
              _.each(item.arguments, function( arg , index) {
                arg.arguments[0] = arg.arguments[0] + options.offset_left;
                arg.arguments[1] = arg.arguments[1] + options.offset_top;
              });
              break;
            case "fillText":
              item.arguments[1] = item.arguments[1] + options.offset_left
              item.arguments[2] = item.arguments[2] + options.offset_top
              break;
            case "fillRect":
              item.arguments[0] = item.arguments[0] + options.offset_left
              item.arguments[1] = item.arguments[1] + options.offset_top
              break;
            case "translate":
              item.arguments[0] = item.arguments[0] + options.offset_left
              item.arguments[1] = item.arguments[1] + options.offset_top
              break;
            case "drawImage":
              item.arguments[6] = item.arguments[6] + options.offset_top;
              break;
            case "createPattern":
              if ($("html").hasClass("ie8") || $("html").hasClass("ie9")) {
                console.log("Cannot create pattern on ie8 or ie9");
                console.log(item);
                return;
              }
              break;
            default:
               console.log("Render item not supported:");
               console.log(item);
            }
            renderItem(ctx, item);
        });
      }

      ctx.restore();
    });

    Util.log("html2canvas: Renderer: Canvas renderer done - returning canvas obj");

    if (options.elements.length === 1) {
      if (typeof options.elements[0] === "object" && options.elements[0].nodeName !== "BODY") {
        // crop image to the bounds of selected (single) element
        bounds = _html2canvas.Util.Bounds(options.elements[0]);
        newCanvas = document.createElement('canvas');
        newCanvas.width = Math.ceil(bounds.width);
        newCanvas.height = Math.ceil(canvas.height);
        ctx = newCanvas.getContext("2d");

        ctx.drawImage(canvas, bounds.left, bounds.top + options.offset_top, bounds.width, canvas.height, 0, 0, bounds.width, canvas.height);
        canvas = null;
        return newCanvas;
      }
    }

    return canvas;
  };
};