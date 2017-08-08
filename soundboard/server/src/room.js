var uuid = require('node-uuid');

var path = require('path');
var fs = require('fs');

var Sounds = require('../../src/sounds.js');

var spamTimeout = 120;
var maxSounds = 2;

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

	play: function(sound, sourceClient){
		var address = sourceClient.connection._socket.remoteAddress;

		var now = new Date();
		var allowedDate = now.getTime() - (spamTimeout * 1000);
		
		if (sourceClient.soundsPlayed >= maxSounds && sourceClient.lastPlayed > allowedDate) {
			// Not allowed to play a sound
			var remaining = Math.round((sourceClient.lastPlayed - allowedDate) / 1000);
			console.log('You can only send ' + maxSounds + ' sounds every ' + (spamTimeout / 60) + ' minutes. (' + formatTime(remaining) + ')');
			return;
		} else if (sourceClient.soundsPlayed >= maxSounds) {
			// Max sounds played, but longer than spamTimeout ago...
			sourceClient.soundsPlayed = 0;
		}

		sourceClient.soundsPlayed++;
		sourceClient.lastPlayed = now.getTime();

		console.log("playing ", sound.name, "in room", this.uuid);
		var soundFile = path.resolve(this.soundsFolder, sound.file);

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
