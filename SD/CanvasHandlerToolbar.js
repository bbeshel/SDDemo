

var CanvasHandlerToolbar = function (parentContext) {
	
	var chandlerParent = parentContext;
	
	var self = this;
	
	self.MODE = "";
	
	var $opModeSelector = $("<select id='opModeSelector' class='toolbarItem'></select>");
	
	var $toolDiv = $("<div id='toolContainer'></div>");
	
	var $buttonEdit = $("<button class='buttonEdit'>EDIT</button>");
	
	var $snapZoneSlider = $("<input id='snapZoneSlider' class='toolbarItem' type='range' min='1' max='26' step='5' value='10'/>");
	
	var $saveEditChanges = $("<button id='saveEditChanges' class='toolbarItem'>Save Changes</button>");
	
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
		$toolDiv.append($snapZoneSlider);
		$toolDiv.append($saveEditChanges);
		
		$opModeSelector.on("change", function () {
			changeCanvasMode($opModeSelector.val());
		});
		
		$snapZoneSlider.on("change", function () {
			chandlerParent.changeSnapZone($snapZoneSlider.val());
			var val = parseInt($snapZoneSlider.val());
			$(document).trigger("handler_changeSnapZone", [val]);
		});
		
		$saveEditChanges.on("click", function () {
			$(document).trigger("handler_saveEditChanges");
		});
		
		// $buttonEdit.on("click", function () {
			// changeCanvasMode("EDIT");
		// });
	};
	
	
	
	var changeCanvasMode = function (mode) {
		self.MODE = mode;
		$(document).trigger("handler_canvasIntClear");
		console.log(self.MODE);
	};
	
};