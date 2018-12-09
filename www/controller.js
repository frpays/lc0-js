


var Controller = function() {

	function Controller() {

	 	this.worker = new Worker("lc0.js");

		var cfg = {
		  draggable: true,
		  showNotation: true,
		  position: 'start',
		  onDragStart: this.onDragStart.bind(this),
		  onDrop: this.onDrop.bind(this),
		  onSnapEnd: this.onSnapEnd.bind(this)
		};

		this.board = ChessBoard('board', cfg);
        $('#startBtn').on('click', this.startpos.bind(this));
        $('#flipBtn').on('click', this.board.flip);
        $('#goBtn').on('click', this.go.bind(this));
        $('#stopBtn').on('click', this.stop.bind(this));

    	this.output=document.getElementById('output');
		this.worker.onmessage=this.receive.bind(this);

		this.game = new Chess();
	}

	Controller.prototype={


		startpos() {
			this.game.reset();
			this.board.start(true);
		},

		go() {
			var setup="position startpos";
			var history=this.game.history({ verbose: true });
			if (history.length>0) {
				setup+=" moves";
				for (var i=0; i<history.length; i++) {
					var move=history[i];
					var coord_move=move.from+move.to;
					if (move.promotion)
						coord_move+=move.promotion;
					setup+=" "+coord_move;
				}
			}
			this.worker.postMessage(setup);
			this.worker.postMessage("go infinite");
		},

		stop() {
			this.worker.postMessage("stop");
		},

		receive(e) {
        	output.value += e.data + "\n";
        	output.scrollTop = output.scrollHeight;
		},

		onDragStart(source, piece, position, orientation) {
			if (this.game.game_over() === true ||
				(this.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
				(this.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
			    return false;
  			}
		},

		onDrop(source, target) {
			// see if the move is legal
			var move = this.game.move({
				from: source,
				to: target,
				promotion: 'q' // NOTE: always promote to a queen for example simplicity
			});
  			// illegal move
			if (move === null) return 'snapback';
		},

		onSnapEnd() {
			this.board.position(this.game.fen());
		}

	};

	return Controller;

}();

new Controller();


