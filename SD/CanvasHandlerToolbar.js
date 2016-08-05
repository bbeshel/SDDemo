

var CanvasHandlerToolbar = function (parentContext, parserContext) {
	
	var chandlerParent = parentContext;
	
	var parser = parserContext;
	
	var self = this;
	
	
	self.OPTIONS = {
		jsonView : false
	};
	
	var prevMode = "";
		
	
	self.MODE = "";
	
	var annoItemList = [];
	
	var $opModeSelector = $("<select id='opModeSelector' class='toolbarItem permanent'></select>");
	
	var $jsonDisplay = $("<textarea readonly id='jsonToolbarDisplay' class='toolbarItem'></textarea>");
	
	// var jsonItemString = "<div class='toolbarAnnoItem'></div>";
	// var jsonItemString = "<p class='toolbarAnnoItem'></p>";
	var jsonItemString = "<textarea readonly class='toolbarAnnoItem permanent'></textarea>";
	
	var $jsonContainer = $("<div class='toolbarItem permanent' id='jsonDisplayContainer'></div>");
	
	var $toolDiv = $("<div id='toolContainer'></div>");
	
	var $buttonEdit = $("<button class='buttonEdit'>EDIT</button>");
	
	var $snapZoneSlider = $("<input id='snapZoneSlider' class='toolbarItem' type='range' min='1' max='26' step='5' value='10'/>");	
	var $snapZoneLabel = $("<p class = 'permament' style='text-align:center;'>Snap Zone</p>");
	
	var $lineWidthSlider = $("<input id= 'lineWidthSlider' class='permanent toolbarItem' type = 'range' min='1' max='8' step='1' value='1'/>");
	var $lineWidthLabel = $("<p class = 'permanent' style='text-align:center;'>Line Width</p>");
	
	var $lineColorLabel = $("<p style = 'text-align:center;'>Line Colors</p>");
	var $redColorButton = $("<button    class = 'permanent redColorButton'>Red</button>");
	var $yellowColorButton = $("<button class = 'permanent yellowColorButton'>Yellow</button>");
	var $greenColorButton = $("<button  class = 'permanent greenColorButton'>Green</button>");
	var $blueColorButton = $("<button   class =' permanent blueColorButton'>Blue</button>");
	var $whiteColorButton = $("<button  class = 'permanent whiteColorButton'>White</button>");
	var $blackColorButton = $("<button  class = 'permanent blackColorButton'>Black</button>");
	
	var $undoButton = $("<button id='undoButton' class='toolbarItem permanent'>Undo Draw</button>");
	
	var colorButtonList = [$redColorButton, $yellowColorButton, $greenColorButton, $blueColorButton, $whiteColorButton, $blackColorButton];
	
	
	var $saveEditChanges = $("<button id='saveEditChanges' class='toolbarItem'>Save Changes</button>");
	
	var $exportData = $("<button id='exportData' class='permanent toolbarItem'>Export as JSON</button>");
	
	var $debugViewCheckbox = $('<input id="debugViewCheckbox" class="toolbarItem permanent" type="checkbox" name="Debug View" />');
	
	this.init = function ($parent) {
		self.MODE = chandlerParent.MODES[0];
		prevMode = self.MODE;
		for (var n in chandlerParent.MODES) {
			var $op = $(
				"<option value='" + chandlerParent.MODES[n] + "'>" 
				+ chandlerParent.MODE_NAMES[n] + "</option>"
			);
			
			$opModeSelector.append($op);
			
		}
		
		
		
		$parent.append($toolDiv);
		
		
		// $toolDiv.append($buttonEdit);
		$toolDiv.append($opModeSelector);
		$toolDiv.append($snapZoneLabel);
		$toolDiv.append($snapZoneSlider);
		$toolDiv.append($lineWidthLabel);
		$toolDiv.append($lineWidthSlider);
		$toolDiv.append($undoButton);
		//TODO: the text only mode doesnt work, readd when fixed
		// $toolDiv.append($debugViewCheckbox);
		$debugViewCheckbox.prop('checked', true);
		$toolDiv.append($jsonContainer);
		$toolDiv.append($lineColorLabel);
		for (n in colorButtonList){
			$toolDiv.append(colorButtonList[n]);
			console.log(colorButtonList[n]);
		}
		// $toolDiv.append($saveEditChanges);
		
		$opModeSelector.on("change", function () {
			$(document).trigger("toolbar_changeOperationMode", [$opModeSelector.val()]);
			prevMode = $opModeSelector.val();
			// changeCanvasMode($opModeSelector.val());
		});
		
		$snapZoneSlider.on("change", function () {
			// chandlerParent.changeSnapZone($snapZoneSlider.val());
			var val = parseInt($snapZoneSlider.val());
			$(document).trigger("handler_changeSnapZone", [val]);
		});
		
		$lineWidthSlider.on("change", function(){
			var val = parseInt($lineWidthSlider.val());
			$(document).trigger("handler_changeLineWidth", [val]);
		});
		
		$redColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "red");
		});
		
		$yellowColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "yellow");
		});
		
		$greenColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "green");
		});
		
		$blueColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "blue");
		});
		
		$whiteColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "white");
		});
		
		$blackColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "black");
		});
		
		$saveEditChanges.on("click", function () {
			$(document).trigger("handler_saveEditChanges");
		});
		
		$undoButton.on("click", function () {
			$(document).trigger("handler_execUndo");
		});
		
		$debugViewCheckbox.on("change", function () {
			if ($debugViewCheckbox.is(":checked")) {
				self.OPTIONS.jsonView = true;
			} else {
				self.OPTIONS.jsonView = false;
			}
		});
		
		
		
		$(document).on("toolbar_changeOperationMode", function (e, data) {
			changeCanvasMode(data);
		});
		
		$(document).on("toolbar_updateAnnotationData", function () {
			console.trace("update anno json display");
			generateJSONDisplay();
		});
		// $buttonEdit.on("click", function () {
			// changeCanvasMode("EDIT");
		// });
		$(document).on("toolbar_annoItemHighlight", function (e, annoIndex) {
			console.log(annoIndex);
			console.log(annoItemList);
			annoItemHighlight(annoItemList[annoIndex]);
		});
		
		$(document).on("toolbar_annoItemsDeHighlight", function () {
			annoItemsDeHighlight();
		});
		
	};
	
	var generateJSONDisplay = function () {
		if (annoItemList.length > 0) {
			updateJSONDisplay();
			return;
		}
		// $jsonDisplay.val("");
		// var string = "";
		// var annos = chandlerParent.getCompletedPaths();
		// for (var i = 0; i < annos.length; i++) {
			// if (annos[i].JSON != null) {
				// string += JSON.stringify(annos[i].JSON);
			// }
		// }
		// $jsonDisplay.val(string);
		$jsonContainer.empty();
		annoItemList = [];
		var div;
		var annos = chandlerParent.getCompletedPaths();
		if (self.OPTIONS.jsonView) {
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].JSON != null) {
					div = $(jsonItemString);
					var x = annos[i].JSON;
					x = x.replace(/\\"/g, '"');
					div.html(x);
					console.log(annos[i].JSON);
					div.path = annos[i];
					setupAnnoEvents(div);
					annoItemList.push(div);
					$jsonContainer.append(div);
				}
			}
		} else {
			for (var i = 0; i < annos.length; i++) {
				div = $(jsonItemString);
				var x = annos[i].JSON;
				x = x.replace(/\\"/g, '"');
				var comments = parser.getAssociatedAnnoText(annos[i].JSON);
				console.log(comments);
				
				var hts = "";
				if (comments["label"] != null) {
					hts += "LABEL: " + comments["label"];
					hts += "\n";
				}
				if (comments["cnt:chars"] != null) {
					hts += "CNT:CHARS: " + comments["cnt:chars"];
					hts += "\n";
				}
				if (comments["chars"] != null) {
					hts += "CHARS: " + comments["chars"];
					hts += "\n";
				}
				if (hts.length < 1) {
					hts = "(No text)";
				}
				div.html(hts);
				div.path = annos[i];
				setupAnnoEvents(div);
				annoItemList.push(div);
				$jsonContainer.append(div);
			}
		}
	};
	
	var updateJSONDisplay = function () {
		var div;
		var annos = chandlerParent.getCompletedPaths();
		if (self.OPTIONS.jsonView) {
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].JSON != null && annos[i].needsUpdate) {
					if (i !== annos.length - 1 && annos.length > annoItemList.length) {
						$(annoItemList[i]).remove();
					}
					div = $(jsonItemString);
					var x = annos[i].JSON;
					x = x.replace(/\\"/g, '"');
					div.html(x);
					console.log(annos[i].JSON);
					div.path = annos[i];
					setupAnnoEvents(div);
					if (i !== annos.length - 1 > annoItemList.length) {
						annoItemList[i] = div;
					} else {
						annoItemList.push(div);
					}
					$jsonContainer.append(div);
				}
			}
		} else {
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].JSON != null && annos[i].needsUpdate) {
					if (i !== annos.length - 1 > annoItemList.length) {
						$(annoItemList[i]).remove();
					}
					div = $(jsonItemString);
					var x = annos[i].JSON;
					x = x.replace(/\\"/g, '"');
					var comments = parser.getAssociatedAnnoText(annos[i].JSON);
					console.log(comments);
					
					var hts = "";
					if (comments["label"] != null) {
						hts += "LABEL" + comments["label"];
						hts += "\n";
					}
					if (comments["cnt:chars"] != null) {
						hts += "CNT:CHARS" + comments["cnt:chars"];
						hts += "\n";
					}
					if (comments["chars"] != null) {
						hts += "CHARS" + comments["chars"];
						hts += "\n";
					}
					div.html(hts);
					div.path = annos[i];
					setupAnnoEvents(div);
					if (i !== annos.length - 1 > annoItemList.length) {
						annoItemList[i] = div;
					} else {
						annoItemList.push(div);
					}
					$jsonContainer.append(div);
				}
			}
		}
	};
	
	var toolbarAppend = function ($el) {
		$toolDiv.append($el);
	};
	
	//removes all associated tool elements except the opModeSelector
	var toolbarClear = function () {
		// console.log($toolDiv.slice);
		$toolDiv.children().not(".permanent").detach();
	};
	
	var toolbarModeInit = function () {
		toolbarClear();
		switch (self.MODE) {
			case "POLY":
				toolbarAppend($snapZoneLabel);
				toolbarAppend($snapZoneSlider);
				toolbarAppend($lineWidthLabel);
				toolbarAppend($lineWidthSlider);
				for (n in colorButtonList){
					toolbarAppend(colorButtonList[n]);
				}
				break;
			case "EDIT":
				toolbarAppend($saveEditChanges);
				break;
			case "RECT":
				toolbarAppend($lineWidthLabel);
				toolbarAppend($lineWidthSlider);
				for (n in colorButtonList){
					toolbarAppend(colorButtonList[n]);
				}
				break;
			case "CIRC":
				toolbarAppend($lineWidthLabel);
				toolbarAppend($lineWidthSlider);
				for (n in colorButtonList){
					toolbarAppend(colorButtonList[n]);
				}
				break;
			case "ANNO":
				break;
		}
	};
	
	var changeCanvasMode = function (mode) {
		self.MODE = mode;
		$(document).trigger("handler_canvasIntClear");
		toolbarModeInit();
	};
	
	var setupAnnoEvents = function (div) {
		div.on("click", function () {
			$(document).trigger("toolbar_annoItemClick", [div.path]);
			annoItemHighlight(div);
		});
	};
	
	var annoItemsDeHighlight = function () {
		$(".toolbarAnnoItem").removeClass("toolbarAnnoItemSelected");
	};
	
	var annoItemHighlight = function (div) {
		annoItemsDeHighlight();
		div.addClass("toolbarAnnoItemSelected");
		var pos = $jsonContainer.scrollTop();
		var elPos = div.position().top;
		$jsonContainer.animate({
			scrollTop: pos + elPos - 500
		});
		console.log(div.position().top);
	};
	
	self.setDummyState = function () {
		$exportData.on("click", function () {
			$(document).trigger("handler_exportAllDataJSON");
		});
		
		$toolDiv.append($exportData);
	};
	
	
	
	
};