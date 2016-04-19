/*
 * CanvasHandler.js
 * Author: Ben Beshel
 * Handler for IIIF Canvases for T-PEN. 
*/

	var CanvasHandler = function () {
		// var canvas;
		// var $canvas;
		var $container = $("<div id='canvasContainer' style='position: relative;'></div>");
		
		var $imgCanvas;
		var imgCanvas;
		var imgCx;
		
		var $dispCanvas;
		var dispCanvas;
		var dispCx;
		
		var $intCanvas;
		var intCanvas;
		var intCx;
		
		var userEndedPath = false;
		
		var completedPaths = [];
		
		//LOOK here for list of SVG after closing a path
		var svgTags = [];
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
			},
			updateBounds: function (px, py) {
				this.leftmost = px < this.leftmost ? px : this.leftmost;
				this.rightmost = px > this.rightmost ? px : this.rightmost;
				this.topmost = py < this.topmost ? py : this.topmost;
				this.bottommost = py > this.bottommost ? py : this.bottommost;
			}
		};
		var mPos;
		
		var self = this;
		
		this.init = function () {
			
			var endPathBtn = $("<button id='endCurrentPathBtn' style='position: relative;'>End Current Path</button>");
			endPathBtn.on("click", endPath);
			$("body").append(endPathBtn);
			//TODO: need to get image dynamically from json
			//TODO: need an "onload" event, sometimes misses load
			var img2 = new Image();
			img2.src = "http://norman.hrc.utexas.edu/graphics/mswaste/160 h612e 617/160_h612e_617_001.jpg";
			
			
			$imgCanvas = $("<canvas id='imgCanvas' style='position: absolute;'>");
			imgCanvas = $imgCanvas.get(0);
			imgCx = imgCanvas.getContext("2d");
			//TODO: need to have dynamic parent to append to
			$container.append($imgCanvas);
			
			$dispCanvas = $("<canvas id='dispCanvas' style='position: absolute;'>");
			dispCanvas = $dispCanvas.get(0);
			dispCx = dispCanvas.getContext("2d");
			$container.append($dispCanvas);
			
			dispCx.lineWidth = 1;
			dispCx.strokeStyle = "red";
			
			$intCanvas = $("<canvas id='intCanvas' style='position: absolute;'>");
			intCanvas = $intCanvas.get(0);
			intCx = intCanvas.getContext("2d");
			$container.append($intCanvas);
			
			//LOOK: add variable image tag for onload based on parsed content
			var img = $("<img src='http://norman.hrc.utexas.edu/graphics/mswaste/160 h612e 617/160_h612e_617_001.jpg' />");
			img.on("load", function () {
				//TODO: make sure size of canvas conforms to standard
				imgCanvas.width = img.get(0).width;
				imgCanvas.height = img.get(0).height;
				imgCx.drawImage(img.get(0), 0, 0);
				dispCanvas.width = imgCanvas.width;
				dispCanvas.height = imgCanvas.height;
				intCanvas.width = imgCanvas.width;
				intCanvas.height = imgCanvas.height;
			});
			
			
			
			$("body").append($container);
			
			
			
			//TODO: need to get dims from json
			
		
			
			//TODO: should set this to other imgCanvas


			//NOTE: imgCanvas and dispCanvas do not receive mouse events (layering)
			$imgCanvas.bind("mousemove", function(e) {
				// moveCallback(e, this);
			});
			
			$dispCanvas.bind("mousemove", function(e) {
				// console.log(this);
				
			});
			
			$intCanvas.bind("mousemove", function(e) {
				// moveCallback(e, this);
				moveCallback(e);
				dispCx.clearRect(0, 0, dispCanvas.width, dispCanvas.height);
				drawIndicator(e);
			});
			
			$intCanvas.bind("click", function(e) {
				addAnchor();
				continuePath();
				console.log(anchorList);
			});
			 
			
			
				// imgCx.drawImage(img.get(0), 0, 0);
		};
		
		this.getMousePos = function(evt) {
			var rect = imgCanvas.getBoundingClientRect();
			return {
				x: Math.floor((evt.clientX - rect.left)/(rect.right-rect.left)*imgCanvas.width),
				y: Math.floor((evt.clientY - rect.top)/(rect.bottom-rect.top)*imgCanvas.height)
			};
		};	
		
		var moveCallback = function (e) {
			// console.log(e);
			mPos = self.getMousePos(e);
			// console.log(canvas);
			// console.log(canvas.mPos);
		};
		
		var drawIndicator = function (e) {
			dispCx.beginPath();
			dispCx.strokeStyle="red";
			dispCx.arc(mPos.x, mPos.y, 5, 0, 360);
			dispCx.stroke();
			
			if (anchorList.length > 0) {
				dispCx.beginPath();
				dispCx.moveTo(
					anchorList.x[anchorList.length-1], 
					anchorList.y[anchorList.length-1]
				);
				dispCx.lineTo(mPos.x, mPos.y);
				dispCx.stroke();
			}
		};
		
		var continuePath = function () {
			if (anchorList.length > 1) {
				intCx.beginPath();
				intCx.strokeStyle="black";
				intCx.moveTo(
					anchorList.x[anchorList.length-2], 
					anchorList.y[anchorList.length-2]
				);
				intCx.lineTo(
					anchorList.x[anchorList.length-1], 
					anchorList.y[anchorList.length-1]
				);
				intCx.stroke();
				
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
					// console.log("ending");
					intCx.beginPath();
					intCx.strokeStyle = "black";
					intCx.moveTo(
						anchorList.x[0],
						anchorList.y[0]
					);
					intCx.lineTo(
						anchorList.x[anchorList.length-1],
						anchorList.y[anchorList.length-1]
					);
					intCx.stroke();
					
					anchorList.push(anchorList.x[0], anchorList.y[0]);
					completedPaths.push(anchorList);
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
			
			console.log(svgTags);
			console.log(svg.get(0));
		};
		
		
		
	};
