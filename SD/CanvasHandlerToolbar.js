

var CanvasHandlerToolbar = function (parentContext) {
	
	var chandlerParent = parentContext;
	
	var self = this;
	
	self.MODE = "";
	
	var $opModeSelector = $("<select id='opModeSelector'></select>");
	
	var $toolDiv = $("<div class='toolDiv'></div>");
	
	var $buttonEdit = $("<button class='buttonEdit'>EDIT</button>");
	
	
	
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
		
		$toolDiv.append($buttonEdit);
		$toolDiv.append($opModeSelector);
		
		$opModeSelector.on("change", function () {
			changeCanvasMode($opModeSelector.val());
		});
		
		$buttonEdit.on("click", function () {
			changeCanvasMode("EDIT");
		});
	};
	
	var changeCanvasMode = function (mode) {
		self.MODE = mode;
		$(document).trigger("canvasIntClear");
		console.log(self.MODE);
	};
	
};