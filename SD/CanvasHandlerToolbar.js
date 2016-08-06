

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
	
	//var $opModeSelector = $("<select id='opModeSelector' class='toolbarItem permanent'></select>");
	
	var $jsonDisplay = $("<textarea readonly id='jsonToolbarDisplay' class='toolbarItem'></textarea>");
	
	// var jsonItemString = "<div class='toolbarAnnoItem'></div>";
	// var jsonItemString = "<p class='toolbarAnnoItem'></p>";
	var jsonItemString = "<textarea readonly class='toolbarAnnoItem permanent'></textarea>";
	
	var $jsonContainer = $("<div class='toolbarItem permanent' id='jsonDisplayContainer'></div>");
	
	var $toolDiv = $("<div id='toolContainer'></div>");
	
	var $modeDiv = $("<div class='permanent toolbarItem'></div>");
	var $polyButton = $("<button class = 'permanent toolbarItem' style='padding: 0px 0px';><img src = 'ic_star_border_black_24px.svg'/></button>");
	var $rectButton = $("<button class ='permanent toolbarItem' style='padding: 0px 0px';><img src='ic_check_box_outline_blank_black_24px.svg'/></button>");
	var $circButton = $("<button class = 'permanent toolbarItem' style='padding: 0px 0px';><img src='ic_radio_button_unchecked_black_24px.svg'/></button>");
	var $editButton = $("<button class = 'permanent toolbarItem' style='padding: 0px 0px';><img src = 'ic_create_black_24px.svg'/></button>");
	var $annoButton = $("<button class = 'permanent toolbarItem' style='padding: 0px 0px';><img src = 'ic_message_black_24px.svg'/></button>");
	var $newUndoButton = $ ("<button class = 'permanent toolbarItem' style='padding: 0px 0px';><img src = 'ic_restore_page_black_24px.svg'/></button>");
	
	var $saveStatusImage = $("<div id = 'permanent toolbarItem'>Save Status:<img src = 'ic_done_black_24px.svg'/></div>");
	
	var $buttonEdit = $("<button class='buttonEdit'>EDIT</button>");
	
	
	var $snapZoneSlider = $("<input id='snapZoneSlider' class='toolbarItem' type='range' min='1' max='26' step='5' value='10'/>");	
	var $snapZoneLabel = $("<p class = 'permament' style='text-align:center;'>Snap Zone</p>");
	
	var $lineWidthSlider = $("<input id= 'lineWidthSlider' class='permanent toolbarItem' type = 'range' min='1' max='8' step='1' value='1'/>");
	var $lineWidthLabel = $("<p class = 'permanent' style='text-align:center;'>Line Width</p>");
	
	var $lineColorLabel = $("<p style = 'text-align:center;'>Line Colors</p>");
	var $redColorButton = $("<button    class = 'permanent redColorButton' style= 'padding: 2px 9px';>Red</button>");
	var $yellowColorButton = $("<button class = 'permanent yellowColorButton' style= 'padding: 2px 9px';>Yellow</button>");
	var $greenColorButton = $("<button  class = 'permanent greenColorButton' style= 'padding: 2px 9px';>Green</button>");
	var $blueColorButton = $("<button   class =' permanent blueColorButton' style= 'padding: 2px 9px';>Blue</button>");
	//var $purpleColorButton = $("<button class = 'permanent purpleColorButton' style= 'padding: 2px 9px';>Purple</button>");
	var $whiteColorButton = $("<button  class = 'permanent whiteColorButton' style= 'padding: 2px 9px';>White</button>");
	var $blackColorButton = $("<button  class = 'permanent blackColorButton' style= 'padding: 2px 9px';>Black</button>");
	
	//var $undoButton = $("<button id='undoButton' class='toolbarItem permanent'>Undo Draw</button>");
	
	var colorButtonList = [$redColorButton, $yellowColorButton, $greenColorButton, $blueColorButton, /*$purpleColorButton,*/ $whiteColorButton, $blackColorButton];
	
	
	var $saveEditChanges = $("<button id='saveEditChanges' class='toolbarItem'>Save Changes</button>");
	
	var $exportData = $("<button id='exportData' class='permanent toolbarItem'>Export as JSON</button>");
	
	var $debugViewCheckbox = $('<input id="debugViewCheckbox" class="toolbarItem permanent" type="checkbox" name="Debug View" />');
	
	var $canvasIdExpose = $('<textarea readonly class="toolbarItem permanent">!No ID!</textarea>');
	
	this.init = function ($parent) {
		self.MODE = chandlerParent.MODES[0];
		prevMode = self.MODE;
		/*for (var n in chandlerParent.MODES) {
			var $op = $(
				"<option value='" + chandlerParent.MODES[n] + "'>" 
				+ chandlerParent.MODE_NAMES[n] + "</option>"
			);
			
			$opModeSelector.append($op);
			
		}*/
		
		
		
		$parent.append($toolDiv);
		$parent.append($saveStatusImage);
		
		
		// $toolDiv.append($buttonEdit);
		//$toolDiv.append($opModeSelector);
		$modeDiv.append($polyButton);
		$modeDiv.append($rectButton);
		$modeDiv.append($circButton);
		$modeDiv.append($editButton);
		$modeDiv.append($annoButton);
		$modeDiv.append($newUndoButton);
		$toolDiv.append($modeDiv);
		//$toolDiv.append($undoButton);
		//TODO: the text only mode doesnt work, readd when fixed
		// $toolDiv.append($debugViewCheckbox);
		$debugViewCheckbox.prop('checked', true);
		$toolDiv.append($jsonContainer);
		$toolDiv.append($snapZoneLabel);
		$toolDiv.append($snapZoneSlider);
		$toolDiv.append($lineWidthLabel);
		$toolDiv.append($lineWidthSlider);
		$toolDiv.append($lineColorLabel);
		for (n in colorButtonList){
			$toolDiv.append(colorButtonList[n]);
			console.log(colorButtonList[n]);
		}
		$toolDiv.append($canvasIdExpose);
		// $toolDiv.append($saveEditChanges);
		
		/*$opModeSelector.on("change", function () {
			$(document).trigger("toolbar_changeOperationMode", [$opModeSelector.val()]);

			$opModeSelector.on("change", function () {
			$(document).trigger("toolbar_changeOperationMode", [prevMode]);
			prevMode = $opModeSelector.val();
			changeCanvasMode(prevMode);
			// changeCanvasMode($opModeSelector.val());
		});*/
		
		$polyButton.on("click", function(){
			$(document).trigger("handler_changeSaveStatus");
			changeCanvasMode("POLY");
		});
		
		$rectButton.on("click", function(){
			$(document).trigger("handler_changeSaveStatus");
			changeCanvasMode("RECT");
		});
		
		$circButton.on("click", function(){
			$(document).trigger("handler_changeSaveStatus");
			changeCanvasMode("CIRC");
		});
		
		$editButton.on("click", function(){
			$(document).trigger("handler_changeSaveStatus");
			changeCanvasMode("EDIT");
		});
		
		$annoButton.on("click", function(){
			$(document).trigger("handler_changeSaveStatus");
			changeCanvasMode("ANNO");
		});
		
		$newUndoButton.on("click", function(){
			$(document).trigger("handler_execUndo");
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
		
		/*$purpleColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "purple");
		});*/
		
		$whiteColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "white");
		});
		
		$blackColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "black");
		});
		
		$saveEditChanges.on("click", function () {
			$(document).trigger("handler_saveEditChanges");
		});
		
		/*$undoButton.on("click", function () {
			$(document).trigger("handler_execUndo");
		});*/
		
		$debugViewCheckbox.on("change", function () {
			if ($debugViewCheckbox.is(":checked")) {
				self.OPTIONS.jsonView = true;
			} else {
				self.OPTIONS.jsonView = false;
			}
		});
		
		$(document).on("toolbar_exposeCanvasId", function (e, data) {
			$canvasIdExpose.html(data);
		});
		
		
		
		 //$(document).on("toolbar_changeOperationMode", function (e, data) {
			// changeCanvasMode(data);
		// });
		
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

		$(document).on("toolbar_getSaveStatus", function(){
			return getSaveStatus;
		});
		
		$(document).on("toolbar_changeSaveStatus", function(e, unsavedChanges) {
			changeSaveStatus(unsavedChanges);
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
				div.editable = comments;
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
					// if (i !== annos.length - 1 && annos.length > annoItemList.length) {
						// $(annoItemList[i]).remove();
					// }
					div = $(jsonItemString);
					var x = annos[i].JSON;
					x = x.replace(/\\"/g, '"');
					div.html(x);
					console.log(annos[i].JSON);
					div.path = annos[i];
					setupAnnoEvents(div);
					if (i < annoItemList.length) {
						annoItemList[i] = div;
					} else {
						annoItemList.push(div);
						$jsonContainer.append(div);
					}
				}
			}
		} else {
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].JSON != null && annos[i].needsUpdate) {
					// if (i !== annos.length - 1 > annoItemList.length) {
						// $(annoItemList[i]).remove();
					// }
					div = $(jsonItemString);
					var x = annos[i].JSON;
					x = x.replace(/\\"/g, '"');
					if (annos[i].hasNewText()) {
						var comments = { 
							"label" : annos[i]["label"],
							"chars" : annos[i]["chars"],
							"cnt:chars" : annos[i]["cnt:chars"]
						};
					} else {
						var comments = parser.getAssociatedAnnoText(annos[i].JSON);
					}
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
					div.editable = comments;
					div.path = annos[i];
					// setupAnnoEvents(div);
					if (i < annoItemList.length) {
						annoItemList[i].editable = comments;
						annoItemList[i].path = annos[i];
						annoItemList[i].html(hts);
					} else {
						annoItemList.push(div);
						$jsonContainer.append(div);
					}
				} else if (annos[i].markedForDelete) {
					annoItemList[i].remove();
					annoItemList.splice(i, 1);
				}
			}
		}
		
		for (var i = 0; i < annoItemList.length; i++) {
			setupAnnoEvents(annoItemList[i]);
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
				toolbarAppend($saveStatusImage);
				toolbarAppend($snapZoneLabel);
				toolbarAppend($snapZoneSlider);
				toolbarAppend($lineWidthLabel);
				toolbarAppend($lineWidthSlider);
				for (n in colorButtonList){
					toolbarAppend(colorButtonList[n]);
				}
				break;
			case "EDIT":
				toolbarAppend($saveStatusImage);
				toolbarAppend($saveEditChanges);
				break;
			case "RECT":
				toolbarAppend($saveStatusImage);
				toolbarAppend($lineWidthLabel);
				toolbarAppend($lineWidthSlider);
				for (n in colorButtonList){
					toolbarAppend(colorButtonList[n]);
				}
				break;
			case "CIRC":
				toolbarAppend($saveStatusImage);
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
		$(document).trigger("toolbar_changeOperationMode", [self.MODE]);
		// prevMode = mode;
		self.MODE = mode;
		$(document).trigger("handler_canvasIntClear");
		toolbarModeInit();
	};
	
	
	var changeSaveStatus = function(unsavedChange) {
		console.log(unsavedChange);
		saveStatusImage = $("<div id = 'permanent toolbarItem'>Save Status:<img src = 'ic_close_black_24px.svg'/></div>");
		if (unsavedChange == false){
			saveStatusImage = $("<div id = 'permanent toolbarItem'>Save Status:<img src = 'ic_done_black_24px.svg'/></div>");
		}
		else{
			saveStatusImage = $("<div id = 'permanent toolbarItem'>Save Status:<img src = 'ic_close_black_24px.svg'/></div>");
		}
		/*toolbar.detach("saveStatusImage");*/
		toolbarAppend(saveStatusImage);
	};
	
	var setupAnnoEvents = function (div) {
		div.on("click", function () {
			$(document).trigger("toolbar_annoItemClick", [div.path]);
			annoItemHighlight(div);
			setupAnnoCharEdit(div);
		});
	};
	
	var setupAnnoCharEdit = function (div) {
		var $textDiv = $("<div id='annoCharsBox' class='toolbarItem'></div>");
		var isChars = false;
		for (var n in div.editable) {
			if (div.editable[n] != null) {
				isChars = true;
				var $textBoxLabel = $("<span class='toolbarAnnoTextItem'>" + n + ": </span>");
				var $textBox = $("<textarea class='toolbarAnnoTextItem'>" + div.editable[n] + "</textarea>");
				$textBox.on("focusout", function () {
					$(document).trigger("toolbar_annoItemCharsUpdate", [div.path, n, $textBox.val()]);
					updateJSONDisplay();
				});
				$textDiv.append($textBoxLabel);
				$textDiv.append($textBox);
				
			} else {
				var $textBoxLabel = $("<span class='toolbarAnnoTextItem'>" + n + ": </span>");
				var $textBox = $("<textarea readonly placeholder='NO LABEL: CANNOT EDIT' class='toolbarAnnoTextItem'></textarea>");
				$textDiv.append($textBoxLabel);
				$textDiv.append($textBox);
			}
		}
		if (isChars) {
			$toolDiv.append($textDiv);
		}
	};
	
	var annoItemsDeHighlight = function () {
		$(".toolbarAnnoItem").removeClass("toolbarAnnoItemSelected");
	};
	
	var annoItemHighlight = function (div) {
		annoItemsDeHighlight();
		$("#annoCharsBox").remove();
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
		$toolDiv.append($saveStatusImage);
	};
	
	
	
	
};