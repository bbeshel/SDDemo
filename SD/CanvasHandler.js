/*
/*
 * CanvasHandler.js
 * Author: Ben Beshel, Graison Day
 * Handler for IIIF Canvases for T-PEN. 
*/

//TODO: bind mousevents to document, have canvas check if mouse exists
//TODO: move canvas order: middle canvas is shapes, top is feedback/interaction
//test

/*
arrayHandler (ar) {
	for (var i = 0; i < ar.length; i++) {
		
	}
}

objectHandler () {}

keyHandler () {}

storageHandler() {}

outerLoop (canvas) {
	type = canvas["@type"];
	
	for (var n in IIIFCanvas) {
		basicCheck(n, type)
	}
	
basicCheck () {
	if (typeof(n) === "string") {
			storageHandler(n);
		}
		
		if (typeof(n) === "array" || typeof(n) === Array()) {
			arrayHandler(n);
		}
		
		etc..
}
}

var ar = [];
var ar2 = new Array();

*/

	var CanvasHandler = function () {
		
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
			canvasWidth : 0,
			canvasHeight : 0
		}
		
		var tool = new CanvasHandlerToolbar();
		
		//Universal canvas mouse position
		var mPos;
		
		//Container for HTML positioning, allows layering of canvases
		//Normally, I abstain from inline CSS, but for now it's okay
		var $container = $("<div id='canvasContainer' style='position: relative;'></div>");

		//The canvas that holds the image
		var $imgCanvas;
		var imgCanvas;
		var imgCx;
			
		//The canvas that displays immediate interaction
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
				this.rightmost = 100000;
				this.topmost = 0;
				this.bottommost = 0;
			},
			updateBounds: function (px, py) {
				this.leftmost = px < this.leftmost ? px : this.leftmost;
				this.rightmost = px > this.rightmost ? px : this.rightmost;
				this.topmost = py < this.topmost ? py : this.topmost;
				this.bottommost = py > this.bottommost ? py : this.bottommost;
			}
		};
		
		//creates a context variable to access member functions
		var self = this;
		
		this.init = function () {
			
			tool.init($container);
			
			
			var endPathBtn = $("<button id='endCurrentPathBtn' style='position: relative;'>End Current Path</button>");
			endPathBtn.on("click", endPath);
			$("body").append(endPathBtn);
			//TODO: need to get image dynamically from json
			var img2 = new Image();
			img2.src = "http://norman.hrc.utexas.edu/graphics/mswaste/160 h612e 617/160_h612e_617_001.jpg";
			
			
			$imgCanvas = $("<canvas id='imgCanvas' style='position: absolute;'>");
			imgCanvas = $imgCanvas.get(0);
			imgCx = imgCanvas.getContext("2d");
			//TODO: need to have dynamic parent to append to
			//TODO: find default ID to attach to, or take as param.
			$container.append($imgCanvas);
			
			$anoCanvas = $("<canvas id='anoCanvas' style='position: absolute;'>");
			anoCanvas = $anoCanvas.get(0);
			anoCx = anoCanvas.getContext("2d");
			$container.append($anoCanvas);
			
			$intCanvas = $("<canvas id='intCanvas' style='position: absolute;'>");
			intCanvas = $intCanvas.get(0);
			intCx = intCanvas.getContext("2d");
			$container.append($intCanvas);
			
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
				
			});
			
			
			
			$("body").append($container);

			
			$(document).on("mousemove", function (e) {
				moveCallback(e);
				if (!mPos) { 
					return; 
				}
				console.log("mouse moved");
				//TODO: consider firing event instead
				intCx.clearRect(0, 0, anoCanvas.width, anoCanvas.height);
				drawIndicator(e);
			});
			$(document).on("click", function (e) {
				if (!mPos) { 
					return; 
				}
				addAnchor();
				continuePath();
				console.log(anchorList);
			});
			// $intCanvas.bind("mousemove", function(e) {
				// moveCallback(e);
				// //TODO: consider firing event instead
				// anoCx.clearRect(0, 0, anoCanvas.width, anoCanvas.height);
				// drawIndicator(e);
			// });
			
			// $intCanvas.bind("click", function(e) {
				// addAnchor();
				// continuePath();
				// console.log(anchorList);
			// });
			 
			

			
		};
		
		this.getMousePos = function(evt) {
			var rect = imgCanvas.getBoundingClientRect();
			var tempX = Math.floor((evt.clientX - rect.left)/(rect.right-rect.left)*imgCanvas.width);
			var tempY = Math.floor((evt.clientY - rect.top)/(rect.bottom-rect.top)*imgCanvas.height);
			
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
			mPos = self.getMousePos(e);
			console.log(mPos);
		};
		
		var drawIndicator = function (e) {
			intCx.beginPath();
			//TODO: make this permanent before calls somehow
			intCx.lineWidth = CONFIGS.feedback.lineWidth;
			intCx.strokeStyle = CONFIGS.feedback.strokeStyle;

			intCx.arc(mPos.x, mPos.y, 5, 0, 360);
			intCx.stroke();
			
			if (anchorList.length > 0) {
				intCx.beginPath();
				intCx.moveTo(
					anchorList.x[anchorList.length-1], 
					anchorList.y[anchorList.length-1]
				);
				intCx.lineTo(mPos.x, mPos.y);
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
		};
		
		//TODO: May need to check if 0 and n points match
		var drawCompletedPath = function (list) {
			anoCx.beginPath();
			anoCx.moveTo(list.x[0], list.y[0]);
			for (var i = 1; i < list.length; i++) {
				anoCx.lineTo(list.x[i], list.y[i]);
			}
			anoCx.stroke();
			anchorList.clear();
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
		
	};

	
	
	
	
	