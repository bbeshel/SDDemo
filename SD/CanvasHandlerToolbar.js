

var CanvasHandlerToolbar = function () {
	
	var self = this;
	
	this.MODE = "POLY";
	
	var $toolSpan = $("<span class='toolSpan'></span>");
	
	var $buttonEdit = $("<button class='buttonEdit'>EDIT</button>");
	
	this.init = function ($parent) {
		$parent.append($toolSpan);
		
		$toolSpan.append($buttonEdit);
		
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