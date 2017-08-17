let sounds = require("./src/sounds.js");
let Server = require('./src/server.js');

Server.setup();

document.getElementById("joinRoomButton").addEventListener("click", Server.joinRoom.bind(Server));
Server.roomIdField = document.getElementById("roomIdField");
Server.roomCounter = document.getElementById("roomOccupants");

window.addEventListener("hashchange", Server.updateFromHash.bind(Server));

let container = document.getElementById("soundbuttons");
let buttonColor = 'grey';
let buttonRegex = new RegExp(buttonColor, "g");

let play = function(sound, category){
	if (Server.connected && Server.roomId)
		Server.play(sound, category);
	Server.playSound(sound, category);
}

let timeouts = {};

Server.playSound = function(sound, category){
	var soundFile = category + '/' + sound.file;
	let a = new Audio('sounds/' + soundFile);
	a.addEventListener('loadedmetadata', function() {
		a.currentTime = 0;
		a.playbackRate = 1;
		a.play(); 

		if (timeouts[soundFile]) {
			clearTimeout(timeouts[soundFile]);
		} else {
			let element = container.querySelector("[data-filename='" + soundFile + "']");
			if (element){
				element.className = element.className.replace(buttonRegex, "orange darken-4");
				setTimeout(function(){
					element.className = element.className.replace(/orange darken\-4/g, "orange darken-4");
				}, 200);
			}
		}

		timeouts[soundFile] = setTimeout(function(){
			soundFinished(soundFile);
		}, a.duration * 1000);

	});
	

}

let soundFinished = function(file){

	let element = container.querySelector("[data-filename='" + file + "']");
	if (element){
		element.className = element.className.replace(/orange darken\-4/g, buttonColor);
	}
	delete timeouts[file];
}

let newButton = function(sound, category){
	console.log(category);

	let btnContainer = document.createElement("div");
	btnContainer.className = buttonColor + " sound-button waves-effect waves-light btn-large";
	btnContainer.dataset.filename = category + '/' + sound.file;

	let btn = document.createElement("div");
	btn.appendChild(document.createTextNode(sound.name));
	btn.className = "soundButton";
	btn.addEventListener("click", function(){
		play(sound, category);
	});
	btnContainer.appendChild(btn);

	return btnContainer;
}

let newCategory = function(category) {
	let catContainer = document.createElement("div");
	catContainer.className = category;

	let title = document.createElement("h2");
	title.appendChild(document.createTextNode(category));

	catContainer.appendChild(title);
	return catContainer;
}

let toggleFullscreen = function(){
	if ((document.fullScreenElement && document.fullScreenElement !== null) ||    
	 (!document.mozFullScreen && !document.webkitIsFullScreen)) {
		if (document.documentElement.requestFullScreen) {  
			document.documentElement.requestFullScreen();  
		} else if (document.documentElement.mozRequestFullScreen) {  
			document.documentElement.mozRequestFullScreen();  
		} else if (document.documentElement.webkitRequestFullScreen) {  
			document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);  
		}  
	} else {  
		if (document.cancelFullScreen) {  
			document.cancelFullScreen();  
		} else if (document.mozCancelFullScreen) {  
			document.mozCancelFullScreen();  
		} else if (document.webkitCancelFullScreen) {  
			document.webkitCancelFullScreen();  
		}  
	} 
}
document.getElementById("fullscreenButton").addEventListener("click", toggleFullscreen);

var categories = {};
for (var category in sounds) {

	categoryContainer = newCategory(category);

	for (let i in sounds[category]){
		categoryContainer.appendChild(newButton(sounds[category][i], category));
	}

	container.appendChild(categoryContainer);
}

