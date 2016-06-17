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
		
		self.MODES = [
			"POLY",
			"EDIT",
			"RECT",
			"CIRC",
			"ANNO",
		];
		
		self.MODE_NAMES = [
			"Polygon",
			"Edit",
			"Rectalinear",
			"Circular",
			"Annotate"
		];
		
		var CONFIGS = {
			anno : {
				strokeStyle : "black",
				lineWidth : 1
			},
			feedback : {
				strokeStyle : "red",
				lineWidth : 1,
				cursorSize : 5
			},
			snapZone : 10,
			canvasWidth : 0,
			canvasHeight : 0
		};
		
		
		
		//Object to house the toolbar and its functions
		var tool = new CanvasHandlerToolbar(self);
				
		var snapToClosePathBool = true;
		
		var isInSnapZone = false;
		
		var mouseIsDown = false;
		
		var isInSelectedAnno = false;
		
		var isCurrentlyEditingPath = false;
				
		//Universal canvas mouse position
		var mPos;
		var prevmPos;
		
		//Container for HTML positioning, allows layering of canvases
		//Normally, I abstain from inline CSS, but for now it's okay
		var $canvasContainer = $("<div id='canvasContainer'></div>");

		//The canvas that holds the image
		var $imgCanvas;
		var imgCanvas;
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
		
		//Stores all "anchor lists" that are completed
		var completedPaths = [];
		
		var selectedPaths = [];
		
		var selectedPathsOfCompletedIndices = [];
		
		var selectedPathsCurIndex;
		
		//LOOK here for list of SVG after closing a path
		//Stores HTML complete SVG tags defined by an anchor list path
		var svgTags = [];
		//Some styling
		var svgStrokeColor = "stroke:black;";
		var svgLineWidth = "line-width:5;";
		var svgFillStyle = "fill:none;";
		
		var svgPrefix = "<svg xmlns=\"http://www.w3.org/2000/svg\""
		var svgSuffix = "</svg>";
		
		var anchorList = {
			x: [],
			y: [],
			length: 0,
			leftmost: 100000,
			rightmost: 0,
			topmost: 100000,
			bottommost: 0,
			push: function (px, py) {
				this.x.push(px);
				this.y.push(py);
				this.length++;
				
				this.updateBounds(px, py);
			},
			clear: function () {
				this.x = [];
				this.y = [];
				this.length = 0;
				this.leftmost = 100000;
				this.rightmost = 0;
				this.topmost = 100000;
				this.bottommost = 0;
			},
			updateBounds: function (px, py) {
				this.leftmost = px < this.leftmost ? px : this.leftmost;
				this.rightmost = px > this.rightmost ? px : this.rightmost;
				this.topmost = py < this.topmost ? py : this.topmost;
				this.bottommost = py > this.bottommost ? py : this.bottommost;
			},
			getBoundingBoxArea: function () {
				return (this.rightmost - this.leftmost) * (this.bottommost - this.topmost);
			}
		};
		
	
		
		this.init = function () {
			
			
			var $wrapper = $("<div id='CHwrapper'>");
			$("body").append($wrapper);
			
			var endPathBtn = $("<button id='endCurrentPathBtn' style='position: relative;'>End Current Path</button>");
			endPathBtn.on("click", endPath);
			$("body").append(endPathBtn);
			//TODO: need to get image dynamically from json
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
			
			//TODO: set canvas size based on parsed info, unless missing
			//LOOK: add variable image tag for onload based on parsed content
			var img = $("<img src='http://norman.hrc.utexas.edu/graphics/mswaste/160 h612e 617/160_h612e_617_001.jpg' />");
			img.on("load", function () {
				//TODO: make sure size of canvas conforms to standard
				var wid = img.get(0).width;
				var hgt = img.get(0).height;
				imgCanvas.width = wid;
				imgCanvas.height = hgt;
				imgCx.drawImage(img.get(0), 0, 0);
				anoCanvas.width = wid;
				anoCanvas.height = hgt;
				intCanvas.width = wid;
				intCanvas.height = hgt;
				CONFIGS.canvasWidth = wid;
				CONFIGS.canvasHeight = hgt;
				$canvasContainer.width(wid);
				$canvasContainer.height(hgt);
			});
			
			
			
			// $("body").append($wrapper);
			$wrapper.append($canvasContainer);
			tool.init($wrapper);

			$(document).on("handler_canvasIntClear", function () {
				intCx.clearRect(0, 0, CONFIGS.canvasWidth, CONFIGS.canvasHeight);
			});
			
			$(document).on("handler_canvasAnoClear", function () {
				anoCx.clearRect(0, 0, CONFIGS.canvasWidth, CONFIGS.canvasHeight);
				console.log(CONFIGS.canvasWidth);
			});
			
			$(document).on("mousemove", function (e) {
				moveCallback(e);
				if (!mPos) { 
					return; 
				}
				// console.log("mouse moved");
				//TODO: consider firing event instead
				tool[tool.MODE].mousemove(e);
				
				
			});
			$(document).on("click", function (e) {
				if (!mPos) { 
					return; 
				}
				tool[tool.MODE].click(e);
			});
			
			$(document).on("mousedown", function (e) {
				mouseIsDown = true;
			});
			
			$(document).on("mouseup", function (e) {
				mouseIsDown = false;
			});
			
			$(document).keydown(function (e) {
				switch(e.which) {
					case 32: //space
						tool[tool.MODE].space(e);
					break;
					case 13:
						tool[tool.MODE].enter(e);
				}
			});
			
			$(document).on("handler_changeSnapZone", function (e, data) {
				changeSnapZone(data);
			});
			
			$(document).on("handler_saveEditChanges", function (e) {
				saveEditChanges();
			});

		};
		
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
				// return mPos;
			}
		};	
		
		var moveCallback = function (e) {
			prevmPos = mPos;
			mPos = self.getMousePos(e);
			// console.log(mPos);
		};
		
		var drawIndicator = function () {
			var x, y;
			
			
			if (snapToClosePathBool && anchorList.length > 1) {
				var firstAnchor = { 
					xMax : anchorList.x[0] + CONFIGS.snapZone, 
					xMin : anchorList.x[0] - CONFIGS.snapZone, 
					yMax : anchorList.y[0] + CONFIGS.snapZone, 
					yMin : anchorList.y[0] - CONFIGS.snapZone 
					
				};
				if (mPos.x < firstAnchor.xMax && mPos.x > firstAnchor.xMin && mPos.y < firstAnchor.yMax && mPos.y > firstAnchor.yMin) {
					console.log(firstAnchor.xMax);
					console.log(firstAnchor.xMin);
					console.log(firstAnchor.yMax);
					console.log(firstAnchor.yMin);
					isInSnapZone = true;
					x = anchorList.x[0];
					y = anchorList.y[0];
				}
			}
			
			if (x == null && y == null) {
				console.log("nulls");
				isInSnapZone = false;
				x = mPos.x;
				y = mPos.y;
			}
			
			intCx.beginPath();
			//TODO: make this permanent before calls somehow
			intCx.lineWidth = CONFIGS.feedback.lineWidth;
			intCx.strokeStyle = CONFIGS.feedback.strokeStyle;

			intCx.arc(x, y, 5, 0, 360);
			intCx.stroke();
			
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
		
		var continuePath = function () {
			if (anchorList.length > 1) {
				anoCx.beginPath();
				anoCx.lineWidth = CONFIGS.anno.lineWidth;
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
				if (userEndedPath) {
					userEndedPath = false;
					//TODO: implement user closed path
				} else {
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
					completedPaths.push(clone(anchorList));
					console.log(anchorList);
					console.log(completedPaths);
					createSVGTag(anchorList);
					anchorList.clear();
				}
			}
		}
		
		var addAnchor = function () {
			anchorList.push(mPos.x, mPos.y);
		};
		
		var createSVGTag = function (anchors) {
			//Not sure if we need this width/height
			var str = svgPrefix +
				"width=\"" + anchors.rightmost + "\" " + 
				"height=\"" + anchors.bottommost + "\"" +
				">" +
				"<polygon points=\"";
				
			for (var i = 0; i < anchors.length; i++) {
				str += anchors.x[i] + "," + anchors.y[i] + " ";
			}
			str += "\"";
			str += "style=\"" + svgLineWidth + svgStrokeColor + svgFillStyle + "\" />"
			str += svgSuffix;
			svgTags.push(str);
			var svg = $(str);
			
			//TODO: remove, testing only
			// intCx.clearRect(0, 0, intCanvas.width, intCanvas.height);
			// anchorList.clear();
			
			// readSVGTag(str);
			
			console.log(svgTags);
			console.log(svg.get(0));
		};
		
		var readSVGTag = function (tag) {
			var $tag = $.parseHTML(tag);
			
			console.log($tag);
			console.log($tag[0].lastChild.animatedPoints[0]);
			console.log($tag[0].hasOwnProperty("lastChild"));
			console.log($tag[0].lastChild.hasOwnProperty("animatedPoints"));
			
			//TODO: need to check if properties exist. hasOwnProperty doesnt work, doesnt extend object prototype.
			// if ($tag[0].hasOwnProperty("lastChild") && $tag[0].lastChild.hasOwnProperty("animatedPoints")) {
				var pList = $tag[0].lastChild.animatedPoints;
				console.log("pushing");
				console.log(pList[0]);
				console.log(pList[0].x);
				for (var i = 0; i < pList.length; i++) {
					anchorList.push(pList[i].x, pList[i].y);
				}
			// }
			drawCompletedPath(anchorList);
			anchorList.clear();
		};
		
		//TODO: May need to check if 0 and n points match
		var drawCompletedPath = function (list) {
			anoCx.beginPath();
			anoCx.moveTo(list.x[0], list.y[0]);
			for (var i = 1; i < list.length; i++) {
				anoCx.lineTo(list.x[i], list.y[i]);
			}
			anoCx.stroke();
		};
		
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
		
		var checkIfInAnnoBounds = function (curPath, mPosCur, index) {
			if (curPath.leftmost < mPosCur.x && mPosCur.x < curPath.rightmost && curPath.topmost < mPosCur.y && mPosCur.y < curPath.bottommost) {
				console.log(clone(curPath));
				selectedPaths.push( { path : clone(curPath), compIndex : index } );
				// selectedPathsOfCompletedIndices.push(index);
				isInSelectedAnno = true;
			};
		};
		
		var findSmallestSelectedPath = function () {
			var smallestIndex = 0;
			for (var i = 0; i < selectedPaths.length; i++) {
				console.log(selectedPaths[smallestIndex].path.getBoundingBoxArea());
				console.log(selectedPaths[i].path.getBoundingBoxArea());
				if (selectedPaths[smallestIndex].path.getBoundingBoxArea() > selectedPaths[i].path.getBoundingBoxArea()) {
					smallestIndex = i;
				}
			}
			
			//TODO: change so that contains all selected paths, not just one
			// selectedPathsOfCompletedIndices = [];
			// selectedPathsOfCompletedIndices.push(smallestIndex);
			return selectedPaths[smallestIndex];
		};
		
		var drawSelectedPathIndicator = function () {
			console.log(selectedPaths);
			var selectedPath = selectedPaths[selectedPathsCurIndex].path;
			console.log(selectedPath);
			intCx.beginPath();
			intCx.moveTo(selectedPath.x[0], selectedPath.y[0]);
			for (var i = 1; i < selectedPath.length; i++) {
				intCx.lineTo(selectedPath.x[i], selectedPath.y[i]);
			}
			intCx.stroke();
		};
		
		var drawPath = function (path) {
			anoCx.beginPath();
			anoCx.moveTo(path.x[0], path.y[0]);
			for (var i = 1; i < path.length; i++) {
				anoCx.lineTo(path.x[i], path.y[i]);
			}
			anoCx.stroke();
		};
		
		var updateSelectedPath = function (md) {
			var cur = selectedPathsCurIndex;
			console.log(md);
			console.log(md.x);
			for (var i = 0; i < selectedPaths[cur].path.length; i++) {
				selectedPaths[cur].path.x[i] -= md.x;
				selectedPaths[cur].path.y[i] -= md.y;					
			}
			selectedPaths[cur].path.leftmost -= md.x;	
			selectedPaths[cur].path.rightmost -= md.x;	
			selectedPaths[cur].path.topmost -= md.y;	
			selectedPaths[cur].path.bottommost -= md.y;	
		};
		
		var updateCompletedPaths = function () {
			var curInd = 0;
			for (var i = 0; i < selectedPaths.length; i++) {
				curInd = selectedPaths[i].compIndex;
				completedPaths[curInd] = clone(selectedPaths[i].path);
			}
		};
		
		var changeSnapZone = function (val) {
			CONFIGS.snapZone = val;
		};
		
		var saveEditChanges = function () {
			$(document).trigger("handler_canvasIntClear");
			console.log("save edit attempt");
			//use this to remove any edit shape, and then push down to ano
			var selectedPath = selectedPaths[selectedPathsCurIndex].path;
			var selectedPathCompletedIndex = selectedPaths[selectedPathsCurIndex].compIndex;
			
			redrawCompletedPaths();
			
			//need to make sure that selectedPaths is all the actual selected obs
			for (var i = 0; i < selectedPaths.length; i++) {
				drawPath(selectedPaths[i].path);
			}
			drawPath(selectedPath);
			
			//TODO: change this
			console.log(selectedPath);
			console.log(clone(selectedPath));
			
			updateCompletedPaths();
			// completedPaths[selectedPathCompletedIndex] = clone(selectedPath);
			
			selectedPathsCurIndex = 0;
			// selectedPathsOfCompletedIndices = [];
			selectedPaths = [];
			isInSelectedAnno = false;
			isCurrentlyEditingPath = false;
		};
		
		var redrawCompletedPaths = function () {
			$(document).trigger("handler_canvasAnoClear");
			var skipPath = false;
			for (var i = 0; i < completedPaths.length; i++) {
				for (var j = 0; j < selectedPaths.length; j++) {
					if (selectedPaths[j].compIndex === i) {
						skipPath = true;
					}
				}
				console.log(skipPath);
				console.log(completedPaths[i]);
				if (!skipPath) {
					drawPath(completedPaths[i]);
				}
				skipPath = false;
			}
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
		
		//initialize modes to allow function expansion
		tool.POLY = Object.create(null);
		tool.EDIT = Object.create(null);
		
		tool.POLY.mousemove = function (e) {
			$(document).trigger("handler_canvasIntClear");
			drawIndicator();
		};
		
		tool.POLY.click = function (e) {
			if (isInSnapZone) {
				endPath();
			} else {
				addAnchor();
				continuePath();
				console.log(anchorList);
			}
		};
		
		tool.EDIT.mousemove = function (e) {
			if (mouseIsDown && isInSelectedAnno) {
				isCurrentlyEditingPath = true;
				//change from previous mouse move to current on each mousemove
				var md = { x : prevmPos.x - mPos.x, y : prevmPos.y - mPos.y };
				$(document).trigger("handler_canvasIntClear");
				updateSelectedPath(md);
				drawSelectedPathIndicator();
			}
		};
		
		tool.EDIT.click = function (e) {
			
			// selectedPaths = [];
			if (!isCurrentlyEditingPath) {
				console.log(completedPaths);
				console.log(tool.MODE);
				
				var mPosCur = mPos;
				
				for (var i = 0; i < completedPaths.length; i++) {
					checkIfInAnnoBounds(completedPaths[i], mPosCur, i);
				}
				
				if (selectedPaths.length > 0) {
					sortSelectedBBAscending(selectedPaths);
					selectedPathsCurIndex = 0;
				} else {
					return;
				}
				console.log(selectedPaths);
				
				
				drawSelectedPathIndicator();
				
				console.log(selectedPaths);
			}
		};
		
		
		tool.EDIT.space = function (e) {
			//this will be used to cycle through overlapping shapes...
			
			if (isCurrentlyEditingPath) {
				return;
			}
			if ( (selectedPathsCurIndex + 1) === selectedPaths.length) {
				selectedPathsCurIndex = 0;
			} else {
				selectedPathsCurIndex++;
			}
			$(document).trigger("handler_canvasIntClear");
			drawSelectedPathIndicator();
			
			
		};
		
		tool.EDIT.enter = function (e) {
			saveEditChanges();
		};
		
	};

	
	
	
	
	