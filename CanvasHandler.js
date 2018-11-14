/*
/*
 * CanvasHandler.js
 * Author: Ben Beshel, Graison Day
 * Handler for IIIF Canvases for T-PEN. 
*/


	var CanvasHandler = function () {
		
		//creates a context variable to access member functions
		var self = this;
		
		//The operation modes to select from
		self.MODES = [
			"POLY",
			"EDIT",
			"RECT"
		];
		
		//The names of op modes as they appear to the user
		self.MODE_NAMES = [
			"Polygon",
			"Edit",
			"Rectalinear"
		];
		
		//Dummy pointer for an annotation, used to add in otherContent field
		var dummyAnnoPointer = {
			"@id" : null,
			"@type" : "oa:Annotation",
			"@context": "http://iiif.io/api/presentation/2/context.json",
			"sandbox" : "bbeshel"
		};
		
		//A dummy rectalinear annotation, for drawing new annotations
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
		
		//A dummy SVG annotation, for drawing new annotations
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
		
		//A dummy annotation list, used to add a new annotationList to the sc:Canvas object
		var dummyAnnotationList = {
			"@id" : null,
			"@type" : "sc:AnnotationList",
			"@context": "http://iiif.io/api/presentation/2/context.json",
			"sandbox" : "bbeshel",
			"resources" : []
		};
		
		//A dummy canvas. Used ONLY if the parsed data did not have an sc:Canvas in it
		var dummyCanvas = {
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
                "@id" : "http://bbeshel.github.io/dummyCanvas.jpg",
                "@type" : "dctypes:Image",
                "format" : "image/jpeg",
                "height" : 2365,
                "width" : 1579
              },
              "on" : "http://www.example.org/dummy/canvas/"
          }],
          "otherContent":[] 
         };

		
		/*
		The default configuration object.
		Some attributes will be overwritten by attributes of a SharedCanvas JSON-LD object when found, 
		as well as by user preferences changed live in the toolbar
		*/
		var CONFIGS = {
			//Pertains to the anoCx object
			anno : {
				strokeStyle : "black",
				lineWidth : 1,
				lineCap : "round"
			},
			//Pertains to the intCx object
			feedback : {
				strokeStyle : "red",
				lineWidth : 1,
				cursorSize : 1
			},
			//number of undos. Currently unused.
			undoLimit : 50,
			//Constant to determine how much the canvas was scaled up/down based on sc:Canvas width/height
			canvasScale : 1,
			//How many pixels until the mouse snaps to an anchor
			snapZone : 10,
			//The <canvas> width
			canvasWidth : 0,
			//The <canvas> height
			canvasHeight : 0,
			//The new annotation list to be added (if none exist).
			newAnnotationList : null,
			//The annotations that were imported from parsing
			importedAnnotations : [],
			//Source of current canvas image (if any)
			canvasImageSrc : null,
			//List of sc:annotationList objects
			annotationLists : [],
			//Raw JSON of the sc:Canvas object retrieved
			canvasData : null,
			//The @id param of the sc:Canvas
			canvasId : null
		};
		
		/*update tracker and procedure.
		 *Runs through a list of update procedures to be completed.
		*/
		var updateProcedure = {
			//List of functions in the procedure.
			//Removed items retrieve the new JSON from the server and update locally.
			procedures : [
				function () {
					updateAllAnnotations();
				},
				// function () {
					// updateLocalAnnotationJSON();
				// },
				function () {
					updateAllAnnotationLists();
				},
				// function () {
					// updateLocalAnnotationListsJSON();
				// },
				function () {
					updateNewAnnotationList();
				},
				// function () {
					// updateLocalNewAnnotationListJSON();
				// },
				function () {
					updateCanvas();
				}
			],
			//runs through this.procedures
			run : function () {
				this.curIndex++;
				if (this.curIndex === this.procedures.length) {
					this.end();	
				} else {
					this.procedures[this.curIndex]();
				}
			},
			//ends update procedure
			end : function () {
				console.log("UPDATE PROCEDURE COMPLETE!!");
				removeMarkedDeletedPaths();
				unsavedChanges = false;
				unsavedChangesDisplay();
				$(document).trigger("toolbar_saveChangesComplete");
				$(document).trigger("handler_enableUserInteraction");
				annoDeleteQueue = [];
				$(document).trigger("handler_resetAnnoUpdateStatus");
				$(document).trigger("toolbar_updateAnnotationData");
				this.curIndex = -1;
			},
			curIndex : -1,
		};
		
		/*simple object that helps track what data was received by parsing
		*/
		var receivedDataCheck = {
			//was an image found
			image : false,
			//were oa:Annotation obs found
			annos : false,
			//was sc:Canvas found
			canvas : false,
			//If all objects found
			complete : function () {
				if (this.image && this.annos && this.canvas) {
					return true;
				}
				return false;
			},
			//If no objects found
			fail : function () {
				if (!this.image && !this.annos && !this.canvas) {
					return true;
				}
				return false;
			}
		};
		
		
		//Parser for JSON or URI entered
		var parser = new JSONparser(self);

		//Object to house the toolbar and its functions
		var tool = new CanvasHandlerToolbar(self, parser);
				
		//Used as a toggle for closing a shape on click
		//Currently unused
		var snapToClosePathBool = true;
		
		//Bool for checking if the mouse is near an anchor. Based on CONFIGS.snapZone
		var isInSnapZone = false;
		
		//Bool for checking if local version meets the server version
		var unsavedChanges = false;

		//The setTimeout for mousemove (see mousemove event)
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
		
		//Bool to tell if user can interact or not (used during save to server)
		var userInteractionDisabled = false;
		
		//Bool to tell if an ajax request has not completed yet (in execAjax)
		//Currently unused, but may be useful
		var ajaxWaitState = false;
		
		//List of objects waiting to be sent to execAjax
		var ajaxRequestQueue = [];
		
		//List of @id of oa:Annotation objects needing to be deleted on server
		var annoDeleteQueue = [];
				
		//Universal canvas mouse position
		var mPos;
		
		//Stores the previous canvas mouse position
		var prevmPos = { x : -1, y : -1};
		
		//Container for HTML positioning, allows layering of HTML5 canvases
		var $canvasContainer;

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
		
		//The canvas that draws indicators
		var $intCanvas;
		var intCanvas;
		var intCx;
		
		//Stores all anchorLists that are completed
		var completedPaths = [];
		
		//Temporary storage for any annotations as anchorLists that are being edited
		var selectedPaths = [];
		
		//List of undo objects
		//Currently unused, but will be useful
		var undoList = [];
		
		//The current index of all detected annotations in edit mode
		var selectedPathsCurIndex;
		
		//The index of the anchor in a specific annotation path that was selected
		var selectedPathsAnchorIndex;
		
		//Stores HTML complete SVG tags defined by an anchor list path
		//Currently unused, can be used for debug
		var svgTags = [];
		
		//Some styling to shorten code in createSVGTag
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
			//List of x coords
			x: [],
			//List of y coords
			y: [],
			//Length of coords x, y pairs, simulates array
			length: 0,
			//Next four are bounding box dimensions
			leftmost: 100000,
			rightmost: 0,
			topmost: 100000,
			bottommost: 0,
			//Corresponding sc:AnnotationList this anchorList belongs to
			annoListIndex: -1,
			//Corresponding index in its sc:AnnotationList
			annoIndex: -1,
			//@id for this annotation
			annoId: null,
			//next three are associated fields in oa:Annotation that hold text
			"label": null,
			"chars": null,
			"cnt:chars": null,
			//What type this is (currently, RECT or POLY)
			type: null,
			//Stringified JSON of this annotation
			JSON: null,
			//Does this anno need an update on server
			needsUpdate: false,
			//Does the JSON need an update from server
			needsLocalUpdate: false,
			//Is this going to be deleted from completedPaths, and on server
			markedForDelete: false,
			//Stroke color on <canvas> associated with this shape
			strokeStyle: "black",
			//Line width on <canvas> associated with this shape
			lineWidth: 1,
			//Pushes x, y to respective lists, then updates bounding box
			push: function (px, py) {
				this.x.push(px);
				this.y.push(py);
				this.length++;
				
				this.updateBounds(px, py);
			},
			//Removes the last point (useful when editing anchors)
			removeLast: function () {
				this.x.splice(this.x.length - 1, 1);
				this.y.splice(this.y.length - 1, 1);
				this.length--;
			},
			//Clears and resets the anchorList (since this object is shared)
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
				this.markedForDelete = false;
			},
			//Updates the bounding box boundaries based on new point
			updateBounds: function (px, py) {
				this.leftmost = px < this.leftmost ? px : this.leftmost;
				this.rightmost = px > this.rightmost ? px : this.rightmost;
				this.topmost = py < this.topmost ? py : this.topmost;
				this.bottommost = py > this.bottommost ? py : this.bottommost;
			},
			//Generates bounding box by checking all points
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
			//Returns the area in the bounding box (used during annotation selection in EDIT)
			getBoundingBoxArea: function () {
				return Math.abs(this.rightmost - this.leftmost) * Math.abs(this.bottommost - this.topmost);
			},
			//If the text for this anno has been updated recently
			hasNewText : function () {
				if (this["chars"] != null || this["cnt:chars"] != null || this["label"] != null) {
					return true;
				}
			},
			//Generates all JSON associated with this, then stores it
			generateJSON: function () {
				var anno;
				switch (this.type) {
					case "POLY":
						if (this.JSON == null) {
							//Create a dummy annotation with sc:Canvas id as on prop
							anno = $.extend(true, {}, dummyPolyAnnotation);
							anno["on"] = CONFIGS.canvasId;
						} else {
							//Edit the current JSON
							anno = JSON.parse(this.JSON);
						}
						//Generate an SVG tag
						var SVGstring = createSVGTag(this);
						//Store the SVG string where it belongs according to iiif.io 2.1
						anno["resource"]["selector"]["chars"] = SVGstring;
						//Convert the bounding box to sc:Canvas dimensions
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
						
						//find the #xywh substring in on property
						if (on.search("#xywh=") > -1) {
							on = on.substring(0, on.search("#xywh="));
						} 
						
						//compute xy width height
						on += "#xywh=" 
						+ xywh[0] + "," 
						+ xywh[2] + "," 
						+ (xywh[1] - xywh[0]) + "," 
						+ (xywh[3] - xywh[2]);
						
						anno["on"] = on;
						
						
						this.JSON = JSON.stringify(anno);
						
						//Add the new annotation comments into the JSON
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
						//All below is same as "POLY" case
						if (this.JSON == null) {
							anno = $.extend(true, {}, dummyAnnotation);
							var on = CONFIGS.canvasId;
						} else {
							anno = JSON.parse(this.JSON);
							var on = anno["on"];
							on = on.substring(0, on.search("#xywh="));
						}
						var xywh = convertToNativeDimensions([
							this.leftmost,
							this.rightmost,
							this.topmost,
							this.bottommost
						]);
						
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
					default:
					
				}
			},
			//currently doesn't work, recursion etc...
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
		
	
		/*
		*Initialize the canvas! Bind events, setup <canvas> with data, init toolbar.
		*/
		this.init = function (data) {
			
			//Wraps the <canvas> obs
			$canvasContainer = $("<div id='canvasContainer'></div>");
			//Wraps the <canvas> and the toolbar.
			var $wrapper = $("<div id='CHwrapper'>");
			
			$("body").append($wrapper);
			
			//Create <canvas> obs and add them to container
			$imgCanvas = $("<canvas class='tpenCanvas' id='imgCanvas'>");
			imgCanvas = $imgCanvas.get(0);
			imgCx = imgCanvas.getContext("2d");
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
			$wrapper.css('display', 'none');
			//Init toolbar with wrapper as parent object
			tool.init($wrapper);
			
			//Setup dummy annoList in CONFIGS for later use
			var dummyAnnoList = $.extend(true, {}, dummyAnnotationList);
			CONFIGS.newAnnotationList = dummyAnnoList;
			
			//removed, can be used for undo function in future
			// $(document).on("handler_execUndo", function () {
				// execUndo();
			// });

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
			
			//Changes the line color
			$(document).on("handler_changeLineColor", function(e, data){
				changeLineColor(data);
			});
			
			//Changes the color of the indicator on the interaction canvas
			$(document).on("handler_changeIndicatorColor", function(e, data){
				changeIndicatorColor(data);
			});
			
			//Change the status of unsavedChanges
			$(document).on("handler_changeSaveStatus", function() {
				unsavedChanges = false;
			});
			
			
			//Calls to save the changes made in edit mode
			$(document).on("handler_saveEditChanges", function (e) {
				if (tool.MODE === "EDIT") {
					tool[tool.MODE].enter(e);
				}
			});
			
			//Resets the status of needsUpdate on all completedPaths to false
			$(document).on("handler_resetAnnoUpdateStatus", function () {
				resetAnnoUpdateStatus();
			});
			
			//Exports data to the server (experimental - only in test cases)
			$(document).on("handler_exportAllDataJSON", function () {
				generateAllJSON();
				updateProcedure.run();
			});
			
			//Found annotations from parser
			$(document).on("parser_annoDataRetrieved", function (e, data) {
				receivedDataCheck.annos = true;
			});
			
			//Found sc:Canvas from parser
			$(document).on("parser_canvasDataRetrieved", function (e, data) {
				receivedDataCheck.canvas = true;
			});
			
			//Found image from parser
			$(document).on("parser_imageDataRetrieved", function (e, data) {
				receivedDataCheck.image = true;
			});
			
			//When parser says it is done parsing
			$(document).on("parser_allDataRetrieved", function () {
				onAllDataRetrieved();
				
			});
			
			//Resets status of previous mode when the mode changes
			$(document).on("toolbar_changeOperationMode", function (e, data) {
				tool[data].reset();
			});
			
			//Select the associated path if an annotation in the toolbar was clicked
			$(document).on("toolbar_annoItemClick", function (e, data) {
				$(document).trigger("handler_canvasIntClear");
				//Simulate a click for edit mode if we are in that mode
				//We don't want to switch the user to edit mode without knowing
				if (tool.MODE === "EDIT") {
					tool.EDIT.click(e, data);
				}
				drawPathIndicator(data);
			});
			
			//Updates the characters from the toolbar for selected annotation
			$(document).on("toolbar_annoItemCharsUpdate", function (e, path, prop, comment) {
				var ind = getCompletedPathsIndex(path);
				completedPaths[ind][prop] = comment;
				completedPaths[ind].needsUpdate = true;
				updateJSON();
			}); 
			
			//Prevent user interaction
			$(document).on("handler_preventUserInteraction", function () {
				userInteractionDisabled = true;
			});
			
			//Enable user interaction
			$(document).on("handler_enableUserInteraction" , function () {
				userInteractionDisabled = false;
			});
			
			//Delete selected annotation
			$(document).on("handler_deleteAnnotation", function (e) {
				if (tool.MODE === "EDIT") {
					tool.EDIT.del(e);
				}
			});
			
			//Cycle through overlapping selected annotations
			$(document).on("handler_cycleAnnotation", function (e) {
				if (tool.MODE === "EDIT") {
					tool.EDIT.tab(e);
				}
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
				if (userInteractionDisabled) {
					return;
				}
				if (!mPos) { 
					return; 
				}
				tool[tool.MODE].click(e);
			});
			
			//Generic document mousedown catch and handler
			$(document).on("mousedown", function (e) {
				clearTimeout(mouseTimeout);
				mouseTimeout = null;
				mouseTimeout = setTimeout(function () {
					isMouseDown = true;
				}, 10);
			});
			
			//Generic document mouseup catch and handler
			$(document).on("mouseup", function (e) {
				clearTimeout(mouseTimeout);
				isMouseDown = false;
			});

			//Dynamic document keydown catch and handler
			$(document).keydown(function (e) {
				if (userInteractionDisabled) {
					return;
				}
				switch(e.which) {
					case 9: //tab
						e.preventDefault();
						tool[tool.MODE].tab(e);
					break;
					case 13: //enter
						tool[tool.MODE].enter(e);
					break;
					case 46: //delete
						tool[tool.MODE].del(e);
					break;
					case 27: //esc
						tool[tool.MODE].reset(e);
					break;
					default:
					
				}
			});
			
			if (data != null) {
				parser.requestData(data);
			}
		};

		/*
		*When the parser finishes, update the <canvas> and toolbar
		*/
		var onAllDataRetrieved = function () {
			
			// Originally was used to allow exporting of data on a NEW canvas,
			// but since we can't export to server anymore, just always allow 'export'
			tool.setDummyState();

			if (receivedDataCheck.canvas) {
				//Enumerate canvasData in CONFIGS and setup new canvas dimensions
				var canv = parser.getCanvasJSON();
				CONFIGS.canvasData = jQuery.extend(true, {}, canv);
				CONFIGS.canvasId = parser.getCanvasId();
				$(document).trigger("toolbar_exposeCanvasId", [CONFIGS.canvasId]);
				setCanvasDimensions();
			} else {
				//Setup a dummy canvas
				alert('WARNING! @type of "sc:Canvas" was not found. Page will load a default canvas of width 1000, height 1000. All updates to any annotations found will be reflected on the new canvas.' );
				var dummyCan = $.extend(true, {}, dummyCanvas);
				CONFIGS.canvasData = dummyCan;
				var dummyAnnoList = $.extend(true, {}, dummyAnnotationList);
				CONFIGS.canvasId = CONFIGS.canvasData["@id"];
				setCanvasDimensions();
			}
			
			if (receivedDataCheck.image) {
				//Put image on canvas
				var img = parser.getCanvasImage();
				CONFIGS.canvasImageSrc = img;
				drawAndResizeImage();
			} else {
				//Use image in dummyCanvas
				CONFIGS.canvasImageSrc = CONFIGS.canvasData["images"][0]["resource"]["@id"];
				drawAndResizeImage();
			}
			
			if (receivedDataCheck.annos) {
				//Get annotations and lists from parser and save them, then convert to anchorLists
				var annoLists = parser.getAllAnnotationListJSON();
				CONFIGS.annotationLists = $.extend(true, [], annoLists);
				var annos = parser.getAllAnnotationJSON();
				CONFIGS.importedAnnotations = $.extend(true, [], annos);
				
				convertAnnotations();
			} 
			
			if (receivedDataCheck.fail()) {
			}
			
			$("#CHwrapper").css('display', '');
			
			//Update associated indices of annotations to their annotationLists
			updateAnnotationListIndices();
			
			//Draws the list of completedPaths (annotations)
			redrawCompletedPaths();
			
			//Enumerate list of annotations in toolbar
			$(document).trigger("toolbar_updateAnnotationData");
			
		};
		
		/*
		*Setup <canvas> dimensions 
		*/
		var setCanvasDimensions = function () {
			
			//Unused; could be used to resize canvas on window resize
			var size = {
				width: window.innerWidth || document.body.clientWidth,
				height: window.innerHeight || document.body.clientHeight
			}
			
			//Grab the canvas dimensions from the parsed data
			if (CONFIGS.canvasData != null) {
				CONFIGS.canvasWidth = CONFIGS.canvasData.width
				CONFIGS.canvasHeight = CONFIGS.canvasData.height;
			}
			
			//Canvas data exists with no dimensions, use default
			if (CONFIGS.canvasWidth === 0) {
				CONFIGS.canvasWidth = 1000;
				CONFIGS.canvasHeight = 1000;
			} 
		
			//Resize the canvas because it wont fit the page well
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
		
			//Resize all canvases
			imgCanvas.width = wid;
			imgCanvas.height = hgt;
			anoCanvas.width = wid;
			anoCanvas.height = hgt;
			intCanvas.width = wid;
			intCanvas.height = hgt;
			$canvasContainer.width(wid);
			$canvasContainer.height(hgt);
		};
		
		/*
		*Load in the canvas source from the CONFIGS, and put it on the image canvas
		*/
		var drawAndResizeImage = function () {
			if (CONFIGS.canvasImageSrc == null) {
				console.error("Warning: image source was null");
				return;
			}
			var $canvImg = $("<img src='" + CONFIGS.canvasImageSrc + "'/>");
			$canvImg.on("load", function () {
				imgCx.drawImage($canvImg.get(0), 0, 0, CONFIGS.canvasWidth, CONFIGS.canvasHeight);
			})
			.on("error", function () {
				alert("Could not retrieve image data!");
			});
		};
		
		/*
		*Converts all oa:Annotation objects parsed in to anchorList type for edit
		*/
		var convertAnnotations = function () {
			if (CONFIGS.importedAnnotations.length < 1) {
				alert("Warning: attempt to draw annotations failed. Reason: annotationList was null");
			} else {
				for (var i = 0; i < CONFIGS.importedAnnotations.length; i++) {
					var annos = CONFIGS.importedAnnotations[i];
					var ind;
					//Find the area that an oa:Annotation would store an SVG path
					if (annos.hasOwnProperty("resource") && annos["resource"].hasOwnProperty("selector")) {						
						if (annos["resource"]["selector"].hasOwnProperty("chars")) {
							SVGToAnchor(annos, i);
						}
					//Else, we try to find the xywh property
					} else if (annos.hasOwnProperty("on")) {
						rectToAnchor(annos, i);
					}
				}
				//Draw them to canvas
				redrawCompletedPaths();
			}
			
		};
		
		/*
		*Convert the rectalinear oa:Annotation to anchorList
		* @param annotation	- the annotation JSON
		* @param annoListIndex - which annotationList it was
		* @param annoIndex - where in the annotationList it was
		*/
		var rectToAnchor = function (annotation, annoListIndex, annoIndex) {
			var ind = annotation["on"].search("xywh");
			//If we found xywh string in our search 
			if (ind > -1) {
				//Get a string with just the numbers after "xywh="
				var dimString = annotation["on"].substr((ind + 5));
				//Split them into array indices
				var dims = dimString.split(",");
				var x, y, w, h;
				//Convert from string to number
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
				
				//Push the associated points to create a rectalinear object
				anchorList.clear();
				anchorList.push(x, y);
				anchorList.push((x + w), y);
				anchorList.push((x + w), (y + h));
				anchorList.push(x, (y + h));
				anchorList.push(x, y);
				
				//Write associated data
				anchorList.type = "RECT";
				anchorList.annoListIndex = annoListIndex;
				anchorList.annoIndex = annoIndex;
				anchorList.annoId = annotation["@id"];
				anchorList.JSON = JSON.stringify(annotation);
				//Copy and push to anchorList (prevents pass by reference)
				var curList = jQuery.extend(true, {}, anchorList);
				completedPaths.push(curList);
				anchorList.clear();
			} else {
				console.error("Warning: annotation 'on' property found, but could not retrieve dimensions!");
			}
		};
		
		/*
		*Convert the SVG (polygonal) oa:Annotation to anchorList
		* @param annotation	- the annotation JSON
		* @param annoListIndex - which annotationList it was
		* @param annoIndex - where in the annotationList it was
		*/
		var SVGToAnchor = function (annotation, annoListIndex, annoIndex) {
			var chars = annotation["resource"]["selector"]["chars"];
			var ind = chars.search("points");
			//If we found "points" in the SVG tag (meaning its actually a polygon)
			if (ind > -1) {
				//Chop off previous SVG string before "points"
				var charSub = chars.substr(ind);
				//Start at the string delimiter for the points
				var indBegin = charSub.search("\"");
				charSub = charSub.substr((indBegin + 1));
				//Find the end delimiter for the points
				var indEnd = charSub.search("\"");
				//Truncate to just the points
				var pointString = charSub.substring(0, indEnd);
				//Split them at commas and spaces
				var points = pointString.split(/[\s,]+/);
				var ar;
				anchorList.clear();
				//Convert each pair to numbers and add them to anchorList
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
					//Skip one because we go through two points per iteration
					i++;
				}
				//Write associated data
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


		//Determines the type of SVG...used for other SVG types
		//Currently unused
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
			var type, ind;
			for (var i = 0; i < self.MODES.length; i++) {
				ind = string.toLowerCase().indexOf(self.MODES[i]);
				if (ind > -1) {
					type = self.MODES[i];
				}
			}
			return type;
			
		};
		
		/*Edit any properties associated with annotation text
		* @param json - the json object or string 
		* @param prop - the json property to check for
		* @param comment - the comment to add to the property
		* @return the stringified modified json
		*/
		var editCharsPropForJSON = function (json, prop, comment) {
			if (typeof json === "string") {
				json = JSON.parse(json);
			}
			
			//Helper to recursively search through json object for the property, then add comment
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
			
			return JSON.stringify(json);
		};
		
		//Generates the JSON string that represents each anchorList
		var generateAllJSON = function () {
			for (var i = 0; i < completedPaths.length; i++) {
				completedPaths[i].generateJSON();
			}
		};
		
		//Generate the JSON string that represents each anchorList that needs an update
		var updateJSON = function () {
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i].needsUpdate) {
					completedPaths[i].generateJSON();
				}
			}
		};
		
		//Set the needsUpdate status to false for all anchorLists
		var resetAnnoUpdateStatus = function () {
			for (var i = 0; i < completedPaths.length; i++) {
				completedPaths[i].needsUpdate = false;
			};
		};
		
		//Push the current state tot he undo list
		//Currently unused
		var pushUndo = function () {
			
			if (undoList.length > CONFIGS.undoLimit) {
				undoList.shift();
			}
			var cPath = $.extend(true, [], completedPaths);
			undoList.push(cPath);
			// $(document).trigger("toolbar_updateAnnotationData");
			console.log(undoList);
		};
		
		//Updates the saved changes display on toolbar
		var unsavedChangesDisplay = function() {
			$(document).trigger("toolbar_changeSaveStatus", unsavedChanges);
		};
		
		/*Executes an ajax request as part of updateProcedure
		*Updates the associated data locally based on response and case
		*/
		var execAjax = function (request, jsonType) {
				ajaxWaitState = true;
				console.log(request);
				$(document).trigger('toolbar_addRequestDisplay', [request]);
				// $.ajax({
				// 	url: request.url,
				// 	type: "POST",
				// 	dataType: "json",
				// 	crossDomain: true,
				// })
				// .done(function (data) {
				// 	//If a type was specified
				// 	if (jsonType != null) {
				// 		switch (jsonType) {
				// 			//Most of these just add the @id the server responds with when creating a new annotation
				// 			case "anno": 
				// 				if(data.hasOwnProperty("@id")) {
				// 					completedPaths[request.index].annoId = data["@id"];
				// 				}
				// 			break;
				// 			case "annoLocal":
				// 				if (request.index != null) {
				// 					completedPaths[request.index].JSON = JSON.stringify(data);
				// 					completedPaths[request.index].needsLocalUpdate = false;
				// 				}
				// 			break;
				// 			case "annoList":
				// 				if (data.hasOwnProperty("@id")) {
				// 					CONFIGS.annotationLists[request.index]["@id"] = data["@id"];
				// 				}
				// 			break;
				// 			case "annoListLocal":
				// 				if (request.index != null) {
				// 					CONFIGS.annotationLists[request.index] = data;
				// 				}
				// 			break;
				// 			case "newAnnoList":
				// 				if (data.hasOwnProperty("@id")) {
				// 					CONFIGS.newAnnotationList["@id"] = data["@id"];
				// 				}
				// 			break;
				// 			case "newAnnoListLocal":
				// 				//Copies the newly created annotationList and adds it to the current list
				// 				CONFIGS.newAnnotationList = data;
				// 				var temp = $.extend(true, {}, CONFIGS.newAnnotationList);
				// 				CONFIGS.annotationLists.push(temp);
				// 				CONFIGS.newAnnotationList = null;
				// 			break;
				// 			case "canvas":
				// 				CONFIGS.canvasId = data["@id"];
				// 				//Update the @id of this canvas to the toolbar
				// 				$(document).trigger("toolbar_exposeCanvasId", [CONFIGS.canvasId]);
				// 			break;
				// 			default:
				// 		}
				// 	}
				// })
				// .fail(function (xhr, status, errorThrown) {
				// 	console.log(status);
				// 	console.log(errorThrown);
				// 	$(document).trigger("toolbar_saveChangesComplete");
				// 	$(document).trigger("handler_enableUserInteraction");
				// 	alert("There was a problem updating to the server. Changes have not been saved. "
				// 		+ "Error status:" + status 
				// 		+ "Error message:" + errorThrown
				// 	);
				// 	//End the update procedure after an error so we dont freeze the interaction forever
				// 	updateProcedure.end();
				// });
				ajaxWaitState = false;
				//As long as there are still queued requests, keep calling this, otherwise continue updateProcedure
				if (ajaxRequestQueue.length > 0) {
					execAjax(ajaxRequestQueue.shift(), jsonType);
				} else {
					updateProcedure.run();
				}
			 
		};
		
		/*
		*Pushes all associated JSON of all anchorLists to the server, updates them, or deletes them
		*/
		var updateAllAnnotations = function () {
			var posturl, params;
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i].needsUpdate) {
					params = stripExcessJSONData(completedPaths[i].JSON);
					//if we already have an @id, then we can just update the JSON. otherwise, create a new one on the server
					if (completedPaths[i].annoId == null) {
						posturl = "http://<server>/annotationstore/anno/saveNewAnnotation.action?content=\n" + encodeURIComponent(params);
					} else {
						posturl = "http://<server>/annotationstore/anno/updateAnnotation.action?content=\n" + encodeURIComponent(params);
					}
					ajaxRequestQueue.push({ url : posturl, index : i });
					
					completedPaths[i].needsUpdate = false;
					completedPaths[i].needsLocalUpdate = true;
				//If the current anchorList was marked to be deleted, delete it on the server
				} else if (completedPaths[i].markedForDelete) {
					params = JSON.stringify({ "@id" : completedPaths[i].annoId });
					posturl = "http://<server>/annotationstore/anno/deleteAnnotationByAtID.action?content=\n" + encodeURIComponent(params);
					ajaxRequestQueue.push({ url : posturl, index : i });
				}
			}
			
			for (var i = 0; i < annoDeleteQueue.length; i++) {
				params = JSON.stringify({ "@id" : annoDeleteQueue[i] });
				posturl = "http://<server>/annotationstore/anno/deleteAnnotationByAtID.action?content=\n" + encodeURIComponent(params);
				ajaxRequestQueue.push({ url : posturl});
			}
			
			if (ajaxRequestQueue.length > 0) {
				execAjax(ajaxRequestQueue.shift(), "anno");
			} else {
				updateProcedure.run();
			}
			
		};
		
		/*
		*Update the annotationList with the new @id s of all the annotations we pushed to the server
		*@param curAnoListIndex - the current annotationList in CONFIGS to update
		*/
		var updateAnnotationList = function (curAnoListIndex) {
			var curAnnoNeedsUpdate = false;
			//check if it has the proper structure
			if (!CONFIGS.annotationLists[curAnoListIndex].hasOwnProperty("resources")) {
				alert("couldnt find the resources field in annotation list");
				console.log(CONFIGS.annotationLists[curAnoListIndex]);
				return;
			}
	
			//push all new annotations to the first anno list if it exists, otherwise make a new anno list
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i].annoListIndex === -1) {
					if (CONFIGS.annotationLists.length > 0) {
						completedPaths[i].annoIndex = CONFIGS.annotationLists[0]["resources"].length;
						completedPaths[i].annoListIndex = 0;
						var anoPointer = $.extend(true, {}, dummyAnnoPointer);
						anoPointer["@id"] = completedPaths[i].annoId;
						CONFIGS.annotationLists[0]["resources"].push(anoPointer);
					} 
				//Loop through and remove the id from the annotationList if it was deleted
				} else if (completedPaths[i].markedForDelete && completedPaths[i].annoListIndex === curAnoListIndex) {
					for (var j = 0; j < CONFIGS.annotationLists[curAnoListIndex]["resources"].length; j++) {
						if (completedPaths[i].annoId === CONFIGS.annotationLists["resources"][j]["@id"]) {
							CONFIGS.annotationLists[curAnoListIndex]["resources"].splice(j, 1);
						}
					}
				}
			}
		
			var params = stripExcessJSONData(CONFIGS.annotationLists[curAnoListIndex]);
			posturl = "http://<server>/annotationstore/anno/updateAnnotation.action?content=\n" + encodeURIComponent(params);
			ajaxRequestQueue.push({ url : posturl, index : curAnoListIndex});

		};
		
		/*
		*Loops through and updates all the annotationLists to the server
		*/
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
		};
		
		/*Gets the JSON on the server associated with the @id given
		*Unused; used for testing
		*/
		var updateLocalAnnotationJSON = function () {
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i].needsLocalUpdate) {
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
		
		/*Gets the JSON on the server associated with the @id given
		*Unused; used for testing
		*/
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
		
		/*
		*Updates the new annotationList to the server
		*/
		var updateNewAnnotationList = function () {
			var params, posturl;

			//Add all annotations without an annotationList to this new list (if an annoList didnt exist)
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
				posturl = "http://<server>/annotationstore/anno/saveNewAnnotation.action?content=\n" + encodeURIComponent(params);
				execAjax({ url : posturl } , "newAnnoList");
			} else {
				updateProcedure.run();
			}
		};
		
		/*Gets the annotationList data from the server based on @id
		*Unused; used for testing
		*/
		var updateLocalNewAnnotationListJSON = function () {
			if (CONFIGS.newAnnotationList != null && CONFIGS.newAnnotationList["resources"].length > 0) {
				var posturl = CONFIGS.newAnnotationList["@id"];
				execAjax({ url : posturl }, "newAnnoListLocal");
			} else {
				updateProcedure.run();
			}
		};
		
		/*
		*Updates the sc:Canvas data to hold annotations
		*Creates a new canvas on the server if we are using a dummy canvas
		*/
		var updateCanvas = function () {
			var params, posturl;
			if (CONFIGS.canvasData.hasOwnProperty("@id")) {
				//If the dummyCanvas id was found, get ready to post it to the server instead
				if (CONFIGS.canvasData["@id"] === "http://www.example.org/dummy/canvas/") {
					CONFIGS.canvasData["@id"] = null;
				}
			}
			
			var annoLists = $.extend(true, [], CONFIGS.annotationLists);
			
			//Add all annotationLists to the sc:Canvas
			CONFIGS.canvasData["otherContent"] = annoLists;
			
			params = stripExcessJSONData(CONFIGS.canvasData);
			if (!CONFIGS.canvasData.hasOwnProperty("@id") || CONFIGS.canvasData["@id"] == null) {
				posturl = "http://<server>/annotationstore/anno/saveNewAnnotation.action?content=\n" + encodeURIComponent(params);
			} else {
				posturl = "http://<server>/annotationstore/anno/updateAnnotation.action?content=\n" + encodeURIComponent(params);
			}
			execAjax({url : posturl}, "canvas");
			
		};
		
		/*
		*Rolls back the canvas to the previous undo state
		*Unused; can be used in future
		*/
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
			unsavedChanges = false;
			redrawCompletedPaths();
			
		};
		
		/*
		*Updates the indices of the anchorLists so they match in their annotationLists
		*/
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
	
		/*
		*Removes all the anchorLists that were marked from deletion from completedPaths
		*/
		var removeMarkedDeletedPaths = function () {
			for (var i = completedPaths.length - 1; i > -1; i--) {
				if (completedPaths[i].markedForDelete) {
					completedPaths.splice(i, 1);
				}
			}
		};
		
		/*
		*Converts the points to the current canvas size 
		* @param ar - the array of converted numbers
		*/
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
		
		/*Converts the points to the sc:Canvas native size
		* @param ar - the array of converted numbers
		*/
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
		
		/*
		*Get the mouse position relative to the <canvas> area
		*/
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

		/*
		*Callback for mousemove, updating mPos mouse position object and saving previous mPos
		*/
		var moveCallback = function (e) {
			prevmPos = mPos;
			mPos = self.getMousePos(e);
		};
		
		/*
		*Draws the mouse pointer indicator
		* @param x, y - the x and y coordinates
		*/
		var drawIndicator = function (x, y) {
			//Use current mouse position if no params sent in
			if (x == null && y == null) {
				x = mPos.x;
				y = mPos.y;
			}
			
			intCx.beginPath();
			intCx.lineWidth = CONFIGS.feedback.lineWidth;
			intCx.strokeStyle = CONFIGS.feedback.strokeStyle;

			//Draw a circle around the mouse position
			intCx.arc(x, y, CONFIGS.snapZone, 0, 360);
			intCx.stroke();
			
		};
		
		/*
		*Draws the line that the indicator shows
		*This connects the nth point to the mouse current point in the path being drawn
		*/
		var continuePath = function () {
			if (anchorList.length > 1) {
				anoCx.beginPath();
				anoCx.lineWidth = CONFIGS.anno.lineWidth;
				anoCx.strokeStyle = CONFIGS.anno.strokeStyle;
				anoCx.lineCap = CONFIGS.anno.lineCap;
				//Use n-1 and n points since the point at mPos on click was already pushed
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
		
		/*Ends the drawing of the current path/shape
		*If the shape doesnt have enough points, it doesnt fire.
		*/
		var endPath = function () {
			
			if (anchorList.length > 2) {
				anoCx.beginPath();
				//Use 1st point and connect it to the nth points
				anoCx.moveTo(
					anchorList.x[0],
					anchorList.y[0]
				);
				anoCx.lineTo(
					anchorList.x[anchorList.length-1],
					anchorList.y[anchorList.length-1]
				);
				anoCx.stroke();
				
				//Push a duplicate so the JSON can save this shape as a closed shape correctly
				anchorList.push(anchorList.x[0], anchorList.y[0]);
				
				//Write associated data
				anchorList.type = tool.MODE;
				anchorList.generateJSON();
				anchorList.needsUpdate = true;
				anchorList.strokeStyle = CONFIGS.anno.strokeStyle;
				anchorList.lineWidth = CONFIGS.anno.lineWidth;
				//Push it to completedPaths
				var an = $.extend(true, {}, anchorList);
				completedPaths.push(an)
				anchorList.clear();
				$(document).trigger("toolbar_updateAnnotationData");
			}
		}
		
		/*
		*Pushes the current mouseposition to the current path
		*/
		var addAnchor = function () {
			anchorList.push(mPos.x, mPos.y);
		};

		/*Check to see if we are near an anchor/point in a path
		* @param mousePoint - the mouse position sent in
		* @param anchor - the anchor to compare the mouse position to
		*/
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
	
		/*Creates an HTML5 SVG tag string
		* @param - rawAnchors - the anchors passed in by reference
		* @return - the SVG string
		*/
		var createSVGTag = function (rawAnchors) {
			
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
			str += " />"
			str += svgSuffix;
			svgTags.push(str);
			var svg = $(str);
			
			
			return str;
		};
		
		/*Read an SVG tag and draw it
		*Unused; used for testing
		*/
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
		
		/*Strips all JSON properties that conflict on the server during update
		* @param json - the json object or string to edit
		* @return - stringified JSON
		*/
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
		
		/*Get the index of the passed in completedPath
		* @param path - the anchorList to evaluate
		* @return - the index found
		*/
		var getCompletedPathsIndex = function (path) {
			for (var i = 0; i < completedPaths.length; i++) {
				if (completedPaths[i] === path) {
					return i;
				}
			}
		};

	
		/*Checks if the user clicked inside a completed annotation during edit mode (selected a shaoe)
		* @param curPath - the anchorList to be eval
		* @param - mPosCur - the mouse position at the time user clicked in EDIT mode
		* @param - index - the index of the anchorList in completedPaths
		*/
		var checkIfInAnnoBounds = function (curPath, mPosCur, index) {
			//If its inside the bounding box of the anchorList
			if (curPath.leftmost < mPosCur.x && mPosCur.x < curPath.rightmost && curPath.topmost < mPosCur.y && mPosCur.y < curPath.bottommost) {
				//Copy the anchorList to selectedPaths
				var p = $.extend(true, {}, curPath);
				selectedPaths.push( { path : p, compIndex : index } );
				//we have selected a path
				isInSelectedAnno = true;
			};
		};

		/*Finds the smallest path that was selected in edit mode
		*@return - the selectedPath that was the smallest bounding box
		*/
		var findSmallestSelectedPath = function () {
			var smallestIndex = 0;
			for (var i = 0; i < selectedPaths.length; i++) {
				if (selectedPaths[smallestIndex].path.getBoundingBoxArea() > selectedPaths[i].path.getBoundingBoxArea()) {
					smallestIndex = i;
				}
			}
			
			return selectedPaths[smallestIndex];
		};
		
		/*Redraws the completed shape on the interaction canvas for editing
		*/
		var drawSelectedPathIndicator = function () {
			var selectedPath = selectedPaths[selectedPathsCurIndex].path;
			drawPathIndicator(selectedPath);
		};
		
		/*
		*Draws the path on the interaction canvas
		*/
		var drawPathIndicator = function (path) {
			if (path == null) {
				return;
			}
			intCx.strokeStyle = CONFIGS.feedback.strokeStyle;
			//draw circles around the anchors in this list
			for (var i = 0; i < path.length; i++) {
				intCx.beginPath();
				intCx.arc(path.x[i], path.y[i], CONFIGS.snapZone, 0, 360);
				intCx.stroke();
			}
			
			//draw the path
			intCx.beginPath();
			intCx.moveTo(path.x[0], path.y[0]);
			for (var i = 1; i < path.length; i++) {
				intCx.lineTo(path.x[i], path.y[i]);
			}
			intCx.stroke();
		};
			
		/*Draws a given path in its entirety to the annotation canvas
		*/
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
		
		/*Updates all the anchors on an edited path, and their bounding box
		* @param md - the displacement between the mouse position and the previous mouse position
		*/
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

		/*Updates the completedPaths based on the corresponding selectedPaths
		*/
		var updateCompletedPaths = function () {
			var curInd = 0;
			for (var i = 0; i < selectedPaths.length; i++) {
				curInd = selectedPaths[i].compIndex;
				var p = $.extend(true, {}, selectedPaths[i].path);
				completedPaths[curInd] = p;
			}
		};
		
		/*Remove the anchorList from the completedPaths on delete
		* @param - ind - the index of the anchorList
		*/
		var removeFromCompletedPaths = function (ind) {
			if (completedPaths[ind].annoId != null) {
				annoDeleteQueue.push(completedPaths[ind].annoId);
			}
			completedPaths.splice(ind, 1);
		};
		
		/*Updates a single anchor in selectedPaths
		* @param md - mouse displacement between current mPos and previous
		*/
		var updateSelectedAnchor = function (md) {
			switch (selectedPaths[selectedPathsCurIndex].path.type) {
				//We only edit one point on polygon, so just update that one
				case "POLY":
					selectedPaths[selectedPathsCurIndex].path.x[selectedPathsAnchorIndex] -= md.x;
					selectedPaths[selectedPathsCurIndex].path.y[selectedPathsAnchorIndex] -= md.y;
					break;
				//In a rectangle, we cant physically edit one point, we have to edit three
				case "RECT":
					//current anchorList, current index in x,y, two adjacent indices in x,y
					var curInd, curIndA, adjacentIndA, adjacentIndA2;
					curInd = selectedPathsCurIndex;
					curIndA = selectedPathsAnchorIndex;
					//This will always get the n-1 and n+1 points from nth (current) point
					adjacentIndA = (curIndA + 1) % 4;
					adjacentIndA2 = (curIndA + 3) % 4;
					
					
					//if cur and cur + 1 points are above (vertical to) each other...
					if (selectedPaths[curInd].path.x[curIndA] === selectedPaths[curInd].path.x[adjacentIndA]) {
						selectedPaths[curInd].path.x[adjacentIndA] -= md.x;
						selectedPaths[curInd].path.y[adjacentIndA2] -= md.y;
					//if cur and cur + 1 are horizontal to each other...
					} else {
						selectedPaths[curInd].path.y[adjacentIndA] -= md.y;
						selectedPaths[curInd].path.x[adjacentIndA2] -= md.x;
					}
					//update cur point normally
					selectedPaths[curInd].path.x[curIndA] -= md.x;
					selectedPaths[curInd].path.y[curIndA] -= md.y;
					
					break;
				default:
			}
			selectedPaths[selectedPathsCurIndex].path.generateBounds();
		};

		/*Draws the connecting edges to an anchor that is selected
		*/
		var drawSelectedAdjacentEdgesIndicator = function () {
			var path = selectedPaths[selectedPathsCurIndex].path;
			var anchInd = selectedPathsAnchorIndex;
			var lastInd = path.length - 1;
			
			intCx.beginPath();
			//Skip duplicate point
			if (anchInd === 0) {
				intCx.moveTo(path.x[lastInd], path.y[lastInd]);
			} else {
				intCx.moveTo(path.x[anchInd - 1], path.y[anchInd - 1]);
			}
			//Draw line to anchor we are moving
			intCx.lineTo(path.x[anchInd], path.y[anchInd]);
			//Skip duplicate
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
		};
		
		/*Changes the line color on annotation canvas
		* @param lineColor - the string of the color to be changed to
		*/
		var changeLineColor = function(lineColor) {
			if (CONFIGS.feedback.strokeStyle === "black"){
				CONFIGS.feedback.strokeStyle = "red";
			}
			switch(lineColor){
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
					
				case  "white":
					CONFIGS.anno.strokeStyle = "white";
					break;
				
				case "black":
					CONFIGS.anno.strokeStyle = "black";
					break;
			}
		};
		
		/*Changes the color of the lines on the interaction canvas
		* @param indicatorColor - the string of color to be changed to
		*/
		var changeIndicatorColor = function(indicatorColor){
			switch(indicatorColor){
				case "red":
					CONFIGS.feedback.strokeStyle = "red";
					break;
				
				case "yellow":
					CONFIGS.feedback.strokeStyle = "yellow";
					break;
				
				case "green":
					CONFIGS.feedback.strokeStyle = "green";
					break;
				
				case "blue":
					CONFIGS.feedback.strokeStyle = "blue";
					break;
					
				case  "white":
					CONFIGS.feedback.strokeStyle = "white";
					break;
				
				case "black":
					CONFIGS.feedback.strokeStyle = "black";
					break;
			}
			
		};
		
		/*Saves the changes made to an annotation during edit mode
		*This updates the completedPaths with the changes and then reflects it on the canvas
		*/
		var saveEditChanges = function () {
			//Nothing to save...
			if (selectedPaths.length < 1) {
				return;
			}
			//Clear interaction canvas
			$(document).trigger("handler_canvasIntClear");
			
			//If we edited an anchor, we have to add the duplicate back in
			if (isAnchorSelected) {
				addLastAnchor(selectedPaths[selectedPathsCurIndex].path);
			};
			
			//anchorList and index associated in completedPaths 
			var selectedPath = selectedPaths[selectedPathsCurIndex].path;
			var selectedPathCompletedIndex = selectedPaths[selectedPathsCurIndex].compIndex;
			
			//flag for update
			selectedPaths[selectedPathsCurIndex].path.needsUpdate = true;
			
			//Update the completedPaths with the selectedPaths
			updateCompletedPaths();
			//Draw all completedPaths again
			redrawCompletedPaths();
			
			//generate JSON flagged for update
			updateJSON();
			//Remove highlight from the annotation item in the toolbar, then update these items
			$(document).trigger("toolbar_annoItemsDeHighlight");
			$(document).trigger("toolbar_updateAnnotationData");

			//Reset all the vars associated with edit mode
			cancelEditChanges();
		};
		
		/*Resets all the vars associated with edit mode
		*/
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

		/*Redraw all the anchorList paths
		*/
		var redrawCompletedPaths = function () {
			$(document).trigger("handler_canvasAnoClear");
			for (var i = 0; i < completedPaths.length; i++) {
				drawPath(completedPaths[i]);
			}
		};
		
		/*Sorts selected list of shapes by bounding box area
		* @param list - the selectedPaths passed in (can be used generically)
		*/
		var sortSelectedBBAscending = function (list) {
			var newList = [];
			var smallestInd = 0;
			var curInd = 1;
			var temp;
			while (list.length > 1) {
				//Of the remaining list items, find the smallest one
				if (list[smallestInd].path.getBoundingBoxArea() > list[curInd].path.getBoundingBoxArea()) {
					smallestInd = curInd;
				}
				
				curInd++;
				
				//Once we reach the end of the passed in list
				if (curInd === list.length) {
					//Remove the item from the passed in list
					temp = list.splice(smallestInd, 1);
					//Push it in the new list (ascending)
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

		/*Check if the next click was near an anchor's snapZone in a selected path
		*/
		var checkSelectedPathAnchors = function () {
			var mousePoint = mPos;
			var path = selectedPaths[selectedPathsCurIndex].path;
			for (var i = 0; i < path.length; i++) {
				var anchor = {
					x : path.x[i],
					y : path.y[i]
				};
				if (checkIfNearAnchor(mousePoint, anchor)) {
					isAnchorSelected = true;
					//Skip the duplicate
					if (i === (path.length - 1)) {
						selectedPathsAnchorIndex = 0;
					} else {
						selectedPathsAnchorIndex = i;
					}
				}
			}
		};

		/*Removes the last point so we dont start editing it if it is a duplicate of first
		*/
		var removeLastAnchorIfDuplicate = function (path) {
			if (path.x[0] === path.x[path.length - 1]
			&& path.y[0] === path.y[path.length - 1]) {
				path.removeLast();
			}
		};
		
		/*Add the last anchor as a duplicate of the first one
		*/
		var addLastAnchor = function (path) {
			var pointX = path.x[0];
			var pointY = path.y[0];
			path.push(pointX, pointY);
		};
		
		/*Getter for completedPaths
		*/
		self.getCompletedPaths = function () {
			return completedPaths;
		};
		
		//initialize modes to allow function expansion
		tool.POLY = Object.create(null);
		tool.EDIT = Object.create(null);
		tool.RECT = Object.create(null);
		
		/*Mousemove handler for POLY mode
		*/
		tool.POLY.mousemove = function (e) {
			$(document).trigger("handler_canvasIntClear");
			
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
			drawIndicator(x, y);
			

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
		
		/*click handler for POLY mode
		*/
		tool.POLY.click = function (e) {
			//If we are in the snap zone for the first point, close the path
			if (isInSnapZone) {
				endPath();
			//Else, add the anchor to the cur anchorList and draw it to annotation canvas
			} else {
				addAnchor();
				continuePath();
				unsavedChanges = true;
				unsavedChangesDisplay();
			}
		};
		
		/*Reset unsaved changes from uncompleted path
		*/
		tool.POLY.reset = function () {
			$(document).trigger("handler_canvasIntClear");
			$(document).trigger("handler_canvasAnoClear");
			anchorList.clear();
			redrawCompletedPaths();
		};
		
		/*mousemove handler for EDIT mode
		*/
		tool.EDIT.mousemove = function (e) {
			
			//if prevmPos wasnt set to null when mouse position went off canvas
			if (prevmPos != null && prevmPos.x != null && prevmPos.y != null) {
				var md = { x : prevmPos.x - mPos.x, y : prevmPos.y - mPos.y };
			//If it was, just set it to the last mPos
			} else {
				md = mPos;
			}
		
			//If the mouse is down, we selected a shape, and we didnt select an anchor on that shape
			if (isMouseDown && isInSelectedAnno && !isAnchorSelected) {
				//change from previous mouse move to current on each mousemove
				$(document).trigger("handler_canvasIntClear");
				//Update the current selected path with the mouse displacement
				updateSelectedPath(md);
				drawSelectedPathIndicator();
				isShapeMoved = true;
			//Else if the mouse is down and we did click an anchor after selecting a shape
			} else if (isMouseDown && isAnchorSelected) {
				$(document).trigger("handler_canvasIntClear");
				updateSelectedAnchor(md);
				//Draws only the edges connected to the selected point
				drawSelectedAdjacentEdgesIndicator();
			}
		};
		
		/*Click handler for EDIT mode
		*/
		tool.EDIT.click = function (e, data) {
			//Was a path passed in from the toolbar?
			var pathChosen = false;
			//If a specific path was passed in by clicking an annotation in the sidebar
			if (data != null) {
				//Reset any edit changes before save
				cancelEditChanges();
				pathChosen = true;
				var cInd = getCompletedPathsIndex(data);
				isInSelectedAnno = true;
				//We know this path is selected so just push it
				selectedPaths.push( { path : data, compIndex : cInd } );
			}
			
			//If we clicked once and found a shape
			if (!isEditingPath) {				
				if (!pathChosen) {
					//Have to find if this click hit an object
					var mPosCur = mPos;
					
					for (var i = 0; i < completedPaths.length; i++) {
						checkIfInAnnoBounds(completedPaths[i], mPosCur, i);
					}
				}
				
				//If we did select a shape
				if (selectedPaths.length > 0) {
					//Sort by bounding box so we clicked the smallest overlapping shape
					sortSelectedBBAscending(selectedPaths);
					selectedPathsCurIndex = 0;
					//Highlight the annotation in the toolbar associated with this shape
					$(document).trigger("toolbar_annoItemHighlight", [selectedPaths[selectedPathsCurIndex].compIndex]);
				} else {
					return;
				}
				isEditingPath = true;
				unsavedChanges = true;
				unsavedChangesDisplay();				
				drawSelectedPathIndicator();
			//Else if we already selected a shape but it hasnt moved and we didnt already do this,
			} else if (!isAnchorSelected && isEditingPath && !isShapeMoved) {
				//Check if we area near an anchor in the selected path during this click
				checkSelectedPathAnchors();
				if (isAnchorSelected) {
					$(document).trigger("handler_canvasIntClear");
					//We remove the last point so we dont mess with the duplicate (may not be needed)
					removeLastAnchorIfDuplicate(selectedPaths[selectedPathsCurIndex].path);
					drawSelectedAdjacentEdgesIndicator();
				}
			}
		};
		
		/*Tab key handler for EDIT mode
		*/
		tool.EDIT.tab = function (e) {
			//this will be used to cycle through overlapping shapes...
			if (selectedPaths.length < 1) {
				return;
			}
			
			//If we clicked on a shape in EDIT mode but didnt move it or select an anchor
			if (!isShapeMoved && !isAnchorSelected) {
				//do nothing
			} else {
				return;
			}
			
			//Select the next anchorList in the selectedPaths
			if ( (selectedPathsCurIndex + 1) === selectedPaths.length) {
				selectedPathsCurIndex = 0;
			} else {
				selectedPathsCurIndex++;
			}
			$(document).trigger("handler_canvasIntClear");
			drawSelectedPathIndicator();
			$(document).trigger("toolbar_annoItemHighlight", [selectedPaths[selectedPathsCurIndex].compIndex]);
			
			
		};
		
		/*Enter key handler for EDIT mode
		*/
		tool.EDIT.enter = function (e) {
			saveEditChanges();
		};
		
		/*Delete key handler for EDIT mode
		*/
		tool.EDIT.del = function (e) {
			if (selectedPaths.length === 0) {
				return;
			}
			//Ask the user if they really want to delete this annotation
			if (confirm("Are you sure you want to delete the selected annotation?")) {				
				//need to keep the anoId so updateProcedure can find and delete it
				var anoId = selectedPaths[selectedPathsCurIndex].path.annoId;
				var anoListIndex = selectedPaths[selectedPathsCurIndex].path.annoListIndex;
				//Wipe out all data except for the previous params so that we cant redraw this or push it to server
				selectedPaths[selectedPathsCurIndex].path.clear();
				selectedPaths[selectedPathsCurIndex].path.markedForDelete = true;
				selectedPaths[selectedPathsCurIndex].path.annoId = anoId;
				selectedPaths[selectedPathsCurIndex].path.annoListIndex = anoListIndex;
				
				//update the new object to completedPaths
				updateCompletedPaths();
				
				$(document).trigger("handler_canvasIntClear");
				
				redrawCompletedPaths();
				$(document).trigger("toolbar_updateAnnotationData");
				
				//Remove this path from the completedPaths
				removeFromCompletedPaths(selectedPaths[selectedPathsCurIndex].compIndex);
				
				cancelEditChanges();
			} else {
				return;
			}
			
		};
		
		tool.EDIT.reset = function () {
			cancelEditChanges();
		};
		
		/*Click handler for RECT mode
		*/
		tool.RECT.click = function () {
			//Start a rectangle
			if (anchorList.length < 1) {
				addAnchor();
			//Finish a rectangle
			} else {
				//Do some math to create a rectangle from the first point to the current mPos
				var mPosCur = mPos;
				var x = anchorList.x[0];
				var y = anchorList.y[0];
				anchorList.push(mPosCur.x, y);
				continuePath();
				anchorList.push(mPosCur.x, mPosCur.y);
				continuePath();
				anchorList.push(x, mPosCur.y);
				continuePath();
				endPath();
				unsavedChanges = true;
				unsavedChangesDisplay();

				$(document).trigger("handler_canvasIntClear");
				
			}
		};
		
		/*Mousemove handler for RECT mode
		*/
		tool.RECT.mousemove = function () {
			$(document).trigger("handler_canvasIntClear");
			drawIndicator();
			
			var mPosCur = mPos;
			
			//Draw a what the rectangle shape will look like on the interaction canvas
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
		
		/*Resets the changes made before save in RECT mode
		*/
		tool.RECT.reset = function () {
			$(document).trigger("handler_canvasIntClear");
			$(document).trigger("handler_canvasAnoClear");
			anchorList.clear();
			redrawCompletedPaths();
		};
		
	};

	
	
	
	
	