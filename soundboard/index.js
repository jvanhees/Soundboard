let sounds = require("./src/sounds.js");
let Server = require('./src/server.js');

Server.setup();

document.getElementById("joinRoomButton").addEventListener("click", Server.joinRoom.bind(Server));
Server.roomIdField = document.getElementById("roomIdField");
Server.roomCounter = document.getElementById("roomOccupants");

window.addEventListener("hashchange", Server.updateFromHash.bind(Server));

let container = document.getElementById("soundbuttons");


let play = function(sound){
  if (Server.connected && Server.roomId)
    Server.play(sound);
  Server.playSound(sound);
}

let timeouts = {};

Server.playSound = function(sound){
  let a = new Audio('sounds/' + sound.file);
  a.addEventListener('loadedmetadata', function() {
    a.currentTime = 0;
    a.playbackRate = 1;
    a.play(); 

    if (timeouts[sound.file]) {
      clearTimeout(timeouts[sound.file]);
    } else {
      let element = container.querySelector("[data-filename='" + sound.file + "']");
      if (element){
        element.className += " active bump";
        setTimeout(function(){
          element.className = element.className.replace(/ bump/g, "");
        }, 200);
      }
    }

    timeouts[sound.file] = setTimeout(function(){
      soundFinished(sound.file);
    }, a.duration * 1000);

  });
  

}

let soundFinished = function(file){

  let element = container.querySelector("[data-filename='" + file + "']");
  if (element){
    element.className = element.className.replace(/ active/g,"");
  }
  delete timeouts[file];
}

let newButton = function(sound){
  let btnContainer = document.createElement("div");
  btnContainer.className = "soundRow";
  btnContainer.dataset.filename = sound.file;
  let btn = document.createElement("div");
  btn.appendChild(document.createTextNode(sound.name));
  btn.className = "soundButton";
  btn.addEventListener("click", function(){
    play(sound);
  });
  btnContainer.appendChild(btn);

  if(typeof sound.source != 'undefined'){
    let sourceLink = document.createElement("a");
    sourceLink.appendChild(document.createTextNode("youtube"));
    sourceLink.href = sound.source;
    sourceLink.target = "_blank";
    sourceLink.className = "soundSource";
    btnContainer.appendChild(sourceLink);
  }

  return btnContainer;
}

let generalSounds = sounds.general;
console.log(generalSounds);
for (let i in generalSounds){
  container.appendChild(newButton(generalSounds[i]));
}

