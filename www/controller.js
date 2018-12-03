


var Controller = function() {

	function Controller() {

	 	this.worker = new Worker("lc0.js");

		var cfg = {
		  showNotation: true,
		  position: 'start'
		};

		this.board = ChessBoard('board', cfg);
        $('#flipBtn').on('click', this.board.flip);
        $('#goBtn').on('click', this.go.bind(this));
        $('#stopBtn').on('click', this.stop.bind(this));

    	this.output=document.getElementById('output');
		this.worker.onmessage=this.receive.bind(this);
	}

	Controller.prototype={

		go() {
			this.worker.postMessage("go infinite");
		},

		stop() {
			this.worker.postMessage("stop");
		},

		receive(e) {
        	output.value += e.data + "\n";
        	output.scrollTop = output.scrollHeight;
		}

	};

	return Controller;

}();

new Controller();


