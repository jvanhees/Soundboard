var uuid = require('node-uuid');

var path = require('path');
var fs = require('fs');

var mm = require('music-metadata');

var Sounds = require('../../src/sounds.js');

var spamTimeout = 120;
var maxSounds = 2;
var maxSeconds = 10;

function formatTime(value) {
    return Math.floor(value / 60) + ":" + (value % 60 ? value % 60 : '00');
}

function Room(client, roomId){
	this.clients = [];
	this.uuid = roomId ? roomId : String(uuid.v4());
	this.addClient(client);
	this.player = require('play-sound')(opts = {})
	this.soundsFolder = path.resolve(appRoot, '..', 'public', 'sounds');
}

Room.prototype = {

	play: function(sound, category, sourceClient){
		var address = sourceClient.connection._socket.remoteAddress;

		var now = new Date();
		var allowedDate = now.getTime() - (spamTimeout * 1000);
		
		if (sourceClient.soundsPlayed >= maxSounds && sourceClient.lastPlayed > allowedDate) {
			// Not allowed to play a sound
			var remaining = Math.round((sourceClient.lastPlayed - allowedDate) / 1000);
			var message = 'You can only send ' + maxSounds + ' sounds every ' + (spamTimeout / 60) + ' minutes. (' + formatTime(remaining) + ')';
			sourceClient.send(JSON.stringify({"command": "notify", "message": message}));
			return;

		} else if (sourceClient.secondsPlayed >= maxSeconds && sourceClient.lastPlayed > allowedDate) {
			var remaining = Math.round((sourceClient.lastPlayed - allowedDate) / 1000);
			var message = 'You can only send ' + maxSeconds + ' seconds of audio every ' + (spamTimeout / 60) + ' minutes. (' + formatTime(remaining) + ')';
			sourceClient.send(JSON.stringify({"command": "notify", "message": message}));
			return;

		}

		if (sourceClient.soundsPlayed >= maxSounds) {
			// Max sounds played, but longer than spamTimeout ago...
			sourceClient.soundsPlayed = 0;
		}

		if (sourceClient.secondsPlayed >= maxSeconds) {
			// Max seconds played, but longer than spamTimeout ago...
			sourceClient.secondsPlayed = 0;
		}

		sourceClient.soundsPlayed++;
		sourceClient.lastPlayed = now.getTime();

		console.log("playing ", sound.name, "in room", this.uuid);
		var soundFile = path.resolve(this.soundsFolder, category, sound.file);

		mm.parseFile(soundFile, { duration: true })
			.then(function (metadata) {
				sourceClient.secondsPlayed += metadata.format.duration;
				console.log(sourceClient.secondsPlayed);
			})
			.catch(function (err) {
				console.error(err);
			});

		if(this.uuid == 'server'){
			// Play file on the server
			if (fs.statSync(soundFile) && this.player){
				this.player.play(soundFile, function(err){
					if (err)
						console.log('Couldn\'t play file "' + soundFile + '"');
				});
			}
		}
		// Send command to clients to play sound
		this.clients.forEach(function(client){
			if (client.uuid != sourceClient.uuid)
				client.send(this.playSoundCommand(sound));
		}.bind(this));
	},

	playSoundCommand: function(sound){
		return JSON.stringify({"command": "play", "sound": sound});
	},

	addClient: function(client){
		this.clients.push(client);
		client.currentRoom = this;
	},

	removeClient: function(client){
		this.clients = this.clients.filter(function(c) { return c != client });
		client.currentRoom = undefined;
	}
};


module.exports = Room;
