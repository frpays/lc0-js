
var engine=undefined;

function loop()
{
	if (engine.CanStep())
		engine.Step();
	setTimeout(loop, 100);
}

Module['onRuntimeInitialized'] = function() {
	engine=new Module.Engine();
	loop();
};

self.console = { 
	log: function(line) { postMessage(line); },
	warn: function(line) { postMessage("warn: "+line); },
	error: function(line) { postMessage("error: "+line); }
};


onmessage=function(e) {
	try {
		postMessage("send: "+e.data);
		if (engine) {
			engine.Send(e.data);
		}
	}
	catch (exc) {
		self.postMessage("EXCEPTION "+exc);
	}
};

