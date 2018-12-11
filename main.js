/*
 This file is part of Leela Chess Zero.
 Copyright (C) 2018 The LCZero Authors

 Leela Chess is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 Leela Chess is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with Leela Chess.  If not, see <http://www.gnu.org/licenses/>.
 */


/*
* This code to make tensorflow work into a web worker.
# Work in Chrome 71 as o writting (fpays).
*
* from https://github.com/tensorflow/tfjs/issues/102
*
*/

if (typeof OffscreenCanvas !== 'undefined') {
    self.document = {
        createElement: function () {
            return new OffscreenCanvas(640, 480);
        }
    };
    self.window = {
        screen: {
            width: 640,
            height: 480
        }
    }
    self.HTMLVideoElement = function() {}
    self.HTMLImageElement = function() {}
    self.HTMLCanvasElement = function() {}
}

importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@0.13.3/dist/tf.min.js");

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


var Network = function() {

	function Network() {
		this.log("Started");
		this.input_channels=112;
		this.num_output_policy=1858;
		// discover the rest
		this.block=0; // typically 20
		this.channels=0; // typically 256
		this.num_value_input_planes=0; // 32
		this.num_policy_input_planes=0; // 32
		this.num_value_channels=0; // 128
	}

	Network.prototype={


		load: function() {
			this.loadFile("weights.txt", this.loaded.bind(this));
    	},

		loadTest: function() {
			this.loadFile("test.txt", this.test_loaded.bind(this));
    	},

		loadFile: function(file, on_load) {
			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
   			if (this.readyState == 4 && this.status == 200) {
				on_load(this.responseText);
			}};
  			xhttp.open("GET", file);
			xhttp.send();
		},

		loaded: function(allText) {
			var lines = allText.split(/\r\n|\n/);
			var len=lines.length;
			this.log("network has  "+len+" lines");
			// LINES = 1  + 4 + 8 * BLOCKS + 6 + 8 
			// LINES = 19 + 8 * BLOCKS
			if (lines<19)
				throw "Bad network file";
			var index=0;
			if (lines[index++] != "2")
				throw "Bad network file";
			this.blocks=(len-19)/8;
			this.log("Network blocks: "+this.blocks);
			if (len != 19+8*this.blocks)
				throw "Bad network file";
			this.data={};
			this.data.input=this.readConv(lines, index, 3);
			index+=4; // first conv3x3
			this.filters=this.data.input.biases.length;
			this.log("Network filters: "+this.filters);
			this.data.tower=new Array(this.blocks);
			for (block=0; block<this.blocks; block++) {
				var conv1=this.readConv(lines, index, 3);
				index+=4;
				var conv2=this.readConv(lines, index, 3);
				index+=4;
				this.data.tower[block]={
					conv1: conv1,
					conv2: conv2,
				};
			}

			// Policy head
			var policy_conv1=this.readConv(lines, index, 1);
			index+=4;
			this.num_policy_input_planes=policy_conv1.weights.length/this.filters;
			this.log("Network num_policy_input_planes: "+this.num_policy_input_planes);
			this.policy_fc=this.readFC(lines, index);
			index+=2;
			this.data.policy_head={
				conv1 : policy_conv1,
				fc : this.policy_fc,
			};

			// Value head
			var value_conv1=this.readConv(lines, index, 1);
			index+=4;
			this.num_value_input_planes=value_conv1.weights.length/this.filters;
			this.log("Network num_value_input_planes: "+this.num_value_input_planes);
			this.value_fc1=this.readFC(lines, index);
			index+=2;
			this.num_value_channels=this.value_fc1.biases.length;
			this.log("Network num_value_channels: "+this.num_value_channels);
			this.value_fc2=this.readFC(lines, index);
			index+=2;
			this.data.value_head={
				conv1 : value_conv1,
				fc1 : this.value_fc1,
				fc2 : this.value_fc2,
			};

			this.build();

		},


		readConv: function(lines, index, filtersize) {
			var conv={};
			conv.filtersize=filtersize;
			conv.weights=lines[index++].split(" ");
			conv.biases=lines[index++].split(" ");
			conv.bn_means=lines[index++].split(" ");
			conv.bn_stddivs=lines[index++].split(" ");
			conv.outputs=conv.biases.length;
			conv.inputs=conv.weights.length/(filtersize*filtersize*conv.outputs);
			return conv;
		},


		readFC: function(lines, index) {
			var fc={};
			fc.weights=lines[index++].split(" ");
			fc.biases=lines[index++].split(" ");
			fc.outputs=fc.biases.length;
			fc.inputs=fc.weights.length/fc.outputs;
			return fc;
		},


		loadFCWeights: function(fc) {
			var weights=fc.weights;
			var inputs=fc.inputs;
			var outputs=fc.outputs;
			var biases=fc.biases;
			var size=inputs*outputs;
			var warray=new Float32Array(size);
			var index=0;
			for (var input=0; input<inputs; input++) {
				for (var output=0; output<outputs; output++) {
					warray[index++]=weights[input+inputs*output];
				}
			}
			var tw=tf.tensor2d(warray, [fc.inputs, fc.outputs]);
			var tb=tf.tensor1d(new Float32Array(biases));
			return [ tw, tb ];
		},


		createDenseLayer: function(fc, activation) {
			return tf.layers.dense({
				units: fc.outputs,
				weights: this.loadFCWeights(fc),
				activation: activation,
				useBias: true,
			});
		},


		loadConvWeights: function(conv) {

			var weights=conv.weights;
			var inputs=conv.inputs;
			var outputs=conv.outputs;
			var biases=conv.biases;
			var filtersize=conv.filtersize;
			var filterarea=filtersize*filtersize;
			var size=filterarea*inputs*outputs;
			var warray=new Float32Array(size);
			var index=0;
			for (var filter=0; filter<filterarea; filter++) {
				for (var input=0; input<inputs; input++) {
					for (var output=0; output<outputs; output++) {
						warray[index++]=weights[filter+filterarea*(input+inputs*output)];
					}
				}
			}
			var tw=tf.tensor4d(warray, [filtersize, filtersize, inputs, outputs]);
			var tb=tf.tensor1d(new Float32Array(biases));
			return [ tw , tb ];
		},

		applyConvolution: function(flow, conv, skip) {

			var conv_layer = tf.layers.conv2d({
				dataFormat: 'channelsFirst',
				kernelSize: [conv.filtersize, conv.filtersize],
				weights: this.loadConvWeights(conv),
				padding: 'same',
				filters: conv.outputs,
				useBias: true,
			});
			flow=conv_layer.apply(flow);

			var tm=tf.tensor1d(new Float32Array(conv.bn_means));
			var ts=tf.tensor1d(new Float32Array(conv.bn_stddivs));
			var bn_layer = tf.layers.batchNormalization({
				axis: 1,
				epsilon: 1e-5,
				scale: false,
				center: false,
				weights: [ tm, ts]
			});
			flow=bn_layer.apply(flow);

			if (skip) {

				var add_layer=tf.layers.add();
				flow = add_layer.apply([flow, skip]);	
			}

			relu=tf.layers.reLU();
			flow =  relu.apply(flow);

			return flow;
		},


		build: function() {

			this.log("Building network...");
			this.input = tf.input({
//				shape: [112, 8, 8],
				batchShape: [ null, 112, 8, 8 ],
			});
			
			var flow=this.input;
			flow = this.applyConvolution(flow, this.data.input);

			for (var block=0; block<this.blocks; block++) {
				var skip=flow;
				var res=this.data.tower[block];
				flow=this.applyConvolution(flow, res.conv1);
				flow=this.applyConvolution(flow, res.conv2, skip);
			}

			// Policy head
			var policy_head=this.data.policy_head;
			var p_flow=this.applyConvolution(flow, policy_head.conv1);

			layer = tf.layers.flatten();
			p_flow=layer.apply(p_flow);

			layer=this.createDenseLayer(policy_head.fc, "softmax");
			p_flow=layer.apply(p_flow);

			// Value head
			var value_head=this.data.value_head;
			var v_flow=this.applyConvolution(flow, value_head.conv1);

			layer = tf.layers.flatten();
			v_flow=layer.apply(v_flow);

			layer=this.createDenseLayer(value_head.fc1);
			v_flow=layer.apply(v_flow);

			layer=this.createDenseLayer(value_head.fc2);
			v_flow=layer.apply(v_flow);

			this.model = tf.model({
				inputs: this.input,
				outputs: [ p_flow, v_flow ]
			});
			this.log("Done!");

//			this.loadTest();
		},

		test_loaded: function(allText) {

			var lines = allText.split(/\r\n|\n/);
			var line1=lines[0].split(" ");
			var line2=lines[1].split(" ");
			var line3=lines[2].split(" ");

			this.test_x=tf.tensor4d(new Float32Array(line1), [1, 112, 8, 8]);
			this.test_y=line2[0];
			this.test_z=tf.tensor1d(new Float32Array(line3));
			this.log("Loaded test data!");

			var predict=this.model.predict(this.test_x);
//			this.log("input: "+this.test_x);
			this.log("p: "+predict[0]);
			this.log("v: "+predict[1]);

		},


forward: function(batch_size, input, policy, value) {

	if (!this.model)
	return;

	var input_array = new Float32Array(Module.HEAPU8.buffer, input, 112*64*batch_size);
	var policy_array = new Float32Array(Module.HEAPU8.buffer, policy, 1858*batch_size);
	var value_array = new Float32Array(Module.HEAPU8.buffer, policy, batch_size);
	this.do_forward(batch_size, input_array, policy_array, value_array);
},


		do_forward: function(batch_size, input, policy, value) {

			var self=this;
			function work() {
				var x = tf.tensor4d(input, [batch_size, 112, 8, 8]);
				var predict=self.model.predict(x);
		
				var p_buffer=predict[0].buffer();
				var v_buffer=predict[1].buffer();
				var p_idx=0;
				for (var i=0; i<batch_size; i++) {
					for (var j=0; j<1858; j++) {
						policy[p_idx]=p_buffer.get(i, j);
						value[i]=v_buffer.get(i);
						p_idx++;
					}
				}
			};
			tf.tidy(work);
		},

		log: function(text) {
			self.console.log("network: "+text);
		}

	};

	return Network;

}();

