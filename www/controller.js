


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
				return;
			}
			this.engine.Step();
			setTimeout(this.loop.bind(this), 0);
		},


		go() {
			if (this.looping)
				return;
			this.looping=true;
			this.engine.Go();
			setTimeout(this.loop.bind(this), 0);
		},

		stop() {
			if (!this.looping)
				return;
			this.engine.Stop();
		}

	};

	return Controller;

}();


