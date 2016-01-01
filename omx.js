var spawn = require('child_process').spawn;
var events = require('events').EventEmitter;

function omxPlayer(options) {
	this.args = [];
	this.omxProcess = null;
	var that = this;

	events.EventEmitter.call(this);

	this.play = function(filename) {
		var foundDuration = false;
		var totalTime = 0;

		var newArgs = this.args.slice(0);
		newArgs.push("-I", "-s");
		newArgs.push(filename);

		this.omxProcess = spawn('omxplayer', newArgs, {stdio: ["pipe", "pipe", "pipe"]});

		this.omxProcess.once('exit', function() {
			this.omxProcess = null;
			that.emit('stop');
		});

		this.omxProcess.stdout.on('data', function(data) {
			var buffer = new Buffer(data);
			var re = /M:[\s]*(\d+)/gm;

			var result = re.exec(buffer.toString());
			if (result && totalTime>0 && result.length>0) {
				var last = result[result.length-1];
				var progress = parseInt(last)*100/totalTime;
				that.emit("progress", {'percent': progress, 'last':parseInt(last)/1000000, 'total': totalTime/1000000});//progress
			}

			// that.emit('stdout', data);
		});

		this.omxProcess.stderr.on('data', function(data){
			var buffer = new Buffer(data);
			var strings = buffer.toString();

			if (!foundDuration) {
				var re = /Duration:\s(\d\d:\d\d:\d\d.\d\d)/;
				var result = re.exec(strings);
				if (result) {
					foundDuration = true;
					var duration = result[1].toString();
					totalTime = ((parseInt(duration.substring(0,2)) * 3600 +
						parseInt(duration.slice(3,5)) * 60 +
						parseInt(duration.slice(6,8))) * 1000 + parseInt(duration.slice(9,11))) * 1000;

					// console.log("Total time is (%d) (%s)", totalTime, duration);
				}
			}
		});
	};

	this.stop = function() {
		sendAction('q');
	};

	this.pause = function() {
		sendAction('p');
	};

	this.volumeUp = function() {
		sendAction('+');
	};

	this.volumeDown = function() {
		sendAction('-');
	};

	if (!options)
		return;

	if (options.layer)
		this.args.push('--layer', options.layer);

	if (options.hardwareAudioDecoding)
		this.args.push('--hw');

	if (options.enable3D)
		this.args.push('-3');

	if (options.refresh)
		this.args.push('-r');

	if (options.startPosition)
		this.args.push('--pos', options.startPosition);

	if (options.win)
		this.args.push('--win', options.win);

	if (options.orientation)
		this.args.push('--orientation', options.orientation);

	if (options.alpha)
		this.args.push('--alpha', options.alpha);

	if (options.info)
		this.args.push('-i');

	if (options.audioOut)
		this.args.push('-o', options.audioOut);

	if (options.audioPassThrough)
		this.args.push('-p');

	function sendAction(action){
		if (that.omxProcess) {
			try {
				that.omxProcess.stdin.write(action, function(err){
					console.log(err);
				});
			} catch(exception){
				console.log(exception);
			}
		}
	}

}

omxPlayer.prototype.__proto__ = events.EventEmitter.prototype;

exports.create = function(options){
	return new omxPlayer(options);
};
