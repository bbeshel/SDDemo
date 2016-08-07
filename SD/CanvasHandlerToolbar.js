

var CanvasHandlerToolbar = function (parentContext, parserContext) {
	
	var chandlerParent = parentContext;
	
	var parser = parserContext;
	
	var self = this;
	
	//Option that allows the user to view details about the JSON objects that are created.
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
	
	//Div for all elements for the "tools" the user will be using and seeing to help them create annotations.
	var $toolDiv = $("<div id='toolContainer'></div>");
	
	//Div for all buttons that change the "mode" of the canvas, which allow the user to interact with the canvas in different ways.
	var $modeDiv = $("<div class='permanent annoCharsBoxContainer toolbarItem'></div>");
	
	//Button that allows the user to create polygonal shaped annotations.
	var $polyButton = $("<button class = 'permanent toolbarAnnoTextItem modeButton' style='padding: 1px 39px';><img src = 'ic_star_border_black_24px.svg'/></button>");
	
	//Button that allows the user to create rectalinear shaped annotations.
	var $rectButton = $("<button class ='permanent toolbarAnnoTextItem modeButton' style='padding: 1px 39px';><img src='ic_check_box_outline_blank_black_24px.svg'/></button>");
	
	//Button that allows the user to create circular shaped annotations (currently not functional).
	//var $circButton = $("<button class = 'permanent modeButton' style='padding: 1px 6px';><img src='ic_radio_button_unchecked_black_24px.svg'/></button>");
	
	//Button that allows the user to edit previously created annotations.
	var $editButton = $("<button class = 'permanent toolbarAnnoTextItem modeButton' style='padding: 1px 39px';><img src = 'ic_create_black_24px.svg'/></button>");
	
	//Button that allows the user to write comments on a previously created annotation (obsolete: functionality contained in another function).
	//var $annoButton = $("<button class = 'permanent modeButton' style='padding: 1px 6px';><img src = 'ic_message_black_24px.svg'/></button>");
	
	//Button that allows the user to undo a previously placed path for an annotation.
	//var $newUndoButton = $ ("<button class = 'permanent modeButton' style='padding: 1px 6px';><img src = 'ic_restore_page_black_24px.svg'/></button>");
	
	//Image that displays the current save state of the canvas. 
	//A check indicates the canvas has been saved to the server. 
	//An "X" indicates there are changes that have not been saved to the server.
	var $saveStatusImage = $("<div id='saveStatusImage' class = 'permanent toolbarItem'>Save Status:<img src = 'ic_done_black_24px.svg'/></div>");
	
	//Button that allows the user to change the "mode" of the canavs to "edit" (obsolete: contained within modeDiv).
	// var $buttonEdit = $("<button class='buttonEdit'>EDIT</button>");
	
	//Slider that controls the "snap zone", the minimal area a path must end at for 
	//the path to automatically "snap" to the beginning of the pathing of the annotation.
	var $snapZoneSliderContainer = $("<span class='toolbarAnnoTextItem'></span>");
	var $snapZoneSlider = $("<input id='snapZoneSlider' class='permanent' type='range' min='1' max='26' step='5' value='10'/>");	
	var $snapZoneLabel = $("<p class = 'permanent toolbarAnnoTextItem' style='text-align:center;'>Snap Zone</p>");
	
	//Slider that controls the width of the path of an annotation when it is being created.
	var $lineWidthSliderContainer = $("<span class='toolbarAnnoTextItem'></span>");
	var $lineWidthSlider = $("<input id= 'lineWidthSlider' class=' permanent' type = 'range' min='1' max='8' step='1' value='1'/>");
	var $lineWidthLabel = $("<p class = 'permanent toolbarAnnoTextItem' style='text-align:center;'>Line Width</p>");
	

	//Buttons that control the color of the path of an annotation when it is being created.
	var $lineColorLabel = $("<p class ='permanent' style = 'text-align:center;'>Line Colors</p>");
	var $redLineColorButton = $("<button class = 'permanent' style= 'padding: 2px 9px';>Red</button>");
	var $yellowLineColorButton = $("<button class = 'permanent' style= 'padding: 2px 9px';>Yellow</button>");
	var $greenLineColorButton = $("<button  class = 'permanent' style= 'padding: 2px 9px';>Green</button>");
	var $blueLineColorButton = $("<button   class =' permanent' style= 'padding: 2px 9px';>Blue</button>");
	//var $purpleLineColorButton = $("<button class = 'permanent purpleColorButton' style= 'padding: 2px 9px';>Purple</button>");
	var $whiteLineColorButton = $("<button  class = 'permanent whiteColorButton' style= 'padding: 2px 9px';>White</button>");
	var $blackLineColorButton = $("<button  class = 'permanent blackColorButton' style= 'padding: 2px 9px';>Black</button>");
	var lineColorButtonList = [$redLineColorButton, $yellowLineColorButton, $greenLineColorButton, $blueLineColorButton, /*$purpleLineColorButton,*/ $whiteLineColorButton, $blackLineColorButton];

	//Buttons that control the color of the path that displays where the path of an annotation will be placed if the user clicks their mouse.
	var $indicatorColorLabel = $("<p class = 'permanent' style = 'text-align:center;'>Indicator Colors</p>");
	var $redIndicatorButton = $("<button class = 'permanent' style= 'padding: 2px 9px';>Red</button>");
	var $yellowIndicatorButton = $("<button class = 'permanent' style= 'padding: 2px 9px';>Yellow</button>");
	var $greenIndicatorButton = $("<button  class = 'permanent' style= 'padding: 2px 9px';>Green</button>");
	var $blueIndicatorButton = $("<button   class =' permanent' style= 'padding: 2px 9px';>Blue</button>");
	//var $purpleIndicatorButton = $("<button class = 'permanent purpleColorButton' style= 'padding: 2px 9px';>Purple</button>");
	var $whiteIndicatorButton = $("<button  class = 'permanent whiteColorButton' style= 'padding: 2px 9px';>White</button>");
	var $blackIndicatorButton = $("<button  class = 'permanent blackColorButton' style= 'padding: 2px 9px';>Black</button>");
	var indicatorButtonList = [$redIndicatorButton, $yellowIndicatorButton, $greenIndicatorButton, $blueIndicatorButton, /*purpleIndicatorButton,*/ $whiteIndicatorButton, $blackIndicatorButton];
	
		
	
	//Button that saves changes made to an annotation in "edit mode".
	var $saveEditChanges = $("<button id='saveEditChanges' class='toolbarAnnoTextItem permanent'>Save Changes</button>");
	
	//Button that sends the canvas, along with any annotations within, as a JSON object to the server for storing.
	var $exportData = $("<button id='exportData' class='permanent toolbarItem'>Export as JSON</button>");
	
	//Checkbox which controls whether or not to put the program in debug mode.
	var $debugViewCheckbox = $('<input id="debugViewCheckbox" class="toolbarItem permanent" type="checkbox" name="Debug View" />');
	
	//Displays the ID of the current canvas.
	var $canvasIdExpose = $('<textarea readonly class="toolbarItem permanent">!No ID!</textarea>');
	
	var $saveModal = $("<div id='saveModal' class='modal'><div class='modal-content'><p>Saving...</p></div></div>");
	
	//Button that allows the user to delete a selected annotation.
	var $deleteAnnoButton = $("<button id='deleteAnnoButton' class='toolbarAnnoTextItem permanent'>Delete selected annotation</button>");
	
	//Button that allows the user to cycle through previously created annotations.
	var $cycleAnnoButton = $("<button id='cycleAnnoButton' class='toolbarAnnoTextItem permanent'>Select next annotation</button>");
	
	//Displays the link of the canvas ID.
	var $canvIdLabel = $("<p class = 'permanent' style='text-align:center;'>Canvas ID Link</p>");
	
	//Div that contains tools for the user to directly interact with previously created annotations.
	var $annoButtonDiv = $("<div class='permanent annoCharsBoxContainer toolbarItem'></div>");
	
	//Div that contains the labels for the sliders of the toolbar.
	var $sliderLabelDiv = $("<div class='permanent annoCharsBoxContainer toolbarItem'></div>");
	//Div that contains the sliders of the toolbar.
	var $sliderDiv = $("<div class='permanent annoCharsBoxContainer toolbarItem'></div>");
	
	this.init = function ($parent) {
		//Sets the first mode to "POLY"
		self.MODE = chandlerParent.MODES[0];
		prevMode = self.MODE;
		/*for (var n in chandlerParent.MODES) {
			var $op = $(
				"<option value='" + chandlerParent.MODES[n] + "'>" 
				+ chandlerParent.MODE_NAMES[n] + "</option>"
			);
			
			$opModeSelector.append($op);
			
		}*/
		
		$("body").append($saveModal);
		
		//Adds the toolDiv to the canvas, then begins to add the various tools the toolDiv requires to the toolDiv.
		$parent.append($toolDiv);
		$toolDiv.append($saveStatusImage);
		//Darkens the poly button to indicate to the user they are currently on this mode.
		$polyButton.addClass("modeButtonPressed");
		$modeDiv.append($polyButton);
		$modeDiv.append($rectButton);
		//$modeDiv.append($circButton);
		$modeDiv.append($editButton);
		//$modeDiv.append($annoButton);
		//$modeDiv.append($newUndoButton);
		$toolDiv.append($modeDiv);
		
		
		$annoButtonDiv.append($saveEditChanges);
		$annoButtonDiv.append($deleteAnnoButton);
		$annoButtonDiv.append($cycleAnnoButton);
		$toolDiv.append($annoButtonDiv);
		
		
		$sliderLabelDiv.append($snapZoneLabel);
		$sliderLabelDiv.append($lineWidthLabel);
		$toolDiv.append($sliderLabelDiv);
		
		$snapZoneSliderContainer.append($snapZoneSlider);
		$sliderDiv.append($snapZoneSliderContainer);
		$lineWidthSliderContainer.append($lineWidthSlider);
		$sliderDiv.append($lineWidthSliderContainer);
		$toolDiv.append($sliderDiv);
		
		
		$toolDiv.append($lineColorLabel);
		for (n in lineColorButtonList){
			$toolDiv.append(lineColorButtonList[n]);
		}
		$toolDiv.append($indicatorColorLabel);
		for (n in indicatorButtonList){
			$toolDiv.append(indicatorButtonList[n]);
		}
		//TODO: the text only mode doesnt work, readd when fixed
		// $toolDiv.append($debugViewCheckbox);
		$debugViewCheckbox.prop('checked', true);
		$toolDiv.append($jsonContainer);
		$toolDiv.append($canvIdLabel);
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
		
		//Mode button iteractions. Each button will change the mode of the toolbar, 
		//displaying this by undarkening the previous mode button and darkening the current one.
		$polyButton.on("click", function(){
			//$(document).trigger("handler_changeSaveStatus");
			$modeDiv.children().removeClass("modeButtonPressed");
			$polyButton.addClass("modeButtonPressed");
			changeCanvasMode("POLY");
		});
		
		$rectButton.on("click", function(){
			//$(document).trigger("handler_changeSaveStatus");
			$modeDiv.children().removeClass("modeButtonPressed");
			$rectButton.addClass("modeButtonPressed");
			changeCanvasMode("RECT");
		});
		
		/*$circButton.on("click", function(){
			$(document).trigger("handler_changeSaveStatus");
			changeCanvasMode("CIRC");
		});*/
		
		$editButton.on("click", function(){
			//$(document).trigger("handler_changeSaveStatus");
			$modeDiv.children().removeClass("modeButtonPressed");
			$editButton.addClass("modeButtonPressed");
			changeCanvasMode("EDIT");
		});
		
		/*$annoButton.on("click", function(){
			$(document).trigger("handler_changeSaveStatus");
			changeCanvasMode("ANNO");
		});*/
		
		/*$newUndoButton.on("click", function(){
			$(document).trigger("handler_execUndo");
		});*/
		
		
		//Snap zone interaction. Increases the snap zone going to the right, decreases the snap zone going to the left.
		$snapZoneSlider.on("change", function () {
			// chandlerParent.changeSnapZone($snapZoneSlider.val());
			var val = parseInt($snapZoneSlider.val());
			$(document).trigger("handler_changeSnapZone", [val]);
		});
		
		
		//Line width interaction. Starts at the minimum line width, and increases as the slider goes to the right.
		$lineWidthSlider.on("change", function(){
			var val = parseInt($lineWidthSlider.val());
			$(document).trigger("handler_changeLineWidth", [val]);
		});
		
		
		//Color button interactions. Each button changes the path line color to the color displayed.
		$redLineColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "red");
		});
		
		$yellowLineColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "yellow");
		});
		
		$greenLineColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "green");
		});
		
		$blueLineColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "blue");
		});
		
		/*$purpleLineColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "purple");
		});*/
		
		$whiteLineColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "white");
		});
		
		$blackLineColorButton.on("click", function(){
			$(document).trigger("handler_changeLineColor", "black");
		});
		
		
		//Indicator color interactions. Changes the color of the path indicator to the color displayed.
		$redIndicatorButton.on("click", function(){
			$(document).trigger("handler_changeIndicatorColor", "red");
		});
		
		$yellowIndicatorButton.on("click", function(){
			$(document).trigger("handler_changeIndicatorColor", "yellow");
		});
		
		$greenIndicatorButton.on("click", function(){
			$(document).trigger("handler_changeIndicatorColor", "green");
		});
		
		$blueIndicatorButton.on("click", function(){
			$(document).trigger("handler_changeIndicatorColor", "blue");
		});
		
		/*$purpleIndicatorButton.on("click", function(){
			$(document).trigger("handler_changeIndicatorColor", "purple");
		});*/
		
		$whiteIndicatorButton.on("click", function(){
			$(document).trigger("handler_changeIndicatorColor", "white");
		});
		
		$blackIndicatorButton.on("click", function(){
			$(document).trigger("handler_changeIndicatorColor", "black");
		});
		
		
		//Save edit changes button interaction. Saves changes made in "edit mode" when clicked.
		$saveEditChanges.on("click", function () {
			$(document).trigger("handler_saveEditChanges");
		});
		
		
		//Debug Checkbox interaction. Changes the view to debug mode when checked, 
		//allowing the user to see JSON object attributes, reverts to normal when unchecked.
		$debugViewCheckbox.on("change", function () {
			if ($debugViewCheckbox.is(":checked")) {
				self.OPTIONS.jsonView = true;
			} else {
				self.OPTIONS.jsonView = false;
			}
		});
		
		
		//Delete annotation button interaction. Deletes the selected annotaiton on click.
		$deleteAnnoButton.on("click", function () {
			$(document).trigger("handler_deleteAnnotation");
		});
		
		
		//Annotation cycle button interaction. Cycles through previously created annotations on click.
		$cycleAnnoButton.on("click", function () {
			$(document).trigger("handler_cycleAnnotation");
		});
		
		
		//Exposing canvas ID interaction. Responds to a call to reveal the link of the canvas ID.
		$(document).on("toolbar_exposeCanvasId", function (e, data) {
			$canvasIdExpose.html(data);
		});
		
		
		//Update Annotation Data interaction. Responds to a call to update annotation data.
		$(document).on("toolbar_updateAnnotationData", function () {
			console.trace("update anno json display");
			generateJSONDisplay();
		});


		//Annotation Highlight interaction. Responds to a call to highlight an annotation item.
		$(document).on("toolbar_annoItemHighlight", function (e, annoIndex) {
			console.log(annoIndex);
			console.log(annoItemList);
			annoItemHighlight(annoItemList[annoIndex]);
		});
		
		
		//Annotation De-Highlight interaction. Repsonds to a call to de-highlight an annotation item.
		$(document).on("toolbar_annoItemsDeHighlight", function () {
			annoItemsDeHighlight();
		});

		
		//Save Status request interaction. Changes the saveStatusImage of the canvas, if the saveStatus has changed.
		$(document).on("toolbar_changeSaveStatus", function(e, unsavedChanges) {
			changeSaveStatus(unsavedChanges);
		});
		
		
		//
		$(document).on("toolbar_saveChangesComplete", function () {
			$saveModal.removeClass("modal-active");
		});
		
	};
	
	
	//Displays JSON objects that have been created.
	var generateJSONDisplay = function () {
		//Simply updates the display if JSON objects have already been created.
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
		//Takes the paths of the completed annotation.
		var annos = chandlerParent.getCompletedPaths();
		if (self.OPTIONS.jsonView) {
			//Debug mode is not on. Program will not display attributes of the JSON objects.
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
			//Allows the user to view attributes of the JSON objects
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].JSON != null) {
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
		}
	};
	
	
	//Updaes the JSON Display
	var updateJSONDisplay = function () {
		var div;
		var annos = chandlerParent.getCompletedPaths();
		if (self.OPTIONS.jsonView) {
		//Debug mode is off. Attributes of JSON objects will not be displayed.
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
			//Debug mode is on. Attributes of JSON objects will be displayed.
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
				}
//				else if (annos[i].markedForDelete) {
					// annoItemList[i].remove();
					// annoItemList.splice(i, 1);
				// }
			}
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].markedForDelete) {
					annoItemList[i].remove();
					annoItemList.splice(i, 1);
				}
			}
		}
		
		for (var i = 0; i < annoItemList.length; i++) {
			setupAnnoEvents(annoItemList[i]);
		}
	};
	
	
	//Adds elements to toolDiv.
	var toolbarAppend = function ($el) {
		$toolDiv.append($el);
	};
	
	//Removes all associated tool elements except the opModeSelector
	var toolbarClear = function () {
		// console.log($toolDiv.slice);
		$toolDiv.children().not(".permanent").detach();
	};
	
	
	//Changes the view of the toolbar based on the "mode" the the canvas is in.
	var toolbarModeInit = function () {
		toolbarClear();
		switch (self.MODE) {
			case "POLY":
				toolbarAppend($snapZoneLabel);
				toolbarAppend($snapZoneSlider);
				toolbarAppend($lineWidthLabel);
				toolbarAppend($lineWidthSlider);
				break;
			case "EDIT":
				toolbarAppend($saveEditChanges);
				break;
			case "RECT":
				toolbarAppend($lineWidthLabel);
				toolbarAppend($lineWidthSlider);
				break;
			/*case "CIRC":
				toolbarAppend($lineWidthLabel);
				toolbarAppend($lineWidthSlider);
				break;
			case "ANNO":
				break;*/
		}
	};
	
	//Changes the "mode" of the canvas.
	var changeCanvasMode = function (mode) {
		$(document).trigger("toolbar_changeOperationMode", [self.MODE]);
		prevMode = self.MODE;
		self.MODE = mode;
		$(document).trigger("handler_canvasIntClear");
		// toolbarModeInit();
	};
	
	
	//Changes the saveStatusImage, if the current saveStatus obtained from the canvasHandler does not match up with the current image.
	var changeSaveStatus = function(unsavedChange) {
		//$toolDiv.detach($saveStatusImage);
		//console.log("Checkpoint");
		if (!unsavedChange){
			saveStatusImage = $("<div id='saveStatusImage' class = 'permanent toolbarItem'>Save Status:<img src = 'ic_done_black_24px.svg'/></div>");
		}
		else{
			saveStatusImage = $("<div id='saveStatusImage' class = 'permanent toolbarItem' style='background-color: #f44336;'>Save Status:<img src = 'ic_close_black_24px.svg'/></div>");
			//$saveStatusImage.addClass("unsavedStatus");
		}
		$("#saveStatusImage").remove();
		$toolDiv.prepend(saveStatusImage);
	};
	
	
	//Sets up the canvas for user interaction with previously created annotations, 
	//if the user preforms an action that would require interaction with these annotations.
	var setupAnnoEvents = function (div) {
		div.on("click", function () {
			$(document).trigger("toolbar_annoItemClick", [div.path]);
			annoItemHighlight(div);
			setupAnnoCharEdit(div);
		});
	};
	
	//Allows the user to edit the characters within an annotation.
	var setupAnnoCharEdit = function (div) {
		var $textDivContainer = $("<div id='annoCharsBox' class='toolbarItem'></div>");
		var $labelDiv = $("<div class='toolbarItem annoCharsBoxContainer'></div>");
		var $textDiv = $("<div class='toolbarItem annoCharsBoxContainer'></div>");
		var isChars = false;
		for (var n in div.editable) {
			if (div.editable[n] != null) {
				//If there are no characters, add some.
				isChars = true;
				var $textBoxLabel = $("<span class='toolbarAnnoTextItem'>" + n + ": </span>");
				var $textBox = $("<textarea class='toolbarAnnoTextItem'>" + div.editable[n] + "</textarea>");
				$textBox.on("focusout", function () {
					$(document).trigger("toolbar_annoItemCharsUpdate", [div.path, n, $textBox.val()]);
					updateJSONDisplay();
				});
				$labelDiv.append($textBoxLabel);
				$textDiv.append($textBox);
				
			} else {
				var $textBoxLabel = $("<span class='toolbarAnnoTextItem'>" + n + ": </span>");
				var $textBox = $("<textarea readonly placeholder='NO LABEL: CANNOT EDIT' class='toolbarAnnoTextItem'></textarea>");
				$labelDiv.append($textBoxLabel);
				$textDiv.append($textBox);
			}
		}
		$textDivContainer.append($labelDiv);
		$textDivContainer.append($textDiv);
		$toolDiv.append($textDivContainer);
		// if (isChars) {
			// $toolDiv.append($textDiv);
		// }
	};
	
	//De-Highlights a specific annotation item.
	var annoItemsDeHighlight = function () {
		$(".toolbarAnnoItem").removeClass("toolbarAnnoItemSelected");
	};
	
	//Highlights a specific annotation item.
	var annoItemHighlight = function (div) {
		annoItemsDeHighlight();
		$("#annoCharsBox").remove();
		div.addClass("toolbarAnnoItemSelected");
		var pos = $jsonContainer.scrollTop();
		var elPos = div.position().top;
		$jsonContainer.animate({
			scrollTop: pos + elPos - 500
		}, 10);
		console.log(div.position().top);
	};
	
	self.setDummyState = function () {
		$exportData.on("click", function () {
			$(document).trigger("handler_exportAllDataJSON");
			$saveModal.addClass("modal-active");
			$(document).trigger("handler_preventUserInteraction");
		});
		
		$toolDiv.append($exportData);
	};
	
	
	
	
};