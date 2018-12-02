
var Controller = function() {

	function Controller() {
	 	this.engine = new Module.Engine();
	}

	Controller.prototype={

		run() {
			this.engine.Go();
			setTimeout(this.loop.bind(this), 0);
		},

		loop() {
			if (!this.engine.CanStep())
				return;
			this.engine.Step();
			setTimeout(this.loop.bind(this), 0);
		},

	};

	return Controller;

}();


