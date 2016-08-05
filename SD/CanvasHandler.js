/*
/*
 * CanvasHandler.js
 * Author: Ben Beshel, Graison Day
 * Handler for IIIF Canvases for T-PEN. 
*/

//TODO: bind mousevents to document, have canvas check if mouse exists
//TODO: move canvas order: middle canvas is shapes, top is feedback/interaction
//test

	var CanvasHandler = function () {
		
		//creates a context variable to access member functions
		var self = this;
		
		//The operation modes to select from
		self.MODES = [
			"POLY",
			"EDIT",
			"RECT",
			"CIRC",
			"ANNO",
		];
		
		//The names of op modes as they appear to the user
		self.MODE_NAMES = [
			"Polygon",
			"Edit",
			"Rectalinear",
			"Circular",
			"Annotate"
		];
		
		var dummyAnnoPointer = {
			"@id" : null,
			"@type" : "oa:Annotation",
			"@context": "http://iiif.io/api/presentation/2/context.json",
			"sandbox" : "bbeshel"
		};
		
		var dummyAnnotation = {
			"@type" : "oa:Annotation",
			"motivation" : "sc:painting",
			"@context": "http://iiif.io/api/presentation/2/context.json",
		    "sandbox" : "bbeshel",
			"resource" : {
				"@type" : "cnt:ContentAsText",
				"chars" : "<no text associated>"
			},
			"on" : null
		};
		
		var dummyPolyAnnotation = {
			"@type" : "oa:Annotation",
			"motivation" : "sc:painting",
			"@context": "http://iiif.io/api/presentation/2/context.json",
			"sandbox" : "bbeshel",	
			"resource" : {
				"@type" : "oa:SpecificResource",
				"selector" : {
					"@type" : "oa:SvgSelector",
					"chars" : null
				}
			},
			"on" : null
		};
		
		var dummyAnnotationList = {
			"@id" : null,
			"@type" : "sc:AnnotationList",
			"@context": "http://iiif.io/api/presentation/2/context.json",
			"sandbox" : "bbeshel",
			"resources" : []
		};
		
		var dummyCanvas = {
      //This will be the anchor canvas in the anchor range
          "@id" : "http://www.example.org/dummy/canvas/",
          "@type" : "sc:Canvas",
		  "@context": "http://iiif.io/api/presentation/2/context.json",
          "label" : "dummy canvas",
		  "sandbox" : "bbeshel",
          "height" : 1000,
          "width" : 1000,
          "images" : [{
              "@type" : "oa:Annotation",
              "motivation" : "sc:painting",
              "resource" : {
                "@id" : "http://lightonlens.com/wp-content/uploads/2013/07/raja_lol_gateway_arch1-2-2000x1125.jpg",
                "@type" : "dctypes:Image",
                "format" : "image/jpeg",
                "height" : 2365,
                "width" : 1579
              },
              "on" : "http://www.example.org/dummy/canvas/"
          }],
          "otherContent":[] // pretend its empty, you need to create the list for the first time, so start an array and put the annos in it.
         };

		
		/*
		The default configuration object.
		This will be overwritten by attributes of a SharedCanvas JSON-LD object when found, 
		as well as by user preferences changed live in the toolbar
		*/
		var CONFIGS = {
			anno : {
				strokeStyle : "black",
				lineWidth : 1
			},
			feedback : {
				strokeStyle : "red",
				lineWidth : 1,
				cursorSize : 1
			},
			undoLimit : 50,
			canvasScale : 1,
			snapZone : 10,
			canvasWidth : 0,
			canvasHeight : 0,
			newAnnotationList : null,
			importedAnnotations : [],
			canvasImageSrc : null,
			annotationLists : [],
			canvasData : null,
			canvasId : null
		};
		
		var updateProcedure = {
			procedures : [
				function () {
					updateAllAnnotations();
				},
				function () {
					updateLocalAnnotationJSON();
				},
				function () {
					updateAllAnnotationLists();
				},
				function () {
					updateLocalAnnotationListsJSON();
				},
				function () {
					updateNewAnnotationList();
				},
				function () {
					updateLocalNewAnnotationListJSON();
				},
				function () {
					updateCanvas();
				}
			],
			run : function () {
				this.curIndex++;
				if (this.curIndex === this.procedures.length) {
					this.end();
					$(document).trigger("handler_resetAnnoUpdateStatus");
					$(document).trigger("toolbar_updateAnnotationData");
					this.curIndex = -1;
				} else {
					this.procedures[this.curIndex]();
				}
			},
			end : function () {
				console.log(CONFIGS.annotationLists);
				console.log(CONFIGS.newAnnotationList);
				console.log(completedPaths);
				console.log("UPDATE PROCEDURE COMPLETE!!");
			},
			curIndex : -1
		};
		
		var annoListData;
		var canvasData;
		
		var receivedDataCheck = {
			image : false,
			annos : false,
			canvas : false,
			complete : function () {
				if (this.image && this.annos && this.canvas) {
					return true;
				}
				return false;
			},
			fail : function () {
				if (!this.image && !this.annos && !this.canvas) {
					return true;
				}
				return false;
			}
		};
		
		//TODO: consider moving to init
		//Object to house the toolbar and its functions
		
		var parser = new JSONparser(self);

		var tool = new CanvasHandlerToolbar(self, parser);
				
		//TODO: implement as feature
		//Used as a toggle for closing a shape on click
		var snapToClosePathBool = true;
		
		//Bool for checking if the mouse is near an anchor. Based on CONFIGS.snapZone
		var isInSnapZone = false;
		
		var mouseTimeout;
		
		//Bool for mouse down
		var isMouseDown = false;
		
		//Bool to check if mouse is inside the selected annotation to be edited
		var isInSelectedAnno = false;

		//Bool telling if an anchor has been clicked and selected
		var isAnchorSelected = false;
		
		//Bool to tell whether an object is currently being edited
		var isEditingPath = false;

		//Bool to tell if the shape being edited has already been moved
		var isShapeMoved = false;
		
		var canvasDimensionsChecks = 0;
		
		var dimensionCheckLimit = 1;
		
		var ajaxWaitState = false;
		
		var ajaxRequestQueue = [];
				
		//Universal canvas mouse position
		var mPos;
		
		//Stores the previous canvas mouse position
		var prevmPos = { x : -1, y : -1};
		
		//Container for HTML positioning, allows layering of canvases
		//Normally, I abstain from inline CSS, but for now it's okay
		var $canvasContainer = $("<div id='canvasContainer'></div>");

		//The canvas that holds the image (jQuery)
		var $imgCanvas;
		//(js)
		var imgCanvas;
		//(canvas.getContext)
		var imgCx;
			
		//The canvas that displays completed annotations
		var $anoCanvas;
		var anoCanvas;
		var anoCx;
		
		//The canvas that loads and allows creation of annotations
		var $intCanvas;
		var intCanvas;
		var intCx;
		
		//May not need
		//Used as a bool for choosing on canvas click to end the path
		var userEndedPath = false;
		
		//Stores all anchorLists that are completed
		var completedPaths = [];
		
		//Temporary storage for any annotations as anchorLists that are being edited
		var selectedPaths = [];
		
		var undoList = [];
		
		//The current index of all detected annotations in edit mode
		var selectedPathsCurIndex;
		
		//The index of the anchor in a specific annotation path that was selected
		var selectedPathsAnchorIndex;
		
		//LOOK here for list of SVG after closing a path
		//Stores HTML complete SVG tags defined by an anchor list path
		var svgTags = [];
		
		//TODO: move these to CONFIGS
		//Some styling
		var svgStrokeColor = "stroke:black;";
		var svgLineWidth = "line-width:5;";
		var svgFillStyle = "fill:none;";
		
		var svgPrefix = "<svg xmlns=\"http://www.w3.org/2000/svg\""
		var svgSuffix = "</svg>";

		/*
		Custom array-like data structure that holds information about a list of points.
		These points, called anchors, define a path, which will be used as an annotation.
		*/
		var anchorList = {
			x: [],
			y: [],
			length: 0,
			leftmost: 100000,
			rightmost: 0,
			topmost: 100000,
			bottommost: 0,
			annoListIndex: -1,
			annoIndex: -1,
			annoId: null,
			"label": null,
			"chars": null,
			"cnt:chars": null,
			type: null,
			JSON: null,
			needsUpdate: false,
			needsLocalUpdate: false,
			strokeStyle: "black",
			lineWidth: 1,
			push: function (px, py) {
				this.x.push(px);
				this.y.push(py);
				this.length++;
				
				this.updateBounds(px, py);
			},
			removeLast: function () {
				this.x.splice(this.x.length - 1, 1);
				this.y.splice(this.y.length - 1, 1);
				this.length--;
			},
			clear: function () {
				this.x = [];
				this.y = [];
				this.length = 0;
				this.leftmost = 100000;
				this.rightmost = 0;
				this.topmost = 100000;
				this.bottommost = 0;
				this.annoListIndex = -1;
				this.annoIndex = -1;
				this.annoId = null;
				this["label"] = null,
				this["chars"] = null,
				this["cnt:chars"] = null,
				this.type = null;
				this.JSON = null;
				this.needsUpdate = false;
				this.needsLocalUpdate = false;
			},
			updateBounds: function (px, py) {
				this.leftmost = px < this.leftmost ? px : this.leftmost;
				this.rightmost = px > this.rightmost ? px : this.rightmost;
				this.topmost = py < this.topmost ? py : this.topmost;
				this.bottommost = py > this.bottommost ? py : this.bottommost;
			},
			generateBounds: function () {
				this.leftmost = 100000;
				this.rightmost = 0;
				this.topmost = 100000;
				this.bottommost = 0;
				
				for (var i = 0; i < this.length; i++) {
					if (this.x[i] < this.leftmost) {
						this.leftmost = this.x[i];
					}
					if (this.x[i] > this.rightmost) {
						this.rightmost = this.x[i];
					}
					if (this.y[i] < this.topmost) {
						this.topmost = this.y[i];
					}
					if (this.y[i] > this.bottommost) {
						this.bottommost = this.y[i];
					}
				}
			},
			getBoundingBoxArea: function () {
				return Math.abs(this.rightmost - this.leftmost) * Math.abs(this.bottommost - this.topmost);
			},
			hasNewText : function () {
				if (this["chars"] != null || this["cnt:chars"] != null || this["label"] != null) {
					return true;
				}
			},
			generateJSON: function () {
				var anno;
				switch (this.type) {
					case "POLY":
						if (this.JSON == null) {
							anno = $.extend(true, {}, dummyPolyAnnotation);
							anno["on"] = CONFIGS.canvasId;
						} else {
							anno = JSON.parse(this.JSON);
						}
						var SVGstring = createSVGTag(this);
						anno["resource"]["selector"]["chars"] = SVGstring;
						console.log(SVGstring);
						//TODO: get the link of this canvas for the on property
						var xywh = convertToNativeDimensions([
							this.leftmost,
							this.rightmost,
							this.topmost,
							this.bottommost
						]);
						
						if (anno["on"] == null) {
							anno["on"] = CONFIGS.canvasId;
						}
						var on = anno["on"];
						
						if (on.search("#xywh=") > -1) {
							on = on.substring(0, on.search("#xywh="));
						} 
						
						on += "#xywh=" 
						+ xywh[0] + "," 
						+ xywh[2] + "," 
						+ (xywh[1] - xywh[0]) + "," 
						+ (xywh[3] - xywh[2]);
						
						anno["on"] = on;
						
						
						this.JSON = JSON.stringify(anno);
						
						if (this["label"] != null) {
							this.JSON = editCharsPropForJSON(this.JSON, "label", this["label"]);
						}
						if (this["chars"] != null) {
							this.JSON = editCharsPropForJSON(this.JSON, "chars", this["chars"]);
						}
						if (this["cnt:chars"] != null) {
							this.JSON = editCharsPropForJSON(this.JSON, "cnt:chars", this["cnt:chars"]);
						}
						
						break;
					case "RECT":
						//TODO: probably have a check to see if this was edited
						if (this.JSON == null) {
							anno = $.extend(true, {}, dummyAnnotation);
							var on = CONFIGS.canvasId;
						} else {
							anno = JSON.parse(this.JSON);
							var on = anno["on"];
							on = on.substring(0, on.search("#xywh="));
						}
						console.log(this.leftmost);
						console.log(this.topmost);
						console.log(this.rightmost);
						console.log(this.bottommost);
						//calculate xywh
						//TODO: check if x[0] is actually the top-left point
						var xywh = convertToNativeDimensions([
							this.leftmost,
							this.rightmost,
							this.topmost,
							this.bottommost
						]);
						
						//TODO: figure out a better way to escape # char in ajax
						on += "#xywh=" 
						+ xywh[0] + "," 
						+ xywh[2] + "," 
						+ (xywh[1] - xywh[0]) + "," 
						+ (xywh[3] - xywh[2]);
						
						anno["on"] = on;
						
						console.log(this.x);
						console.log(this.y);
						
						
						this.JSON = JSON.stringify(anno);
						
						if (this["label"] != null) {
							this.JSON = editCharsPropForJSON(this.JSON, "label", this["label"]);
						}
						if (this["chars"] != null) {
							this.JSON = editCharsPropForJSON(this.JSON, "chars", this["chars"]);
						}
						if (this["cnt:chars"] != null) {
							this.JSON = editCharsPropForJSON(this.JSON, "cnt:chars", this["cnt:chars"]);
						}
						
						break;
					default:
					
				}
			},
			//TODO: currently doesn't work, recursion etc...
			getAnnoComments : function () {
				if (this.JSON == null) {
					return "(No text associated)";
				} else {
					var anno = JSON.parse(this.JSON);
					var str = "";
					str = parser.basicCheck(anno, true);
					console.log(str);
					return str;
					
				}
			},
		};
		
	
		
		this.init = function (data) {
			
		
			//Wraps the <canvas> and the toolbar.
			var $wrapper = $("<div id='CHwrapper'>");
			$("body").append($wrapper);
			
			//Button to close the current path (deprecated?)
			// var endPathBtn = $("<button id='endCurrentPathBtn' style='position: relative;'>End Current Path</button>");
			// endPathBtn.on("click", endPath);
			// $("body").append(endPathBtn);
			//TODO: need to get image dynamically from json
			//Temporary image used for testing
			var img2 = new Image();
			img2.src = "http://norman.hrc.utexas.edu/graphics/mswaste/160 h612e 617/160_h612e_617_001.jpg";
			
			
			$imgCanvas = $("<canvas class='tpenCanvas' id='imgCanvas'>");
			imgCanvas = $imgCanvas.get(0);
			imgCx = imgCanvas.getContext("2d");
			//TODO: need to have dynamic parent to append to
			//TODO: find default ID to attach to, or take as param.
			$canvasContainer.append($imgCanvas);
			
			$anoCanvas = $("<canvas class='tpenCanvas' id='anoCanvas'>");
			anoCanvas = $anoCanvas.get(0);
			anoCx = anoCanvas.getContext("2d");
			$canvasContainer.append($anoCanvas);
			
			$intCanvas = $("<canvas class='tpenCanvas' id='intCanvas'>");
			intCanvas = $intCanvas.get(0);
			intCx = intCanvas.getContext("2d");
			$canvasContainer.append($intCanvas);
			
			
			
			
			
			$wrapper.append($canvasContainer);
			tool.init($wrapper);
			
			var dummyAnnoList = $.extend(true, {}, dummyAnnotationList);
			CONFIGS.newAnnotationList = dummyAnnoList;
			
			$(document).on("handler_execUndo", function () {
				execUndo();
			});

			//Clear the interaction canvas
			$(document).on("handler_canvasIntClear", function () {
				intCx.clearRect(0, 0, CONFIGS.canvasWidth, CONFIGS.canvasHeight);
			});
			
			//Clear the annotation canvas
			$(document).on("handler_canvasAnoClear", function () {
				anoCx.clearRect(0, 0, CONFIGS.canvasWidth, CONFIGS.canvasHeight);
			});
			
				//Changes the snap zone
			$(document).on("handler_changeSnapZone", function (e, data) {
				changeSnapZone(data);
			});
			
			//Changes line width
			$(document).on("handler_changeLineWidth", function(e, data) {
				changeLineWidth(data);
			});
			
			$(document).on("handler_changeLineColor", function(e, data){
				changeLineColor(data);
			});
			
			//Calls to save the changes made in edit mode
			$(document).on("handler_saveEditChanges", function (e) {
				saveEditChanges();
			});
			
			$(document).on("handler_resetAnnoUpdateStatus", function () {
				resetAnnoUpdateStatus();
			});
			
			$(document).on("handler_ajaxComplete", function () {
				// requestAjax();
			});
			
			$(document).on("handler_exportAllDataJSON", function () {
				//TODO: do not use this until we have checks for each annotation
				/*currently only throws together the .JSON versions 
				of each anchorList annotation in a list and adds them to the 
				CONFIGS.canvasData, then sends the request to the server
				*/
				
				var posturl, params;
				//TODO: loop through otherContent
				//TODO: update all the local json with the updated version from the server
					
				//TODO: save new annotations, new annotation lists
				generateAllJSON();
				
				updateProcedure.run();
				
				// console.log("updating annotations");
				// updateAllAnnotations();
				// console.log("updating annotations locally");
				// updateLocalAnnotationJSON();
				
				
					
				
				// console.log("updating annotationLists");
				// updateAllAnnotationLists();
				// console.log("updating annotationLists locally");
				// updateLocalAnnotationListsJSON();
				
				
				// updateNewAnnotationList();
				
				// $(document).trigger("handler_resetAnnoUpdateStatus");
				
				// console.log(completedPaths);
				// console.log(CONFIGS.annotationLists);
				// console.log(CONFIGS.newAnnotationList);
				
			});
			
			$(document).on("parser_annoDataRetrieved", function (e, data) {
				console.log("FOUND ANNO DATA");
				console.log(data);
				// CONFIGS.annotationList = jQuery.extend(true, {}, data);
				// convertAnnotations();
				receivedDataCheck.annos = true;
				// onAllDataRetrieved();
			});
			
			$(document).on("parser_canvasDataRetrieved", function (e, data) {
				console.log("FOUND CANVAS DATA");
				console.log(data);
				// CONFIGS.canvasData = jQuery.extend(true, {}, data);
				// setCanvasDimensions();
				receivedDataCheck.canvas = true;
				// onAllDataRetrieved();
			});
			
			$(document).on("parser_imageDataRetrieved", function (e, data) {
				console.log("FOUND IMAGE DATA");
				console.log(data);
				//TODO: set canvas size based on parsed info, unless missing
				//TODO: add variable image tag for onload based on parsed content
				// var img = $("<img src='http://norman.hrc.utexas.edu/graphics/mswaste/160 h612e 617/160_h612e_617_001.jpg' />");
				// CONFIGS.canvasImageSrc = data;
				// drawAndResizeImage();
				receivedDataCheck.image = true;
				// onAllDataRetrieved();
			});
			
			$(document).on("parser_allDataRetrieved", function () {
				onAllDataRetrieved();
			});
			
			$(document).on("handler_setupStatusUpdate", function () {
				
			});
			
			//Changes the mode of operation on the canvas
			$(document).on("toolbar_changeOperationMode", function (e, data) {
				tool[data].reset();
			});
			
			$(document).on("toolbar_annoItemClick", function (e, data) {
				console.log(data);
				$(document).trigger("handler_canvasIntClear");
				//Simulate a click for edit mode if we are in that mode
				//We don't want to switch the user to edit mode without knowing
				if (tool.MODE === "EDIT") {
					tool.EDIT.click(e, data);
				}
				drawPathIndicator(data);
			});
			
			$(document).on("toolbar_annoItemCharsUpdate", function (e, path, prop, comment) {
				var ind = getCompletedPathsIndex(path);
				completedPaths[ind][prop] = comment;
				completedPaths[ind].needsUpdate = true;
			}); 
			
			
			//Generic document mousemove catch and handler
			$(document).on("mousemove", function (e) {
				//Update the mouse coordinates, etc...
				moveCallback(e);
				if (!mPos) { 
					return; 
				}
				tool[tool.MODE].mousemove(e);				
			});
			
			//Generic document click catch and handler
			$(document).on("click", function (e) {
				if (!mPos) { 
					return; 
				}
				tool[tool.MODE].click(e);
			});
			
			//Generic document mousedown catch and handler
			$(document).on("mousedown", function (e) {
				clearTimeout(mouseTimeout);
				mouseTimeout = null;
				mouseTimeout = setTimeout(function () {isMouseDown = true;}, 10);
			});
			
			//Generic document mouseup catch and handler
			$(document).on("mouseup", function (e) {
				clearTimeout(mouseTimeout);
				isMouseDown = false;
				console.log("mup");
			});

			//TODO: make sure we dont call a function that doesnt exist!
			//Dynamic document keydown catch and handler
			$(document).keydown(function (e) {
				switch(e.which) {
					case 9: //space
						e.preventDefault();
						tool[tool.MODE].tab(e);
					break;
					case 13: //enter
						tool[tool.MODE].enter(e);
				}
			});
			
			
			
			
			if (data != null) {
				console.log("data wasnt null");
				parser.requestData(data);
			} else {
				// CONFIGS.canvasImageSrc = 'http://norman.hrc.utexas.edu/graphics/mswaste/160 h612e 617/160_h612e_617_001.jpg';
				// var $canvImg = $("<img src='" + CONFIGS.canvasImageSrc + "'/>");
				// $canvImg.on("load", function () {
					// //TODO: make sure size of canvas conforms to standard
					// //TODO: make sure original data preserved corresponding to JSON canvas size
					// CONFIGS.canvasWidth = $canvImg.get(0).width;
					// CONFIGS.canvasHeight = $canvImg.get(0).height;
					// setCanvasDimensions();
					// console.log(CONFIGS.canvasWidth);
					// imgCx.drawImage($canvImg.get(0), 0, 0);
				// });
			}
			
			
			
		};

		//Callback for when the parser has finished
		var onAllDataRetrieved = function () {
			alert("dat retriev");
			console.error("ALL DAT RET");
			console.trace("ALL DAT RET");
			
			
			if (receivedDataCheck.canvas) {
				var canv = parser.getCanvasJSON();
				CONFIGS.canvasData = jQuery.extend(true, {}, canv);
				CONFIGS.canvasId = parser.getCanvasId();
				$(document).trigger("toolbar_exposeCanvasId", [CONFIGS.canvasId]);
				setCanvasDimensions();
			} else {
				alert('WARNING! @type of "sc:Canvas" was not found. Page will load a default canvas of width 1000, height 1000. All updates to any annotations found will be reflected on the new canvas.' );
				//TODO: setup fallback here instead
				var dummyCan = $.extend(true, {}, dummyCanvas);
				CONFIGS.canvasData = dummyCan;
				var dummyAnnoList = $.extend(true, {}, dummyAnnotationList);
				// CONFIGS.canvasData["otherContent"].push(dummyAnnoList);
				CONFIGS.canvasId = CONFIGS.canvasData["@id"];
				setCanvasDimensions();
			}
			
			if (receivedDataCheck.image) {
				var img = parser.getCanvasImage();
				CONFIGS.canvasImageSrc = img;
				drawAndResizeImage();
			} else {
				//TODO: fallback
				CONFIGS.canvasImageSrc = CONFIGS.canvasData["images"][0]["resource"]["@id"];
				drawAndResizeImage();
			}
			
			if (receivedDataCheck.annos) {
				var annoLists = parser.getAllAnnotationListJSON();
				CONFIGS.annotationLists = $.extend(true, [], annoLists);
				var annos = parser.getAllAnnotationJSON();
				CONFIGS.importedAnnotations = $.extend(true, [], annos);
				
				convertAnnotations();
			} 
			
			//TODO: revise
			if (receivedDataCheck.complete()) {
				console.log("WE DID IT");
			} else if (receivedDataCheck.fail()) {
				console.log("WE DUMMY NOW");
				tool.setDummyState();
			}
			//TODO: remove until completed testing
			// tool.setDummyState();
			
			updateAnnotationListIndices();
			
			redrawCompletedPaths();
			
			$(document).trigger("toolbar_updateAnnotationData");
			
			pushUndo();
			// setCanvasDimensions();
			// drawAndResizeImage();
			// drawAllCanvasAnnotations();
		};
		
	
		var setCanvasDimensions = function () {
			
			var size = {
				width: window.innerWidth || document.body.clientWidth,
				height: window.innerHeight || document.body.clientHeight
			}
			
			//Grab the canvas dimensions from the parsed data
			if (CONFIGS.canvasData != null) {
				console.log("canvas data found");
				CONFIGS.canvasWidth = CONFIGS.canvasData.width
				CONFIGS.canvasHeight = CONFIGS.canvasData.height;
			}
			
			//Canvas data exists with no dimensions
			if (CONFIGS.canvasWidth === 0) {
				// alert("aw snap");
				CONFIGS.canvasWidth = 1000;
				CONFIGS.canvasHeight = 1000;
			} 
			
			console.log(CONFIGS.canvasWidth);
			console.log(CONFIGS.canvasHeight);
		
		
			var wid = CONFIGS.canvasWidth;
			var hgt = CONFIGS.canvasHeight;
			while (CONFIGS.canvasWidth < 600 && CONFIGS.canvasHeight < 400) {
				CONFIGS.canvasScale++;
				CONFIGS.canvasWidth = wid * CONFIGS.canvasScale;
				CONFIGS.canvasHeight = hgt * CONFIGS.canvasScale;
			}
			
			while (CONFIGS.canvasWidth > 1600 && CONFIGS.canvasHeight > 1000) {
				if (CONFIGS.canvasScale > 1) {
					CONFIGS.canvasScale--;
				} else {
					CONFIGS.canvasScale /= 2;
				}
				CONFIGS.canvasWidth = wid * CONFIGS.canvasScale;
				CONFIGS.canvasHeight = hgt * CONFIGS.canvasScale;
			}
			
			wid = CONFIGS.canvasWidth;
			hgt = CONFIGS.canvasHeight;
		
			
			imgCanvas.width = wid;
			imgCanvas.height = hgt;
			
			// imgCx.drawImage(canvImg.get(0), 0, 0);
			
			anoCanvas.width = wid;
			anoCanvas.height = hgt;
			intCanvas.width = wid;
			intCanvas.height = hgt;
			$canvasContainer.width(wid);
			$canvasContainer.height(hgt);
			$("#toolContainer").height(hgt);
		};
		
		var drawAndResizeImage = function () {
			if (CONFIGS.canvasImageSrc == null) {
				console.error("Warning: image source was null");
				return;
			}
			var $canvImg = $("<img src='" + CONFIGS.canvasImageSrc + "'/>");
			$canvImg.on("load", function () {
				//TODO: make sure size of canvas conforms to standard
				//TODO: make sure original data preserved corresponding to JSON canvas size
				// $canvImg.get(0).width = CONFIGS.canvasWidth;
				// $canvImg.get(0).height = CONFIGS.canvasHeight;
				imgCx.drawImage($canvImg.get(0), 0, 0, CONFIGS.canvasWidth, CONFIGS.canvasHeight);
				
			})
			.on("error", function () {
				alert("Could not retrieve image data!");
			});
		};
		
		//Converts all annotations to the anchorList type
		var convertAnnotations = function () {
			// if (CONFIGS.canvasWidth === 0 && CONFIGS.canvasHeight === 0) {
				// setTimeout(function () {
					// //TODO: remove this, we should always have canvas dimensions?
					// canvasDimensionsChecks++;
					// if (canvasDimensionsChecks === dimensionCheckLimit) {
						// CONFIGS.canvasWidth = 1000;
						// CONFIGS.canvasHeight = 1000;
						// setCanvasDimensions();
					// }
					// console.log("Warning: attempt to draw annotations failed. Reason: No canvas dimensions. Retrying...");
					// convertAnnotations();
				// }, 5000);
			// } else
			if (CONFIGS.importedAnnotations.length < 1) {
				alert("Warning: attempt to draw annotations failed. Reason: annotationList was null");
			} else {
				
				for (var i = 0; i < CONFIGS.importedAnnotations.length; i++) {
				
					var annos = CONFIGS.importedAnnotations[i];
					var ind;
					console.log(annos);
					
					
					//TODO: check the dimensions of the SVG to match canvas
					//TODO: change to convert to completedPaths only
					if (annos.hasOwnProperty("resource") && annos["resource"].hasOwnProperty("selector")) {						
						console.log("SVG");
						if (annos["resource"]["selector"].hasOwnProperty("chars")) {
							// var svgString = annos[i]["resource"]["selector"]["chars"];
							// drawSVGAnnotation(svgString);
							// var curAnno = annos[j];
							SVGToAnchor(annos, i);
							
						}
					} else if (annos.hasOwnProperty("on")) {
						console.log("rect");
						// var curAnno = annos[j];
						// console.log(curAnno);
						rectToAnchor(annos, i);
					}
				
				}
				redrawCompletedPaths();
			}
			
		};
		
		var rectToAnchor = function (annotation, annoListIndex, annoIndex) {
			console.log(annotation);
			var ind = annotation["on"].search("xywh");
			if (ind > -1) {
				var dimString = annotation["on"].substr((ind + 5));
				var dims = dimString.split(",");
				var x, y, w, h;
				x = Number(dims[0]);
				y = Number(dims[1]);
				w = Number(dims[2]);
				h = Number(dims[3]);
				
				//convert to adjusted canvas scale
				var ar = convertToAdjustedDimensions([x, y, w, h]);
				x = ar[0];
				y = ar[1];
				w = ar[2];
				h = ar[3];
				
				anchorList.clear();
				anchorList.push(x, y);
				anchorList.push((x + w), y);
				anchorList.push((x + w), (y + h));
				anchorList.push(x, (y + h));
				anchorList.push(x, y);
				
				anchorList.type = "RECT";
				anchorList.annoListIndex = annoListIndex;
				anchorList.annoIndex = annoIndex;
				anchorList.annoId = annotation["@id"];
				// TODO: determine the position in the anno list?
				// anchorList.annoListIndex =
				// drawRectalinearAnnotation(dims);
				anchorList.JSON = JSON.stringify(annotation);
				var curList = jQuery.extend(true, {}, anchorList);
				completedPaths.push(curList);
				anchorList.clear();
			} else {
				console.error("Warning: annotation 'on' property found, but could not retrieve dimensions!");
			}
		};
		
		var SVGToAnchor = function (annotation, annoListIndex, annoIndex) {
			var chars = annotation["resource"]["selector"]["chars"];
			var ind = chars.search("points");
			if (ind > -1) {
				var charSub = chars.substr(ind);
				console.log(charSub);
				var indBegin = charSub.search("\"");
				console.log(indBegin);
				charSub = charSub.substr((indBegin + 1));
				console.log(charSub);
				var indEnd = charSub.search("\"");
				console.log(indEnd);
				var pointString = charSub.substring(0, indEnd);
				console.log(pointString);
				var points = pointString.split(/[\s,]+/);
				console.log(points);
				var ar;
				//TODO: make sure the split worked
				anchorList.clear();
				for (var i = 0; i < points.length; i++) {
					points[i] = Number(points[i]);
					points[i+1] = Number(points[i+1]);
					//TODO: probably make sure we arent skipping real points
					if (!isNaN(points[i]) && !isNaN(points[i+1])) {
						ar = convertToAdjustedDimensions([points[i], points[i+1]]);
						points[i] = ar[0];
						points[i+1] = ar[1];
						anchorList.push(points[i], points[i+1]);
					}
					i++;
				}
				anchorList.type = "POLY";
				anchorList.annoListIndex = annoListIndex;
				anchorList.annoIndex = annoIndex;
				anchorList.annoId = annotation["@id"];
				anchorList.JSON = JSON.stringify(annotation);
				var curList = jQuery.extend(true, {}, anchorList);
				completedPaths.push(curList);
				anchorList.clear();
				
			}
		};
		
		var drawRectalinearAnnotation = function (dimsArray) {
			//TODO: do some checks to make sure values conform
			anoCx.beginPath();
			var x, y, w, h;
			x = Number(dimsArray[0]);
			y = Number(dimsArray[1]);
			w = Number(dimsArray[2]);
			h = Number(dimsArray[3]);
			console.log(x);
			console.log(y);
			console.log(w);
			console.log(h);
			anoCx.moveTo(x, y);
			anoCx.lineTo((x + w), y);
			anoCx.lineTo((x + w), (y + h));
			anoCx.lineTo(x, (y + h));
			anoCx.lineTo(x, y);
			anoCx.stroke();
			
			
		};
		
		var drawSVGAnnotation = function (data) {
			//TODO: maybe check for type of data input
			console.log(data);
			
			var type = determineSVGType(data);
			switch (type) {
				case "CIRC":
					alert("Found a circle SVG - currently unsupported");
					break;
				case "POLY":
					var ind = data.search("points");
					
					// var pointPairs = 
					break;
				default:
					alert("Found an SVG with an unsupported type.");
			}
			
		};
		
		var determineSVGType = function (svgString) {
			//TODO: use the configs object 
			// var types = ["cirlce", "poly"];
			var type, ind;
			for (var i = 0; i < self.MODES.length; i++) {
				ind = string.toLowerCase().indexOf(self.MODES[i]);
				if (ind > -1) {
					type = self.MODES[i];
				}
			}
			return type;
			
		};
		
		var editCharsPropForJSON = function (json, prop, comment) {
			if (typeof json === "string") {
				json = JSON.parse(json);
			}
			
			var doSearch = function (ob, prop, comment) {
				if (ob.hasOwnProperty(prop)) {
					ob[prop] = comment;
					return;
				}
				
				for (var n in ob) {
					if (Array.isArray(ob[n]) || typeof (ob[n]) === "object") {
						doSearch(ob[n], prop, comment);
					}
				}
				
			};
			doSearch(json, prop, comment);
			console.log(json);
			return JSON.stringify(json);
		};
		
		var generateAllJSON = function () {
			for (var i = 0; i < completedPaths.length; i++) {
				completedPaths[i].generateJSON();
			}
		};
		
		var updateJSON = function () {
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i].needsUpdate) {
					completedPaths[i].generateJSON();
				}
			}
		};
		
		var resetAnnoUpdateStatus = function () {
			for (var i = 0; i < completedPaths.length; i++) {
				completedPaths[i].needsUpdate = false;
			};
		};
		
		
		var pushUndo = function () {
			
			if (undoList.length > CONFIGS.undoLimit) {
				unodList.shift();
			}
			var cPath = $.extend(true, [], completedPaths);
			undoList.push(cPath);
			// $(document).trigger("toolbar_updateAnnotationData");
			console.log(undoList);
		};
		
		// var requestAjax = function (jsonType) {
			
			// while (ajaxRequestQueue.length > 0) {
				// if (!ajaxWaitState) {
					// execAjax(ajaxRequestQueue.shift(), jsonType);
					// // requestAjax(jsonType);
				// }
				// if (ajaxRequestQueue.length > 0) {
					// // requestAjax(jsonType);
				// } else {
				// }
			// }
			// $(document).trigger("handler_ajaxComplete");
		// };
		
		var execAjax = function (request, jsonType) {
				console.log(request.url);
				ajaxWaitState = true;
				$.ajax({
					url: request.url,
					type: "POST",
					dataType: "json",
					crossDomain: true,
				})
				.done(function (data) {
					console.log(data);
					if (jsonType != null) {
						switch (jsonType) {
							case "anno": 
								if(data.hasOwnProperty("@id")) {
									completedPaths[request.index].annoId = data["@id"];
								}
							break;
							case "annoLocal":
								if (request.index != null) {
									completedPaths[request.index].JSON = JSON.stringify(data);
									// var parsedJSON = JSON.parse(data);
									completedPaths[request.index].needsLocalUpdate = false;
								}
							break;
							case "annoList":
								if (data.hasOwnProperty("@id")) {
									CONFIGS.annotationLists[request.index]["@id"] = data["@id"];
								}
							break;
							case "annoListLocal":
								if (request.index != null) {
									CONFIGS.annotationLists[request.index] = data;
								}
							break;
							case "newAnnoList":
								if (data.hasOwnProperty("@id")) {
									CONFIGS.newAnnotationList["@id"] = data["@id"];
								}
							break;
							case "newAnnoListLocal":
								CONFIGS.newAnnotationList = data;
								var temp = $.extend(true, {}, CONFIGS.newAnnotationList);
								CONFIGS.annotationLists.push(temp);
								CONFIGS.newAnnotationList = null;
							break;
							case "canvas":
								CONFIGS.canvasId = data["@id"];
								$(document).trigger("toolbar_exposeCanvasId", [CONFIGS.canvasId]);
							break;
							default:
						}
					}
					ajaxWaitState = false;
					if (ajaxRequestQueue.length > 0) {
						execAjax(ajaxRequestQueue.shift(), jsonType);
					} else {
						updateProcedure.run();
					}
				})
				.fail(function (xhr, status, errorThrown) {
					console.log(status);
					console.log(errorThrown);
				});
			 
		};
		
		var saveNewAnnotations = function () {
			
		};
		
		var saveNewAnnotationList = function () {
			
		};
		
		
		
		var updateAllAnnotations = function () {
			var posturl, params;
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i].needsUpdate) {
					console.log(completedPaths[i].JSON);
					//TODO: check if valid JSON first
					// var json = JSON.parse(completedPaths[i].JSON);
				
					
						params = stripExcessJSONData(completedPaths[i].JSON);
					// // CONFIGS.canvasData["otherContent"] = CONFIGS.annotationList;
					if (completedPaths[i].annoId == null) {
						// params = JSON.stringify(json);
						// params = completedPaths[i].JSON;
						posturl = "http://165.134.241.141:80/annotationstore/anno/saveNewAnnotation.action?content=" + encodeURIComponent(params);
					} else {
						// params = completedPaths[i].JSON;
						posturl = "http://165.134.241.141:80/annotationstore/anno/updateAnnotation.action?content=" + encodeURIComponent(params);
					}
					ajaxRequestQueue.push({ url : posturl, index : i });
					
					console.log(posturl);
					
					completedPaths[i].needsUpdate = false;
					completedPaths[i].needsLocalUpdate = true;
					// $.ajax({
						// url: posturl,
						// type: "POST",
						// dataType: "json",
						// crossDomain: true,
					// })
					// .done(function (data) {
						// console.log(data);
					// })
					// .fail(function (xhr, status, errorThrown) {
						// console.log(status);
						// console.log(errorThrown);
					// });
					// CONFIGS.canvasData["otherContent"][j]["resources"].push(json);
				}
			}
			
			if (ajaxRequestQueue.length > 0) {
				execAjax(ajaxRequestQueue.shift(), "anno");
			} else {
				updateProcedure.run();
			}
			
		};
		
		var updateAnnotationList = function (curAnoListIndex) {
			var curAnnoNeedsUpdate = false;
			//check if it has the proper structure
			if (!CONFIGS.annotationLists[curAnoListIndex].hasOwnProperty("resources")) {
				alert("couldnt find the resources field in annotation list");
				console.log(CONFIGS.annotationLists[curAnoListIndex]);
				return;
			}
			// CONFIGS.annotationLists[curAnoListIndex]["resources"] = [];
			
			//loop through and add new annotations to the list
			// for (var i = 0; i < completedPaths.length; i++) {
				// if (completedPaths[i].annoListIndex === curAnoListIndex) {
					// var annoIsInList = false;
					// for (var j = 0; j < CONFIGS.annotationLists[curAnoListIndex]["resources"].length; j++) {
						// if (CONFIGS.annotationLists[curAnoListIndex]["resources"][j]["@id"] === completedPaths[i].annoId) {
							// annoIsInList = true;
						// }
					// }
					// //TODO: use this if anno was added to the current anno list
					// if (!annoIsInList) {
						// // curAnnoNeedsUpdate();
						// // var anoPointer = $.extend(true, {}, dummyAnnoPointer);
						// // anoPointer["@id"] = completedPaths[i].annoId;
						// // CONFIGS.annotationLists[i]["resources"].push(anoPointer);
					// }
				// }
			// }
			// console.log(CONFIGS.annotationLists[curAnoListIndex]);
			
			//push all new annotations to the first anno list if it exists, otherwise make a new anno list
			//TODO: maybe push this to its own function before updating anno lists
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i].annoIndex === -1) {
					if (CONFIGS.annotationLists.length > 0) {
						completedPaths[i].annoIndex = CONFIGS.annotationLists[0]["resources"].length;
						completedPaths[i].annoListIndex = 0;
						var anoPointer = $.extend(true, {}, dummyAnnoPointer);
						anoPointer["@id"] = completedPaths[i].annoId;
						CONFIGS.annotationLists[0]["resources"].push(anoPointer);
					} 
				}
			}
			
			
			
			
			//last, check if this annolist has an id
			// if (!CONFIGS.annotationLists[j].hasOwnProperty("@id")) {
				
				// params = JSON.stringify(CONFIGS.annotationLists[j]);
				// posturl = "http://165.134.241.141:80/annotationstore/anno/saveNewAnnotation.action?content=" + encodeURIComponent(params);
				// ajaxRequestQueue.push(posturl);
			// }
			
			// if (curAnnoNeedsUpdate) {
				var params = stripExcessJSONData(CONFIGS.annotationLists[curAnoListIndex]);
				posturl = "http://165.134.241.141:80/annotationstore/anno/updateAnnotation.action?content=" + encodeURIComponent(params);
				ajaxRequestQueue.push({ url : posturl, index : curAnoListIndex});
				console.log(posturl);
				// execAjax({ url : posturl }, "annoList");
			// } else {
				// updateProcedure.run();
			// }
			
			
			//TODO: update with posturl
		};
		
		
		var updateAllAnnotationLists = function () {
			if (CONFIGS.annotationLists.length === 0) {
				updateProcedure.run();
				return;
			}
			
			for (var i = 0; i < CONFIGS.annotationLists.length; i++) {
				updateAnnotationList(i);
			}
			
			if (ajaxRequestQueue.length > 0) {
				execAjax(ajaxRequestQueue.shift(), "annoList");
			} else {
				updateProcedure.run();
			}
			
			
			// requestAjax();
		};
		
		var updateLocalAnnotationJSON = function () {
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i].needsLocalUpdate) {
					// var params = completedPaths[i].JSON;
					// var annoPointer = { "@id" : null };
					// annoPointer["@id"] = completedPaths[i].annoId;
					// var params = JSON.stringify(annoPointer);
					// var posturl = "http://165.134.241.141:80/annotationstore/anno/updateAnnotation.action?content=" + encodeURIComponent(params);
					posturl = completedPaths[i].annoId;
					ajaxRequestQueue.push({ url : posturl, index : i });
				}
			}
			if (ajaxRequestQueue.length > 0) {
				execAjax(ajaxRequestQueue.shift(), "annoLocal");
			} else {
				updateProcedure.run();
			}
		};
		
		var updateLocalAnnotationListsJSON = function () {
			if (CONFIGS.annotationLists.length === 0) {
				updateProcedure.run();
				return;
			}
			
			for (var i = 0; i < CONFIGS.annotationLists.length; i++) {
				var posturl = CONFIGS.annotationLists[i]["@id"];
				ajaxRequestQueue.push({ url : posturl, index : i });
			}
			execAjax(ajaxRequestQueue.shift(),"annoListLocal");
		};
		
		var updateNewAnnotationList = function () {
			var params, posturl;
			// for (var i = 0; i < completedPaths.length; i++) {
				// if (completedPaths[i].annoListIndex === -1) {
					// var annoIsInList = false;
					// for (var j = 0; j < CONFIGS.newAnnotationList["resources"].length; j++) {
						// if (CONFIGS.newAnnotationList["resources"][j]["@id"] === completedPaths[i].annoId) {
							// annoIsInList = true;
						// }
					// }
					// if (!annoIsInList) {
						// var anoPointer = $.extend(true, {}, dummyAnnoPointer);
						// anoPointer["@id"] = completedPaths[i].annoId;
						// CONFIGS.newAnnotationList["resources"].push(anoPointer);
					// }
				// }
			// }
			// console.log(CONFIGS.newAnnotationList);
			
			//TODO: may need to consolidate this if both cases work
			// if (CONFIGS.newAnnotationList.hasOwnProperty("@id")) {
				// // params = JSON.stringify({ "@id" : CONFIGS.newAnnotationList["@id"] });
				// params = JSON.stringify(CONFIGS.newAnnotationList);
				// posturl = "http://165.134.241.141:80/annotationstore/anno/updateAnnotation.action?content=" + encodeURIComponent(params);
				// execAjax({ url : posturl }, "newAnnoList");
			// } else {
				
				
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i].annoIndex === -1) {
					//set index to where the new annotation list will be
					completedPaths[i].annoIndex = CONFIGS.newAnnotationList["resources"].length;
					completedPaths[i].annoListIndex = CONFIGS.annotationLists.length;
					var anoPointer = $.extend(true, {}, dummyAnnoPointer);
					anoPointer["@id"] = completedPaths[i].annoId;
					CONFIGS.newAnnotationList["resources"].push(anoPointer);
				}
			}
				
			//if new annotation list isnt null and has some new annotations in it
			//This is okay since new anno list gets added to official list after first update
			//CONFIGS.newAnnotationList then becomes null
			if (CONFIGS.newAnnotationList != null && CONFIGS.newAnnotationList["resources"].length > 0) {
				params = JSON.stringify(CONFIGS.newAnnotationList);
				posturl = "http://165.134.241.141:80/annotationstore/anno/saveNewAnnotation.action?content=" + encodeURIComponent(params);
				execAjax({ url : posturl } , "newAnnoList");
			} else {
				updateProcedure.run();
			}
			// }
		};
		
		var updateLocalNewAnnotationListJSON = function () {
			if (CONFIGS.newAnnotationList != null && CONFIGS.newAnnotationList["resources"].length > 0) {
				var posturl = CONFIGS.newAnnotationList["@id"];
				execAjax({ url : posturl }, "newAnnoListLocal");
			} else {
				updateProcedure.run();
			}
		};
		
		var updateCanvas = function () {
			var params, posturl;
			if (CONFIGS.canvasData.hasOwnProperty("@id")) {
				if (CONFIGS.canvasData["@id"] === "http://www.example.org/dummy/canvas/") {
					CONFIGS.canvasData["@id"] = null;
				}
			}
			
			var annoLists = $.extend(true, [], CONFIGS.annotationLists);
			
			CONFIGS.canvasData["otherContent"] = annoLists;
			
			params = stripExcessJSONData(CONFIGS.canvasData);
			if (!CONFIGS.canvasData.hasOwnProperty("@id") || CONFIGS.canvasData["@id"] == null) {
				posturl = "http://165.134.241.141:80/annotationstore/anno/saveNewAnnotation.action?content=" + encodeURIComponent(params);
			} else {
				posturl = "http://165.134.241.141:80/annotationstore/anno/updateAnnotation.action?content=" + encodeURIComponent(params);
			}
			//this seems unnecessary, but let's keep to the previous data flow
			ajaxRequestQueue.push({url : posturl });
			execAjax(ajaxRequestQueue.shift(), "canvas");
			
		};
		
		//TODO: maybe make this support redo
		var execUndo = function () {
			if (undoList.length < 1) {
				return;
			}
			
			$(document).trigger("handler_canvasAnoClear");
			$(document).trigger("handler_canvasIntClear");
			
			undoList.pop();
			var prevPaths = $.extend(true, [], undoList[undoList.length-1]);
			completedPaths = [];
			completedPaths = prevPaths;
			$(document).trigger("toolbar_updateAnnotationData");
			console.log(completedPaths);
			
			redrawCompletedPaths();
			
		};
		
		var updateAnnotationListIndices = function () {
			for (var i = 0; i < CONFIGS.annotationLists.length; i++) {
				for (var j = 0; j < CONFIGS.annotationLists[i]["resources"].length; j++) {
					for (var k = 0; k < completedPaths.length; k++) {
						if (completedPaths[k].annoId === CONFIGS.annotationLists[i]["resources"][j]["@id"]) {
							completedPaths[k].annoListIndex = i;
							completedPaths[k].annoIndex = j;
						}
					}
				}
			}
		};
		
		var convertToAdjustedDimensions = function (ar) {
			for (var i = 0; i < ar.length; i++) {
				if (typeof ar[i] === "number") {
					ar[i] = ar[i] * CONFIGS.canvasScale;
				} else {
					console.error("Error scaling item: item was not a number");
				}
			}
			return ar;
		};
		
		var convertToNativeDimensions = function (ar) {
			for (var i = 0; i < ar.length; i++) {
				if (typeof ar[i] === "number") {
					ar[i] = Math.round(ar[i] / CONFIGS.canvasScale);
				} else {
					console.error("Error scaling item: item was not a number");
				}
			}
			return ar;
		};
		
		//TODO: maybe convert the mouse coordinates to SC coordinates here?
		//Gets the mouse coordinates on the canvas
		this.getMousePos = function(evt) {
			var rect = imgCanvas.getBoundingClientRect();
			var tempX = Math.floor((evt.clientX - rect.left)/(rect.right-rect.left)*imgCanvas.width);
			var tempY = Math.floor((evt.clientY - rect.top)/(rect.bottom-rect.top)*imgCanvas.height);
			
			//checks if mouse event is within canvas bounds
			//helps with restricting event bindings
			if (CONFIGS.canvasWidth > tempX && tempX > -1 && CONFIGS.canvasHeight > tempY && tempY > -1) {
				return {
					x: tempX,
					y: tempY
				};
			} else {
				return null;
			}
		};	

		//Called on mousemove
		var moveCallback = function (e) {
			prevmPos = mPos;
			mPos = self.getMousePos(e);
			// console.log(mPos);
		};
		
		//TODO: rename this, or expand for each mode...
		//Draws the mouse pointer indicator
		var drawIndicator = function () {
			
			
			intCx.beginPath();
			//TODO: make this permanent before calls 
			intCx.lineWidth = CONFIGS.feedback.lineWidth;
			intCx.strokeStyle = CONFIGS.feedback.strokeStyle;

			//TODO: make the radius editable.
			intCx.arc(mPos.x, mPos.y, 5, 0, 360);
			intCx.stroke();
			
		};
		
		//Draws the next line in the path being created
		var continuePath = function () {
			if (anchorList.length > 1) {
				anoCx.beginPath();
				anoCx.lineWidth = CONFIGS.anno.lineWidth;
				console.log(anoCx.lineWidth);
				console.log(CONFIGS.anno.lineWidth);
				anoCx.strokeStyle = CONFIGS.anno.strokeStyle;
				anoCx.moveTo(
					anchorList.x[anchorList.length-2], 
					anchorList.y[anchorList.length-2]
				);
				anoCx.lineTo(
					anchorList.x[anchorList.length-1], 
					anchorList.y[anchorList.length-1]
				);
				anoCx.stroke();
				
			}
		};
		
		//TODO: setup so user can choose to close path
		/*
		ends the path only if it can be ended.
		This means that we have 3 anchors minimum
		Path is ended by connecting final and first anchors
		*/
		var endPath = function () {
			
			if (anchorList.length > 2) {
				anoCx.beginPath();
				anoCx.moveTo(
					anchorList.x[0],
					anchorList.y[0]
				);
				anoCx.lineTo(
					anchorList.x[anchorList.length-1],
					anchorList.y[anchorList.length-1]
				);
				anoCx.stroke();
				
				anchorList.push(anchorList.x[0], anchorList.y[0]);
				console.log(tool.MODE);
				anchorList.type = tool.MODE;
				console.log(anchorList.type);
				anchorList.generateJSON();
				console.log(anchorList);
				anchorList.needsUpdate = true;
				anchorList.strokeStyle = CONFIGS.anno.strokeStyle;
				anchorList.lineWidth = CONFIGS.anno.lineWidth;
				// completedPaths.push(clone(anchorList));
				var an = $.extend(true, {}, anchorList);
				completedPaths.push(an)
				// createSVGTag(anchorList);
				anchorList.clear();
				console.log(completedPaths);
				$(document).trigger("toolbar_updateAnnotationData");
				pushUndo();
			}
		}
		
		//TODO: possibly pass in a set of points from which an event was triggered...
		var addAnchor = function () {
			anchorList.push(mPos.x, mPos.y);
		};

		//Checks to see if we are near an anchor
		var checkIfNearAnchor = function (mousePoint, anchor) {
			//Bounding box around the anchor
			var anchorBox = {
				xMax : anchor.x + CONFIGS.snapZone, 
				xMin : anchor.x - CONFIGS.snapZone, 
				yMax : anchor.y + CONFIGS.snapZone, 
				yMin : anchor.y - CONFIGS.snapZone 
			};
			//If the mouse pos when this function was called is in the bounding box...
			if (
			mousePoint.x < anchorBox.xMax 
			&& mousePoint.x > anchorBox.xMin
			&& mousePoint.y < anchorBox.yMax 
			&& mousePoint.y > anchorBox.yMin
			) { 
				return true;
			} else {
				return false;
			}
		};
		
		//TODO: fill this in for display...
		var displayJSON = function () {
			
		};
		
		var createSVGTag = function (rawAnchors) {
			//Not sure if we need this width/height
			//TODO: possibly set width/height to SC dims
			//TODO: convert points to relative width/height of SC
			var anchors = $.extend(true, {}, rawAnchors);
			anchors.x = convertToNativeDimensions(anchors.x);
			anchors.y = convertToNativeDimensions(anchors.y);
			
			var str = svgPrefix +
				"width=\"" + anchors.rightmost + "\" " + 
				"height=\"" + anchors.bottommost + "\"" +
				">" +
				"<polygon points=\"";
				
			for (var i = 0; i < anchors.length; i++) {
				str += anchors.x[i] + "," + anchors.y[i] + " ";
			}
			str += "\"";
			// str += "style=\"" + svgLineWidth + svgStrokeColor + svgFillStyle + "\"";
			str += " />"
			str += svgSuffix;
			svgTags.push(str);
			var svg = $(str);
			
			
			console.log(svgTags);
			console.log(svg.get(0));
			return str;
		};
		
		var readSVGTag = function (tag) {
			var $tag = $.parseHTML(tag);
						
			//TODO: need to check if properties exist. hasOwnProperty doesnt work, doesnt extend object prototype.
			// if ($tag[0].hasOwnProperty("lastChild") && $tag[0].lastChild.hasOwnProperty("animatedPoints")) {
				var pList = $tag[0].lastChild.animatedPoints;
				for (var i = 0; i < pList.length; i++) {
					anchorList.push(pList[i].x, pList[i].y);
				}
			// }
			drawPath(anchorList);
			anchorList.clear();
		};
		
		var stripExcessJSONData = function (json) {
			if (typeof json === "string") {
				json = JSON.parse(json);
			}
			if (json.hasOwnProperty("@id")) {
				if (json["@id"] == null) {
					delete json["@id"];
				}
			}
			delete json.addedTime;
			delete json.originalAnnoID;
			delete json.version;
			delete json.permission;
			delete json.forkFromID;
			delete json.serverName;
			delete json.serverIP;
			delete json["_id"];
			return JSON.stringify(json);
		};
		
		
		//put more shared params here if needed
		//TODO: find a more elegant way of doing this...
		var resetSharedParams = function () {
			isInSnapZone = false;
		};

		//Deep clones an object (special thanks to stackoverflow community)
		var clone = function(obj) {
			var copy;

			// Handle the 3 simple types, and null or undefined
			if (null == obj || "object" != typeof obj) return obj;

			// Handle Date
			if (obj instanceof Date) {
				copy = new Date();
				copy.setTime(obj.getTime());
				return copy;
			}

			// Handle Array
			if (obj instanceof Array) {
				copy = [];
				for (var i = 0, len = obj.length; i < len; i++) {
					copy[i] = clone(obj[i]);
				}
				return copy;
			}

			// Handle Object
			if (obj instanceof Object) {
				copy = {};
				for (var attr in obj) {
					if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
				}
				return copy;
			}

			throw new Error("Unable to copy obj! Its type isn't supported.");

		};
		
		var getCompletedPathsIndex = function (path) {
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i] === path) {
					return i;
				}
			}
		};

	
		//Checks if the user clicked inside a completed annotation during edit mode (selected a shaoe)
		var checkIfInAnnoBounds = function (curPath, mPosCur, index) {
			if (curPath.leftmost < mPosCur.x && mPosCur.x < curPath.rightmost && curPath.topmost < mPosCur.y && mPosCur.y < curPath.bottommost) {
				var p = $.extend(true, {}, curPath);
				selectedPaths.push( { path : p, compIndex : index } );
				isInSelectedAnno = true;
			};
		};

		//Finds the smallest path that was selected in edit mode
		var findSmallestSelectedPath = function () {
			var smallestIndex = 0;
			for (var i = 0; i < selectedPaths.length; i++) {
				if (selectedPaths[smallestIndex].path.getBoundingBoxArea() > selectedPaths[i].path.getBoundingBoxArea()) {
					smallestIndex = i;
				}
			}
			
			return selectedPaths[smallestIndex];
		};
		
		//Redraws the completed shape on the interaction canvas for editing
		var drawSelectedPathIndicator = function () {
			var selectedPath = selectedPaths[selectedPathsCurIndex].path;
			drawPathIndicator(selectedPath);
		};
		
		var drawPathIndicator = function (path) {
			if (path == null) {
				return;
			}
			intCx.strokeStyle = CONFIGS.feedback.strokeStyle;
			intCx.beginPath();
			intCx.moveTo(path.x[0], path.y[0]);
			for (var i = 1; i < path.length; i++) {
				intCx.lineTo(path.x[i], path.y[i]);
			}
			intCx.stroke();
		};
			
		//Draws a given path in its entirety
		var drawPath = function (path) {
			anoCx.strokeStyle = path.strokeStyle;
			anoCx.lineWidth = path.lineWidth;
			anoCx.beginPath();
			anoCx.moveTo(path.x[0], path.y[0]);
			for (var i = 1; i < path.length; i++) {
				anoCx.lineTo(path.x[i], path.y[i]);
			}
			anoCx.stroke();
		};
		
		//Updates all the anchors on an edited path, and their bounding box
		var updateSelectedPath = function (md) {
			var cur = selectedPathsCurIndex;
			for (var i = 0; i < selectedPaths[cur].path.length; i++) {
				selectedPaths[cur].path.x[i] -= md.x;
				selectedPaths[cur].path.y[i] -= md.y;					
			}
			selectedPaths[cur].path.leftmost -= md.x;	
			selectedPaths[cur].path.rightmost -= md.x;	
			selectedPaths[cur].path.topmost -= md.y;	
			selectedPaths[cur].path.bottommost -= md.y;	
		};

		//Updates the completedPaths based on the corresponding selectedPaths
		var updateCompletedPaths = function () {
			var curInd = 0;
			for (var i = 0; i < selectedPaths.length; i++) {
				console.log(selectedPaths[i].path);
				curInd = selectedPaths[i].compIndex;
				// completedPaths[curInd] = clone(selectedPaths[i].path);
				var p = $.extend(true, {}, selectedPaths[i].path);
				completedPaths[curInd] = p;
				// CONFIGS.anno.lineWidth = selectedPaths[i].lineWidth;
				// CONFIGS.anno.strokeStyle = selectedPaths[i].strokeStyle;
			}
		};
		
		//Updates a single anchor in selectedPaths
		var updateSelectedAnchor = function (md) {
			switch (selectedPaths[selectedPathsCurIndex].path.type) {
				case "POLY":
					selectedPaths[selectedPathsCurIndex].path.x[selectedPathsAnchorIndex] -= md.x;
					selectedPaths[selectedPathsCurIndex].path.y[selectedPathsAnchorIndex] -= md.y;
					break;
				case "RECT":
					console.log(selectedPaths[selectedPathsCurIndex].path.length);
					var curInd, curIndA, adjacentIndA, adjacentIndA2;
					var Yfirst;
					curInd = selectedPathsCurIndex;
					curIndA = selectedPathsAnchorIndex;
					adjacentIndA = (curIndA + 1) % 4;
					adjacentIndA2 = (curIndA + 3) % 4;
					
					
					
					if (selectedPaths[curInd].path.x[curIndA] === selectedPaths[curInd].path.x[adjacentIndA]) {
						// Yfirst = true;
						selectedPaths[curInd].path.x[adjacentIndA] -= md.x;
						selectedPaths[curInd].path.y[adjacentIndA2] -= md.y;
					} else {
						selectedPaths[curInd].path.y[adjacentIndA] -= md.y;
						selectedPaths[curInd].path.x[adjacentIndA2] -= md.x;
						// Yfirst = false;
					}
					selectedPaths[curInd].path.x[curIndA] -= md.x;
					selectedPaths[curInd].path.y[curIndA] -= md.y;
					
					break;
				default:
			}
			selectedPaths[selectedPathsCurIndex].path.generateBounds();
		};

		//Draws the connecting edges to an anchor that is selected
		var drawSelectedAdjacentEdgesIndicator = function () {
			var path = selectedPaths[selectedPathsCurIndex].path;
			var anchInd = selectedPathsAnchorIndex;
			var lastInd = path.length - 1;
			
			intCx.beginPath();
			if (anchInd === 0) {
				// var lastA = path.x.length - 1;
				intCx.moveTo(path.x[lastInd], path.y[lastInd]);
			} else {
				intCx.moveTo(path.x[anchInd - 1], path.y[anchInd - 1]);
			}
			intCx.lineTo(path.x[anchInd], path.y[anchInd]);
			if (anchInd === (lastInd)) {
				intCx.lineTo(path.x[0], path.y[0]);
			} else {
				intCx.lineTo(path.x[anchInd + 1], path.y[anchInd + 1]);
			}
			intCx.stroke();
		};

		//Changes the snapZone in CONFIGS
		var changeSnapZone = function (val) {
			CONFIGS.snapZone = val;
		};
		

		//Changes lineWidth in CONFIGS
		var changeLineWidth = function(val) {
			CONFIGS.anno.lineWidth = val;
			//CONFIGS.feedback.lineWidth = val;
		};
		
		
		var changeLineColor = function(val) {
			if (CONFIGS.feedback.strokeStyle === "black"){
				CONFIGS.feedback.strokeStyle = "red";
			}
			switch(val){
				case "red":
					CONFIGS.anno.strokeStyle = "red";
					CONFIGS.feedback.strokeStyle = "black";
					break;
				
				case "yellow":
					CONFIGS.anno.strokeStyle = "yellow";
					break;
				
				case "green":
					CONFIGS.anno.strokeStyle = "green";
					break;
				
				case "blue":
					CONFIGS.anno.strokeStyle = "blue";
					break;
					
				/*case "purple":
					CONFIGS.anno.strokeStyle = "purple";
					break;*/
					
				case  "white":
					CONFIGS.anno.strokeStyle = "white";
					break;
				
				case "black":
					CONFIGS.anno.strokeStyle = "black";
					break;
			}
		};
		
		
		//Saves the changes made to an annotation during edit mode
		var saveEditChanges = function () {
			$(document).trigger("handler_canvasIntClear");
			
			if (isAnchorSelected) {
				addLastAnchor(selectedPaths[selectedPathsCurIndex].path);
			};
			var selectedPath = selectedPaths[selectedPathsCurIndex].path;
			var selectedPathCompletedIndex = selectedPaths[selectedPathsCurIndex].compIndex;
			
			selectedPaths[selectedPathsCurIndex].path.needsUpdate = true;
			
			redrawCompletedPaths();
			
			for (var i = 0; i < selectedPaths.length; i++) {
				drawPath(selectedPaths[i].path);
			}
			drawPath(selectedPath);
			
			updateCompletedPaths();
			updateJSON();
			// $(document).trigger("handler_resetAnnoUpdateStatus");
			$(document).trigger("toolbar_annoItemsDeHighlight");
			$(document).trigger("toolbar_updateAnnotationData");
			pushUndo();
			
			selectedPathsCurIndex = 0;
			selectedPathsAnchorIndex = null;
			selectedPaths = [];
			isInSelectedAnno = false;
			isEditingPath = false;
			isAnchorSelected = false;
			isShapeMoved = false;
			
			//TODO: update only the associated item in toolbar
		};
		
		var cancelEditChanges = function () {
			$(document).trigger("handler_canvasIntClear");
			selectedPathsCurIndex = 0;
			selectedPathsAnchorIndex = null;
			selectedPaths = [];
			isInSelectedAnno = false;
			isEditingPath = false;
			isAnchorSelected = false;
			isShapeMoved = false;
			
			
		};

		//Redraw all the shapes that were not edited
		var redrawCompletedPaths = function () {
			$(document).trigger("handler_canvasAnoClear");
			var skipPath = false;
			for (var i = 0; i < completedPaths.length; i++) {
				for (var j = 0; j < selectedPaths.length; j++) {
					if (selectedPaths[j].compIndex === i) {
						skipPath = true;
					}
				}
				if (!skipPath) {
					var currentLineWidth = CONFIGS.anno.lineWidth;
					var currentStrokeStyle = CONFIGS.anno.strokeStyle;
					//CONFIGS.anno.lineWidth = completedPaths[i].lineWidth;
					//CONFIGS.anno.strokeStyle = completedPaths[i].path.strokeStyle;
					drawPath(completedPaths[i]);
					//CONFIGS.anno.lineWidth = currentLineWidth;
					//CONFIGS.anno.strokeStyle = currentStrokeStyle;
				}
				skipPath = false;
			}
			// $(document).trigger("toolbar_updateAnnotationData");
		};
		
		//Sorts selected list of shapes by bounding box area
		var sortSelectedBBAscending = function (list) {
			var newList = [];
			var smallestInd = 0;
			var curInd = 1;
			var temp;
			while (list.length > 1) {
				if (list[smallestInd].path.getBoundingBoxArea() > list[curInd].path.getBoundingBoxArea()) {
					smallestInd = curInd;
				}
				
				curInd++;
				
				if (curInd === list.length) {
					temp = list.splice(smallestInd, 1);
					newList.push(temp[0]);
					smallestInd = 0;
					curInd = 1;
				}
			}
			//push the final element here
			temp = list.splice(0, 1);
			newList.push(temp[0]);
			
			selectedPaths = newList;
			
		};

		//Check if the next click was near an anchor's snapZone in a selected path
		var checkSelectedPathAnchors = function () {
			var mousePoint = mPos;
			var path = selectedPaths[selectedPathsCurIndex].path;
			for (var i = 0; i < path.length; i++) {
				var anchor = {
					x : path.x[i],
					y : path.y[i]
				};
				if (checkIfNearAnchor(mousePoint, anchor)) {

				//TODO: set up list of selected points
					isAnchorSelected = true;
					if (i === (path.length - 1)) {
						selectedPathsAnchorIndex = 0;
					} else {
						selectedPathsAnchorIndex = i;
					}
				}
			}
		};

		//Removes the last point so we dont start editing it if it is a duplicate of first
		var removeLastAnchorIfDuplicate = function (path) {
			if (path.x[0] === path.x[path.length - 1]
			&& path.y[0] === path.y[path.length - 1]) {
				path.removeLast();
			}

		};
		
		//Add the last anchor as a duplicate of the first one for SVG
		var addLastAnchor = function (path) {
			var pointX = path.x[0];
			var pointY = path.y[0];
			path.push(pointX, pointY);
		};
		
		self.getCompletedPaths = function () {
			return completedPaths;
		};
		
		//initialize modes to allow function expansion
		tool.POLY = Object.create(null);
		tool.EDIT = Object.create(null);
		tool.RECT = Object.create(null);
		
		tool.POLY.mousemove = function (e) {
			$(document).trigger("handler_canvasIntClear");
			drawIndicator();
			
			var x, y;
			//Checks to see if we should force the indicator to a snap point
			if (snapToClosePathBool && anchorList.length > 1) {
				var anchor = { 
					x : anchorList.x[0],
					y : anchorList.y[0]
				};
				if (checkIfNearAnchor(mPos, anchor)) {
					isInSnapZone = true;
					x = anchorList.x[0];
					y = anchorList.y[0];
				}
			}
			
			//Not near snap zone, so draw the indicator normally.
			if (x == null && y == null) {
				isInSnapZone = false;
				x = mPos.x;
				y = mPos.y;
			}
			

			//Draw the line from the previous anchor to mPos/snap point
			if (anchorList.length > 0) {
				intCx.beginPath();
				intCx.moveTo(
					anchorList.x[anchorList.length-1], 
					anchorList.y[anchorList.length-1]
				);
				intCx.lineTo(x, y);
				intCx.stroke();
			}
		};
		
		tool.POLY.click = function (e) {
			if (isInSnapZone) {
				endPath();
			} else {
				addAnchor();
				continuePath();
				//console.log(anchorList);
			}
		};
		
		tool.POLY.reset = function () {
			$(document).trigger("handler_canvasIntClear");
			$(document).trigger("handler_canvasAnoClear");
			anchorList.clear();
			redrawCompletedPaths();
		};
		
		tool.EDIT.mousemove = function (e) {
			// console.log(isAnchorSelected);
			// console.log(prevmPos);
			var md = { x : prevmPos.x - mPos.x, y : prevmPos.y - mPos.y };
			if (md.x === 0 && md.y === 0) {
				console.log("prevented mousemove");
			}
			// console.log(md);
			// console.log(isMouseDown);
			if (isMouseDown && isInSelectedAnno && !isAnchorSelected) {
				console.trace("updateing shape");
				//change from previous mouse move to current on each mousemove
				$(document).trigger("handler_canvasIntClear");
				updateSelectedPath(md);
				drawSelectedPathIndicator();
				isShapeMoved = true;
			} else if (isMouseDown && isAnchorSelected) {
				console.log("EDITING ANCHOR");
				$(document).trigger("handler_canvasIntClear");
				updateSelectedAnchor(md);
				drawSelectedAdjacentEdgesIndicator();
			}
		};
		
		//TODO: probably need to separate these or make better conditions...
		tool.EDIT.click = function (e, data) {
			var pathChosen = false;
			if (data != null) {
				cancelEditChanges();
				pathChosen = true;
				var cInd = getCompletedPathsIndex(data);
				isInSelectedAnno = true;
				selectedPaths.push( { path : data, compIndex : cInd } );
			}
			
			// selectedPaths = [];
			if (!isEditingPath) {
				//console.log(completedPaths);
				//console.log(tool.MODE);
				console.log("Detected Shape!!");
				
				if (!pathChosen) {
					var mPosCur = mPos;
					
					for (var i = 0; i < completedPaths.length; i++) {
						checkIfInAnnoBounds(completedPaths[i], mPosCur, i);
					}
				}
				
				if (selectedPaths.length > 0) {
					sortSelectedBBAscending(selectedPaths);
					console.log("Completed Sort.");
					console.log(selectedPaths);
					selectedPathsCurIndex = 0;
					$(document).trigger("toolbar_annoItemHighlight", [selectedPaths[selectedPathsCurIndex].compIndex]);
				} else {
					return;
				}
				isEditingPath = true;
				//console.log(selectedPaths);
				
				
				drawSelectedPathIndicator();
				
				//console.log(selectedPaths);
			} else if (!isAnchorSelected && isEditingPath && !isShapeMoved)  {
				console.log("Attempting to edit ANCHOR!!");
				checkSelectedPathAnchors();
				if (isAnchorSelected) {
					$(document).trigger("handler_canvasIntClear");
					//We remove the last point so we dont mess with the duplicate
					//(the duplicate is the first and last point, used for SVG tag)
					//TODO: maybe only add the duplicate when saving...
					console.log(selectedPaths[selectedPathsCurIndex].path);
					console.log(selectedPaths[selectedPathsCurIndex].path.x[0]);
					removeLastAnchorIfDuplicate(selectedPaths[selectedPathsCurIndex].path);
					console.log(selectedPaths[selectedPathsCurIndex].path);
					console.log("Removed last point");
					drawSelectedAdjacentEdgesIndicator();
				}
			}
		};
		
		
		tool.EDIT.tab = function (e) {
			//this will be used to cycle through overlapping shapes...
			
			if (!isShapeMoved && !isAnchorSelected) {
				//do nothing
			} else {
				console.log("RETURNING");
				return;
			}
			if ( (selectedPathsCurIndex + 1) === selectedPaths.length) {
				selectedPathsCurIndex = 0;
			} else {
				selectedPathsCurIndex++;
			}
			$(document).trigger("handler_canvasIntClear");
			drawSelectedPathIndicator();
			$(document).trigger("toolbar_annoItemHighlight", [selectedPaths[selectedPathsCurIndex].compIndex]);
			
			
		};
		
		tool.EDIT.enter = function (e) {
			saveEditChanges();
		};
		
		tool.EDIT.reset = function () {
			cancelEditChanges();
		};
		
		tool.RECT.click = function () {
			if (anchorList.length < 1) {
				addAnchor();
				console.log(mPos);
			} else {
				var mPosCur = mPos;
				var x = anchorList.x[0];
				var y = anchorList.y[0];
				anchorList.push(mPosCur.x, y);
				console.log(mPosCur.x);
				console.log(y);
				continuePath();
				anchorList.push(mPosCur.x, mPosCur.y);
				console.log(mPosCur.x);
				console.log(mPosCur.y);
				continuePath();
				anchorList.push(x, mPosCur.y);
				console.log(x);
				console.log(mPosCur.y);
				continuePath();
				// anchorList.push(x, y);
				endPath();
				console.log(mPos);
				
				$(document).trigger("handler_canvasIntClear");
				
			}
		};
		
		tool.RECT.mousemove = function () {
			$(document).trigger("handler_canvasIntClear");
			drawIndicator();
			
			var mPosCur = mPos;
			
			if (anchorList.length > 0) {
				var x = anchorList.x[0];
				var y = anchorList.y[0];
				intCx.beginPath();
				intCx.moveTo(x, y);
				intCx.lineTo(mPosCur.x, y);
				intCx.lineTo(mPosCur.x, mPosCur.y);
				intCx.lineTo(x, mPosCur.y);
				intCx.lineTo(x, y);
				intCx.stroke();
				
			}
			
		};
		
		tool.RECT.reset = function () {
			$(document).trigger("handler_canvasIntClear");
			$(document).trigger("handler_canvasAnoClear");
			anchorList.clear();
			redrawCompletedPaths();
		};
		
	};

	
	
	
	
	