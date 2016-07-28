	var JSONparser = function (context) {
		var self = this;
		
		var parent = context;
		
		
		var $curCont = $("<div>");
		var $curImg = $("<div>");
		var $curAno = $("<div>");
		var curTextLine = "";
		var lastURL = "";
		var anoListURL = "";
		var canvasURL = "";
		//var insideAnnoList = false; 
		var annoNumber = 0;
		var canvJSON;
		var annoJSON;
		var canvImg;
		var canvId;
		
		var recurseIter = 0;


		//Handles the storage of information
		var storageHandler = function(unstoredObject){
			curTextLine += unstoredObject;
		}
		
		//Checks objects from the canvas 
		self.basicCheck = function(canvasObject, retTextBool) {
			recurseIter++;
			
			if (canvasObject["@type"] === "sc:Canvas") {
				handleURL(canvasObject["@id"]);
				canvId = canvasObject["@id"];
			}
			if (canvasObject["@type"] === "sc:AnnotationList") {
				if (canvasObject.hasOwnProperty("on") && canvId == null) {
					canvId = canvasObject["on"];
				}
				// $textOb = $curAno;
				handleURL(canvasObject["@id"]);
				}
				
			if (canvasObject["@type"] === "dctypes:Image") {
				
				//here we are detecting for two different acceptable models for images
				if (canvasObject.hasOwnProperty("resource")) {
					handleURL(canvasObject["resource"]["@id"]);
				} else if (canvasObject.hasOwnProperty("@id")) {
					handleURL(canvasObject["@id"]);
				}
			}
			for (n in canvasObject){
				
				/* Slashed out curTextLine lines and textline lines will cause the  program to
				 display all attributes of a canvas instead of just certain ones from annotations.*/
				if (Array.isArray(canvasObject[n]) || typeof(canvasObject[n]) === 'object'){
						self.basicCheck(canvasObject[n], retTextBool);				
				} 
				else if (validChecker(canvasObject[n]) === true){
					if (retTextBool){
						if (retString == null) {
							var retString = "";
						}
						var val = n.toLowerCase();
						if (val === "label" || val === "cnt:chars" || val === "chars") {
							switch(val) {
						
								// if(canvasObject[n] == "oa:Annotation"){
									// curTextLine += "Annotation " + annoNumber.toString();
									// curTextLine += ("<br />");
									// textline(curTextLine, $textOb, 1);
									// annoNumber += 1;
								// }
								// break;
								
								case "label":
								retString += "Label: " + canvasObject[n];
								// curTextLine += ("<br />");
								// textline(curTextLine, $textOb);
								break;
								
								case "cnt:chars":
								retString += "Text: " + canvasObject[n];
								// curTextLine += ("<br />");
								// textline(curTextLine, $textOb);
								break;
								
								case "chars":
								retString += "Chars: " + canvasObject[n];
								break;
								default:
							
							}
						}
						// storageHandler(n); -->
						//curTextLine += n + ": ";
						//curTextLine += canvasObject[n];
						//textline(curTextLine, $textOb);
						// curTextLine +=("<br />"); -->
					}
				}
				else {
					//Item was blank
				}
			//}
			}
			if (retString != null && retString.length > 0) {
				return retString;
			}
			
			recurseIter--;
			
		};
		


		var validChecker = function(objectValue){
			if (objectValue == null){
				return false;
			}

			else if (typeof objectValue === 'string'){
				// objectValue.trim(); -->
				if (objectValue.length > 0){
					if (objectValue.substring(0, 4) === "http") {
						// handleURL(objectValue);
					}
					return true;
				}
			}
			else if (typeof objectValue === 'number'){
				if (objectValue > -1){
					return true;
				}
			}
			else if (typeof objectValue === 'boolean'){
				return true;
			}
		};
			

		//Parses the canvas in order to obtain necessary data for redrawing the canvas
		//How information will be parsed depends on the type of canvas
		var canvasParser = function(jsontext){
			// var text = canvas.responseText; -->
			var parsedCanv = JSON.parse(jsontext);
			console.log(parsedCanv);
			var type = parsedCanv["@type"];
			//TODO: handle character case
			if (type === "sc:AnnotationList") {
				anoListURL = parsedCanv["@id"];
				annoJSON = jQuery.extend(true, {}, parsedCanv);
				$(document).trigger("parser_annoDataRetrieved", [annoJSON]);
				self.basicCheck(parsedCanv);
				//insideAnnoList = false;
			} else if (type === "sc:Canvas") {
				canvasURL = parsedCanv["@id"];
				//deep copy the object for use later
				canvJSON = jQuery.extend(true, {}, parsedCanv);
				$(document).trigger("parser_canvasDataRetrieved", [canvJSON]);
				self.basicCheck(parsedCanv);
			} else {
				alert('Handled json does not have expected type "sc:Canvas" or "sc:AnnotationList');
			}
		};



		var resolveCanvasURL = function (url) {
			recurseIter++;
			var aThing = $.getJSON(url, function() {
					alert("JSON data received.");
				}
			).done( function() {
				canvasParser(aThing.responseText);
				recurseIter--;
				}
			).fail( function() {
				alert("A problem has been found. Cannot display image.");
				}
			);
		};
		
		var evaluateData = function (text) {
			if (isURL(text)) {
				resolveCanvasURL(text);
			} else {
				resolveJSON(text);
			}
		};
		
		var isURL = function (text) {
			if (text.substring(0, 4) == "http") {
				return true;
			} else {
				return false;
			}
		};
		
		
		var handleURL = function (url) {
			//test if url first (basic test)
			var result = isURL(url);
			if (anoListURL === url) {
				return;
			} else if (canvasURL === url) {
				return;
			}
			
			if (result) {
				var rexp = /\.jpg/i;
				if (rexp.test(url)) {
					if (url == lastURL) {
						return;
					} else {
						lastURL = url;
					}
					resolveImage(url);
				} else {
					// alert("Found a URL, but could not identify it!"); -->
					// console.log(url); -->
					resolveCanvasURL(url);
				}
			}
			insideAnnoList = false;			
		};
		
		var resolveImage = function (imgUrl) {
			canvImg = imgUrl;
			$(document).trigger("parser_imageDataRetrieved", [canvImg]);
			// var $img = $("<img src='" + imgUrl + "' />");
			// console.log("attempt to resolve image url");
			// $img.on("load", function () {
				// //TODO: display the image somewhere here!
				// console.log("attempt image append");
				// // $curImg.append(img);
				// canvImg = imgUrl;
				// console.log (canvImg);
				// $(document).trigger("parser_imageDataRetrieved", [canvImg]);
				
			// })
			// .on("error", function () {
				// alert("Could not retrieve image data!");
			// });
		};
		
		var resolveJSON = function (text, $box) {
			// clearArea();
			canvasParser(text);
			console.trace("this");
		};
		
		var textline = function (text, $box, bool) {
			if (bool){
				var para = "<p class='colorChange'>"
			}
			else{
			var para = "<p>";
			}
			$box.append(para + text + "</p>");
			curTextLine = "";
		};
		
		var clearArea = function () {
			$curCont.empty();
			$curImg.empty();
			curTextLine = "";
			lastURL = "";
		};
		
		var checkCompletionStatus = function () {
			setTimeout(function () {
				if (recurseIter === 0) {
					$(document).trigger("parser_allDataRetrieved");
				} else {
					checkCompletionStatus();
				}	
			}, 1000);
		};
		
		self.getAnnotationListJSON = function () {
			if (annoJSON == null) {
				return;
			}
			return annoJSON;
		};
		
		self.getCanvasJSON = function () {
			if (canvJSON == null) {
				return;
			}
			return canvJSON;
		};
		
		self.getCanvasImage = function () {
			if (canvImg == null) {
				return;
			}
			return canvImg;
		};
		
		self.getCanvasId = function () {
			if (canvId == null) {
				return;
			}
			return canvId;
		};
		
		self.requestData = function (data) {
			evaluateData(data);
			checkCompletionStatus();
		};

		//Some tests, to be deleted later
		var exampleCanv = "http://165.134.241.141/annotationstore/annotation/55f9da84e4b04dde25a2734c";
		// evaluateData(exampleCanv);
	};