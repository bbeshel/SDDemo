	var JSONparser = function (context) {
		var self = this;
		
		//takes the context of the parent
		var parent = context;
		
		//The previous URL (attempt to reduce resolving the same link)
		var lastURL = "";
		//URL to the annotationList
		var anoListURL = "";
		//url id to the canvas
		var canvId;
		//full JSON for sc:Canvas
		var canvJSON;
		//full JSON for all sc:AnnotationLists
		var annoListJSONList = [];
		var annoJSONList = [];
		//URL to image to be drawn
		var canvImg;
		
		//Recurse iterator to help notify when parsing is done
		var recurseIter = 0;
		
		/*Recursive. Parses through an entire JSON, pulling out
		* important data relevant to the SharedCanvas.
		* @param canvasObject	JSON object
		* @param retTextBool	(non-functional) bool if returning specific text
		* @return retString		string of desired anno comments
		*/
		self.basicCheck = function(canvasObject, retTextBool) {
			recurseIter++;
			
			//Check if the key is a SharedCanvas
			if (canvasObject["@type"] === "sc:Canvas") {
				// handleURL(canvasObject["@id"]);
				canvId = canvasObject["@id"];
			}
			//Check if the key is an AnnotationList
			if (canvasObject["@type"] === "sc:AnnotationList") {
				$(document).trigger("parser_annoDataRetrieved");
				if (canvasObject.hasOwnProperty("on") && canvId == null) {
					canvId = canvasObject["on"];
				}
				//Check if this sc:AnnotationList has annotations in it (basically, has the id link been resolved?)
				if (canvasObject.hasOwnProperty("resources") && canvasObject.resources[0]["@type"] === "oa:Annotation") {
					var anno = $.extend(true, {}, canvasObject);
					annoListJSONList.push(anno);
				} else {
					handleURL(canvasObject["@id"]);
				}
			}
			//is an anno that is not an image
			if (canvasObject["@type"] === "oa:Annotation" && canvasObject.hasOwnProperty("resource") && canvasObject["resource"]["@type"] !== "dctypes:Image") {
				annoJSONList.push(canvasObject);
			} else if (canvasObject["@type"] === "oa:Annotation") {
				if (canvasObject.hasOwnProperty("@id")) {
					handleURL(canvasObject["@id"]);
				}
			}
				
			//Check if the key is an image 
			if (canvasObject["@type"] === "dctypes:Image") {				
				//here we are detecting for two different acceptable models for images
				if (canvasObject.hasOwnProperty("resource")) {
					handleURL(canvasObject["resource"]["@id"]);
				} else if (canvasObject.hasOwnProperty("@id")) {
					handleURL(canvasObject["@id"]);
				}
			}
			
			for (n in canvasObject){
				//Recurse if it is an object or an array
				if (Array.isArray(canvasObject[n]) || typeof(canvasObject[n]) === 'object'){
						self.basicCheck(canvasObject[n], retTextBool);				
				} 
				//Else, handle particular cases if valid value
				else if (validChecker(canvasObject[n]) === true){
					//If we are adding and returning annotation comments...
					if (retTextBool){
						if (retString == null) {
							var retString = "";
						}
						//Make it lower case to cover more cases
						var val = n.toLowerCase();
						if (val === "label" || val === "cnt:chars" || val === "chars") {
							switch(val) {
								case "label":
								retString += "Label: " + canvasObject[n];
								break;
								
								case "cnt:chars":
								retString += "Text: " + canvasObject[n];
								break;
								
								case "chars":
								retString += "Chars: " + canvasObject[n];
								break;
								default:
							
							}
						}
					}
				}
				else {
					//Item was blank
				}
			}
			if (retString != null && retString.length > 0) {
				return retString;
			}
			
			recurseIter--;

		};
		
		/*Checks to see if the JSON key-value pair are validChecker
		* @param objectValue	the value to be checked
		* @return bool	
		*/
		var validChecker = function(objectValue){
			if (objectValue == null){
				return false;
			}

			else if (typeof objectValue === 'string'){
				if (objectValue.length > 0){
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
			else {
				return false;
			}
		};
			

		/*Parses the canvas in order to obtain necessary data for redrawing the canvas
		*How information will be parsed depends on the type of canvas
		* @param jsontext	stringified json passed in or resolved from URL
		*/
		var canvasParser = function(jsontext){
			var parsedCanv = JSON.parse(jsontext);
			var type = parsedCanv["@type"];
			//TODO: handle character case
			if (type === "sc:AnnotationList") {
				// anoListURL = parsedCanv["@id"];
				// var anno = jQuery.extend(true, {}, parsedCanv);
				// annoListJSONList.push(anno);
				$(document).trigger("parser_annoDataRetrieved");
				self.basicCheck(parsedCanv);
			} else if (type === "sc:Canvas") {
				//deep copy the object for use later
				canvJSON = jQuery.extend(true, {}, parsedCanv);
				$(document).trigger("parser_canvasDataRetrieved", [canvJSON]);
				self.basicCheck(parsedCanv);
			} else if (type === "oa:Annotation") {
				self.basicCheck(parsedCanv);
			} else {
				alert('Handled json does not have expected type "sc:Canvas", "sc:AnnotationList", or "oa:Annotation"');
			}
		};
		
		/*If url is found, resolves it and then begins to parse further
		* @param url 	the url to resolve
		*/
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
				alert("A problem has been found. Cannot resolve URL in JSON.");
				}
			);
		};
		
		/*Determines data flow depending on data type of 
		* data entered from the text area on initialization
		* @param text	the string to be evaluated
		*/
		var evaluateData = function (text) {
			if (isURL(text)) {
				resolveCanvasURL(text);
			} else {
				canvasParser(text);
			}
		};
		
		/*simple check to see if the string is a URL
		* @param text	string to be checked
		* @return bool
		*/
		var isURL = function (text) {
			if (text.substring(0, 4) == "http") {
				return true;
			} else {
				return false;
			}
		};
		
		/*Handles a url and handles it if it is an image or other
		* @param url	the url to be checked and handled
		* @return 
		*/
		var handleURL = function (url) {
			//test if url first (basic test)
			var result = isURL(url);
			if (anoListURL === url) {
				return;
			} else if (canvId === url) {
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
					resolveCanvasURL(url);
				}
			}
		};
		
		/*Sets the canvImg var to the link found, then notifies the handler
		* @param imgUrl	string that is a url to the image
		*/
		var resolveImage = function (imgUrl) {
			canvImg = imgUrl;
			$(document).trigger("parser_imageDataRetrieved", [canvImg]);
		};
		
		/*Checks every second to see if the recursion is finished for dispatch
		*/
		var checkCompletionStatus = function () {
			setTimeout(function () {
				if (recurseIter === 0) {
					$(document).trigger("parser_allDataRetrieved");
				} else {
					checkCompletionStatus();
				}	
			}, 1000);
		};
		
	
		/*Getter for annoListJSONList
		* @return annoListJSONList
		*/
		self.getAllAnnotationListJSON = function () {
			if (annoListJSONList == null) {
				return;
			}
			return annoListJSONList;
		};
		
		/*Getter for annoJSONList
		* @return annoJSONList
		*/
		self.getAllAnnotationJSON = function () {
			if (annoJSONList == null) {
				return;
			}
			return annoJSONList;
		};
		
		/*Getter for canvJSON
		* @return canvJSON
		*/
		self.getCanvasJSON = function () {
			if (canvJSON == null) {
				return;
			}
			return canvJSON;
		};
		
		/*Getter for canvImg
		* @return canvImg
		*/
		self.getCanvasImage = function () {
			if (canvImg == null) {
				return;
			}
			return canvImg;
		};
		
		/*Getter for canvId
		* @return canvId
		*/
		self.getCanvasId = function () {
			if (canvId == null) {
				return;
			}
			return canvId;
		};
		
		/*Other modules can call this to begin parsing
		*/
		self.requestData = function (data) {
			evaluateData(data);
			checkCompletionStatus();
		};
	};