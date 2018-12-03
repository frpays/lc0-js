


var Controller = function() {

	function Controller() {
		var cfg = {
		  showNotation: true,
		  position: 'start'
		};

		this.board = ChessBoard('board', cfg);
        $('#flipBtn').on('click', this.board.flip);
        $('#goBtn').on('click', this.go.bind(this));
        $('#stopBtn').on('click', this.stop.bind(this));
		this.looping=false;
		this.updateButtons();
	}

	Controller.prototype={

		initialize() {
	 		this.engine = new Module.Engine();
		},

		loop() {
			if (!this.looping)
				return;
			if (!this.engine.CanStep()) {
				this.looping=false;
				this.updateButtons();
				return;
			}
			this.engine.Step();
			setTimeout(this.loop.bind(this), 0);
		},


		go() {
			if (this.looping)
				return;
			this.looping=true;
			this.updateButtons();
			this.engine.Send("go infinite");
			setTimeout(this.loop.bind(this), 0);
		},

		stop() {
			if (!this.looping)
				return;
			this.engine.Send("stop");
			this.looping=false;
		},

		updateButtons() { }

	};

	return Controller;

}();


