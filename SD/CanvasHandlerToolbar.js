

var CanvasHandlerToolbar = function (parentContext) {
	
	var chandlerParent = parentContext;
	
	var self = this;
	
	self.MODE = "";
	
	var $opModeSelector = $("<select id='opModeSelector' class='toolbarItem'></select>");
	
	var $jsonDisplay = $("<textarea readonly id='jsonToolbarDisplay' class='toolbarItem'></textarea>");
	
	// var jsonItemString = "<div class='toolbarAnnoItem'></div>";
	// var jsonItemString = "<p class='toolbarAnnoItem'></p>";
	var jsonItemString = "<textarea readonly class='toolbarAnnoItem'></textarea>";
	
	var $jsonContainer = $("<div class='toolbarItem' id='jsonDisplayContainer'></div>");
	
	var $toolDiv = $("<div id='toolContainer'></div>");
	
	var $buttonEdit = $("<button class='buttonEdit'>EDIT</button>");
	
	var $snapZoneSlider = $("<input id='snapZoneSlider' class='toolbarItem' type='range' min='1' max='26' step='5' value='10'/>");	
	var $snapZoneLabel = $("<p style='text-align:center;'>Snap Zone</p>");
	
	var $lineWidthSlider = $("<input id= 'lineWidthSlider' class='toolbarItem' type = 'range' min='1' max='8' step='1' value='1'/>");
	var $lineWidthLabel = $("<p style='text-align:center;'>Line Width</p>");
	
	var $lineColorLabel = $("<p style = 'text-align:center;'>Line Colors</p>");
	var $redColorButton = $("<button class = 'redColorButton'>Red</button>");
	var $yellowColorButton = $("<button class = 'yellowColorButton'>Yellow</button>");
	var $greenColorButton = $("<button class = 'greenColorButton'>Green</button>");
	var $blueColorButton = $("<button class =' blueColorButton'>Blue</button>");
	var $whiteColorButton = $("<button class = 'whiteColorButton'>White</button>");
	var $blackColorButton = $("<button class = 'blackColorButton'>Black</button>");
	
	var colorButtonList = [$redColorButton, $yellowColorButton, $greenColorButton, $blueColorButton, $whiteColorButton, $blackColorButton];
	
	
	var $saveEditChanges = $("<button id='saveEditChanges' class='toolbarItem'>Save Changes</button>");
	
	var $exportData = $("<button id='exportData' class='toolbarItem'>Export as JSON</button>");
	
	this.init = function ($parent) {
		self.MODE = chandlerParent.MODES[0];
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
		$toolDiv.append($jsonContainer);
		$toolDiv.append($lineColorLabel);
		for (n in colorButtonList){
			$toolDiv.append(colorButtonList[n]);
			console.log(colorButtonList[n]);
		}
		// $toolDiv.append($saveEditChanges);
		
		$opModeSelector.on("change", function () {
			var val = $opModeSelector.val();
			$(document).trigger("toolbar_changeOperationMode", [val]);
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
		
		
		
		$(document).on("toolbar_changeOperationMode", function (e, data) {
			changeCanvasMode(data);
		});
		
		$(document).on("toolbar_updateAnnotationData", function () {
			updateJSONDisplay();
		});
		// $buttonEdit.on("click", function () {
			// changeCanvasMode("EDIT");
		// });
		
	};
	
	var updateJSONDisplay = function () {
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
		var div;
		var annos = chandlerParent.getCompletedPaths();
		for (var i = 0; i < annos.length; i++) {
			if (annos[i].JSON != null) {
				div = $(jsonItemString);
				var x = annos[i].JSON;
				x = x.replace(/\\"/g, '"');
				div.html(x);
				console.log(annos[i].JSON);
				div.path = annos[i];
				setupAnnoClick(div);
				$jsonContainer.append(div);
			}
		}
	};
	
	var toolbarAppend = function ($el) {
		$toolDiv.append($el);
	};
	
	//removes all associated tool elements except the opModeSelector
	var toolbarClear = function () {
		// console.log($toolDiv.slice);
		$toolDiv.children().not(".toolbarAnnoItem").not($opModeSelector).not($jsonContainer).detach();
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
	
	var setupAnnoClick = function (div) {
		div.on("click", function () {
			$(document).trigger("toolbar_annoItemClick", [div.path]);
		});
	};
	
	self.setDummyState = function () {
		$exportData.on("click", function () {
			$(document).trigger("handler_exportAllDataJSON");
		});
		
		$toolDiv.append($exportData);
	};
	
	
	
	
};