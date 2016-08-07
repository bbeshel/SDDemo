/*
/*
 * CanvasHandlerToolbar.js
 * Author: Ben Beshel, Graison Day
 * Handler for adding the toolbar that is used to interact with the CanvasHandler
*/


var CanvasHandlerToolbar = function (parentContext, parserContext) {
	
	//Context for the parent, used for using its functions from here explicitly
	var chandlerParent = parentContext;
	
	//Context for the parser JSONparser, used the same way as above
	var parser = parserContext;
	
	//My own context
	var self = this;
	
	//Option that allows the user to view details about the JSON objects that are created.
	//Currently unused; used for debug
	self.OPTIONS = {
		jsonView : false
	};
	
	//Keeps track of the current "mode".
	self.MODE = "";
	
	//List of all annotation items.
	var annoItemList = [];
		
	//Displays JSON objects.
	var $jsonDisplay = $("<textarea readonly id='jsonToolbarDisplay' class='toolbarItem'></textarea>");
	
	//Lists all JSON items.
	var jsonItemString = "<textarea readonly class='toolbarAnnoItem permanent'></textarea>";
	
	//Tracks previous MODE defined in CanvasHandler
	var prevMode = "";	
	
	//Current MODE defined in CanvasHandler
	self.MODE = "";
	
	//List of jQuery clickable items put in $jsonDisplayContainer
	var annoItemList = [];
		
	//String for the HTML5 textarea that an annotations data goes in	
	var jsonItemString = "<textarea readonly class='toolbarAnnoItem permanent'></textarea>";
	
	//container to hold JSON in debug, or annotations in normal run mode
	var $jsonContainer = $("<div class='toolbarItem permanent' id='jsonDisplayContainer'></div>");
	
	//Div for all elements for the "tools" the user will be using and seeing to help them create annotations.
	var $toolDiv = $("<div id='toolContainer'></div>");
	
	//Div for all buttons that change the "mode" of the canvas, which allow the user to interact with the canvas in different ways.
	var $modeDiv = $("<div class='permanent annoCharsBoxContainer toolbarItem'></div>");
	
	//Button that allows the user to create polygonal shaped annotations.
	var $polyButton = $("<button class = 'permanent buttonItem modeButton' style='padding: 1px 39px';><img src = 'ic_star_border_black_24px.svg'/></button>");
	
	//Button that allows the user to create rectalinear shaped annotations.
	var $rectButton = $("<button class ='permanent buttonItem modeButton' style='padding: 1px 39px';><img src='ic_check_box_outline_blank_black_24px.svg'/></button>");
	
	//Button that allows the user to create circular shaped annotations (currently not functional).
	//var $circButton = $("<button class = 'permanent modeButton' style='padding: 1px 6px';><img src='ic_radio_button_unchecked_black_24px.svg'/></button>");
	
	//Button that allows the user to edit previously created annotations.
	var $editButton = $("<button class = 'permanent buttonItem modeButton' style='padding: 1px 39px';><img src = 'ic_create_black_24px.svg'/></button>");
	
	//Button that allows the user to write comments on a previously created annotation (currently not functional).
	//var $annoButton = $("<button class = 'permanent modeButton' style='padding: 1px 6px';><img src = 'ic_message_black_24px.svg'/></button>");
	
	//Button that allows the user to undo a previously placed path for an annotation. (for future use)
	//var $newUndoButton = $ ("<button class = 'permanent modeButton' style='padding: 1px 6px';><img src = 'ic_restore_page_black_24px.svg'/></button>");
	
	//Image that displays the current save state of the canvas. 
	//A check indicates the canvas has been saved to the server. 
	//An "X" indicates there are changes that have not been saved to the server.
	var $saveStatusImage = $("<div id='saveStatusImage' class = 'permanent toolbarItem'>Save Status:<img src = 'ic_done_black_24px.svg'/></div>");
	
	//Slider that controls the "snap zone", the minimal area a path must end at for 
	//the path to automatically "snap" to the beginning of the pathing of the annotation.
	var $snapZoneSliderContainer = $("<span class='toolbarAnnoTextItem'></span>");
	var $snapZoneSlider = $("<input id='snapZoneSlider' class='sliders permanent' type='range' min='1' max='26' step='5' value='10'/>");	
	var $snapZoneLabel = $("<p class = 'permanent toolbarAnnoTextItem' style='text-align:center;'>Snap Zone</p>");
	
	//Slider that controls the width of the path of an annotation when it is being created.
	var $lineWidthSliderContainer = $("<span class='toolbarAnnoTextItem'></span>");
	var $lineWidthSlider = $("<input id= 'lineWidthSlider' class='sliders permanent' type = 'range' min='1' max='8' step='1' value='1'/>");
	var $lineWidthLabel = $("<p class = 'permanent toolbarAnnoTextItem' style='text-align:center;'>Line Width</p>");
	

	//Buttons that control the color of the path of an annotation when it is being created.
	var $lineColorDiv = $("<div ></div>");
	var $lineColorLabel = $("<p class =    'permanent' style = 'text-align:center;'>Line Colors</p>");
	var $redLineColorButton = $("<button class =    'toolbarColorItem permanent' style= 'padding: 2px 9px';>Red</button>");
	var $yellowLineColorButton = $("<button class = 'toolbarColorItem permanent' style= 'padding: 2px 9px';>Yellow</button>");
	var $greenLineColorButton = $("<button  class = 'toolbarColorItem permanent' style= 'padding: 2px 9px';>Green</button>");
	var $blueLineColorButton = $("<button   class = 'toolbarColorItem permanent' style= 'padding: 2px 9px';>Blue</button>");
	var $whiteLineColorButton = $("<button  class = 'toolbarColorItem permanent whiteColorButton' style= 'padding: 2px 9px';>White</button>");
	var $blackLineColorButton = $("<button  class = 'toolbarColorItem permanent blackColorButton' style= 'padding: 2px 9px';>Black</button>");
	var lineColorButtonList = [$redLineColorButton, $yellowLineColorButton, $greenLineColorButton, $blueLineColorButton, $whiteLineColorButton, $blackLineColorButton];

	//Buttons that control the color of the path that displays where the path of an annotation will be placed if the user clicks their mouse.
	var $indicatorColorDiv = $("<div ></div>");
	var $indicatorColorLabel = $("<p class =        ' permanent' style = 'text-align:center;'>Indicator Colors</p>");
	var $redIndicatorButton = $("<button class =    'toolbarColorItem permanent' style= 'padding: 2px 9px';>Red</button>");
	var $yellowIndicatorButton = $("<button class = 'toolbarColorItem permanent' style= 'padding: 2px 9px';>Yellow</button>");
	var $greenIndicatorButton = $("<button  class = 'toolbarColorItem permanent' style= 'padding: 2px 9px';>Green</button>");
	var $blueIndicatorButton = $("<button   class = 'toolbarColorItem permanent' style= 'padding: 2px 9px';>Blue</button>");
	var $whiteIndicatorButton = $("<button  class = 'toolbarColorItem permanent whiteColorButton' style= 'padding: 2px 9px';>White</button>");
	var $blackIndicatorButton = $("<button  class = 'toolbarColorItem permanent blackColorButton' style= 'padding: 2px 9px';>Black</button>");
	var indicatorButtonList = [$redIndicatorButton, $yellowIndicatorButton, $greenIndicatorButton, $blueIndicatorButton, $whiteIndicatorButton, $blackIndicatorButton];
	
		
	
	//Button that saves changes made to an annotation in "edit mode". Disabled in "POLY" and "RECT" modes, and thus is disabled from the start.
	var $saveEditChanges = $("<button id='saveEditChanges' class='buttonItem permanent' class = 'annoButtons' class = 'disabled'>Save Edit Changes</button>");
	$saveEditChanges.addClass("disabled");
	
	//Button that sends the canvas, along with any annotations within, as a JSON object to the server for storing.
	var $exportData = $("<button id='exportData' class='permanent toolbarItem'>Export as JSON</button>");
	
	//Checkbox which controls whether or not to put the program in debug mode.
	var $debugViewCheckbox = $('<input id="debugViewCheckbox" class="toolbarItem permanent" type="checkbox" name="Debug View" />');
	
	//Displays the ID of the current canvas.
	var $canvasIdExpose = $('<textarea readonly class="toolbarItem permanent">!No ID!</textarea>');
	
	//This div pops up and appears to block user interaction during save
	var $saveModal = $("<div id='saveModal' class='modal'><div class='modal-content'><p>Saving...</p></div></div>");
	
	//Button that allows the user to delete a selected annotation.
	var $deleteAnnoButton = $("<button id='deleteAnnoButton' class='buttonItem permanent' class = 'annoButtons' class = 'disabled'>Delete selected annotation</button>");
	$deleteAnnoButton.addClass("disabled");
	
	//Button that allows the user to cycle through previously created annotations.
	var $cycleAnnoButton = $("<button id='cycleAnnoButton' class='buttonItem permanent' class = 'annoButtons' class = 'disabled'>Select next annotation</button>");
	$cycleAnnoButton.addClass("disabled");
	
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
		/*for (var n in chandlerParent.MODES) {
			var $op = $(
				"<option value='" + chandlerParent.MODES[n] + "'>" 
				+ chandlerParent.MODE_NAMES[n] + "</option>"
			);
		}*/
		prevMode = self.MODE;
		
		$("body").append($saveModal);
		
		//Adds the toolDiv to the canvas, then begins to add the various tools the toolDiv requires to the toolDiv.
		$parent.append($toolDiv);
		$toolDiv.append($saveStatusImage);
		//Darkens the poly button to indicate to the user they are currently on this mode.
		$polyButton.addClass("modeButtonPressed");
		$modeDiv.append($polyButton);
		$modeDiv.append($rectButton);
		$modeDiv.append($editButton);
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
			$lineColorDiv.append(lineColorButtonList[n]);
		}
		$toolDiv.append($lineColorDiv);
		
		$toolDiv.append($indicatorColorLabel);
		for (n in indicatorButtonList){
			$indicatorColorDiv.append(indicatorButtonList[n]);
		}
		$toolDiv.append($indicatorColorDiv);
		
		$debugViewCheckbox.prop('checked', true);
		$toolDiv.append($jsonContainer);
		$toolDiv.append($canvIdLabel);
		$toolDiv.append($canvasIdExpose);
		
		//Mode button iteractions. Each button will change the mode of the toolbar, 
		//displaying this by undarkening the previous mode button and darkening the current one.
		$polyButton.on("click", function(){
			$modeDiv.children().removeClass("modeButtonPressed");
			$polyButton.addClass("modeButtonPressed");
			$saveEditChanges.addClass("disabled");
			$deleteAnnoButton.addClass("disabled");
			$cycleAnnoButton.addClass("disabled");
			changeCanvasMode("POLY");
		});
		
		$rectButton.on("click", function(){
			$modeDiv.children().removeClass("modeButtonPressed");
			$rectButton.addClass("modeButtonPressed");
			$saveEditChanges.addClass("disabled");
			$deleteAnnoButton.addClass("disabled");
			$cycleAnnoButton.addClass("disabled");
			changeCanvasMode("RECT");
		});
		
		$editButton.on("click", function(){
			$modeDiv.children().removeClass("modeButtonPressed");
			$editButton.addClass("modeButtonPressed");
			$annoButtonDiv.children().removeClass("disabled");
			changeCanvasMode("EDIT");
		});
		
		//Snap zone interaction. Increases the snap zone going to the right, decreases the snap zone going to the left.
		$snapZoneSlider.on("change", function () {
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
			generateJSONDisplay();
		});


		//Annotation Highlight interaction. Responds to a call to highlight an annotation item.
		$(document).on("toolbar_annoItemHighlight", function (e, annoIndex) {
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
		
		
		//Removes the modal on the end of save
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
		$jsonContainer.empty();
		annoItemList = [];
		var div;
		//Takes the paths of the completed annotation.
		var annos = chandlerParent.getCompletedPaths();
		if (self.OPTIONS.jsonView) {
			//Debug mode is on,  display attributes of the JSON objects.
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].JSON != null) {
					div = $(jsonItemString);
					var x = annos[i].JSON;
					//Make the text safe to put in html
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
			//Allows the user to view comment attributes of the annotations
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].JSON != null) {
					div = $(jsonItemString);
					var x = annos[i].JSON;
					//Make the text safe to put in html
					x = x.replace(/\\"/g, '"');
					//Get an object with text that came from annotation, if any
					var comments = parser.getAssociatedAnnoText(annos[i].JSON);
					
					//Create the string with the comments
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
					//Helps keep track of the comments on the annotation for events
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
		//Debug mode is on, JSON objects will be displayed.
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].JSON != null && annos[i].needsUpdate) {
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
			//Update any annotations in toolbar that need update
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].JSON != null && annos[i].needsUpdate) {
					div = $(jsonItemString);
					var x = annos[i].JSON;
					//Make string safe for html
					x = x.replace(/\\"/g, '"');
					//Was there any new text to display?
					if (annos[i].hasNewText()) {
						var comments = { 
							"label" : annos[i]["label"],
							"chars" : annos[i]["chars"],
							"cnt:chars" : annos[i]["cnt:chars"]
						};
					//No, so get it from the raw JSON
					} else {
						var comments = parser.getAssociatedAnnoText(annos[i].JSON);
					}
					
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
					//The completedPaths item was already appended here, so update the div
					if (i < annoItemList.length) {
						annoItemList[i].editable = comments;
						annoItemList[i].path = annos[i];
						annoItemList[i].html(hts);
					//The completedPaths item needs to be added
					} else {
						annoItemList.push(div);
						$jsonContainer.append(div);
					}
				}
			}
			//Now remove any annotations in the toolbar that got deleted already
			for (var i = 0; i < annos.length; i++) {
				if (annos[i].markedForDelete) {
					annoItemList[i].remove();
					annoItemList.splice(i, 1);
				}
			}
		}
		//Reset all the handler events for all annotation items in toolbar
		//Needed to do this because events somehow kept getting lost on some divs.
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
	
	
	//Changes the "mode" of the canvas.
	var changeCanvasMode = function (mode) {
		$(document).trigger("toolbar_changeOperationMode", [self.MODE]);
		self.MODE = mode;
		$(document).trigger("handler_canvasIntClear");
	};
	
	
	//Changes the saveStatusImage, if the current saveStatus obtained from the canvasHandler does not match up with the current image.
	var changeSaveStatus = function(unsavedChange) {
		if (!unsavedChange){
			saveStatusImage = $("<div id='saveStatusImage' class = 'permanent toolbarItem'>Save Status:<img src = 'ic_done_black_24px.svg'/></div>");
		}
		else{
			saveStatusImage = $("<div id='saveStatusImage' class = 'permanent toolbarItem' style='background-color: #f44336;'>Save Status:<img src = 'ic_close_black_24px.svg'/></div>");
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
				//If there are characters, add some.
				isChars = true;
				var $textBoxLabel = $("<span class='toolbarAnnoTextItem'>" + n + ": </span>");
				var $textBox = $("<textarea class='annoTextArea'>" + div.editable[n] + "</textarea>");
				//When clicking off the textarea, we update the text to the completedPaths
				$textBox.on("focusout", function () {
					$(document).trigger("toolbar_annoItemCharsUpdate", [div.path, n, $textBox.val()]);
					updateJSONDisplay();
				});
				$labelDiv.append($textBoxLabel);
				$textDiv.append($textBox);
				
			} else {
				//Add a dummy text area to indicate this prop in the annotation doesnt exist
				var $textBoxLabel = $("<span class='toolbarAnnoTextItem'>" + n + ": </span>");
				var $textBox = $("<textarea readonly placeholder='NO LABEL: CANNOT EDIT' class='annoTextArea'></textarea>");
				$labelDiv.append($textBoxLabel);
				$textDiv.append($textBox);
			}
		}
		$textDivContainer.append($labelDiv);
		$textDivContainer.append($textDiv);
		$toolDiv.append($textDivContainer);
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
	};
	
	//Adds the export button if we have a dummy canvas to save (this is experimental)
	self.setDummyState = function () {
		$exportData.on("click", function () {
			$(document).trigger("handler_exportAllDataJSON");
			$saveModal.addClass("modal-active");
			$(document).trigger("handler_preventUserInteraction");
		});
		
		$toolDiv.append($exportData);
	};
	
	
	
	
};