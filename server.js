// Dependencies
var express = require('express');
var http = require('http');
var path = require('path');
var socketIO = require('socket.io');
var random = require("random-js")();

var app = express();
var server = http.Server(app);
var io = socketIO(server);

var rooms = [ 'Study', 'Hall', 'Lounge', 'Library', 'Billiard Room', 'Dining Room', 'Convservatory', 'Ball Room', 'Kitchen' ]
var suspects = [ 'Colonel Mustard', 'Miss Scarvar', 'Professor Plum', 'Mr. Green', 'Mrs. White', 'Mrs. Peacock' ]
var weapons = [ 'Rope', 'Lead Pipe', 'Knife', 'Wrench', 'Candlestick', 'Revolver' ]
var availableCharacters = suspects.slice();
var availableLocations = rooms.slice();
var player
var playerCount = 0;
var who = '';
var what = '';
var where = ''
var Players = [];

"use strict";

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

// Routing
app.get('/', function(request, response) {
  response.sendFile(path.join(__dirname, 'index.html'));
});

// Starts the server.
server.listen(5000, function() {
  console.log('Starting server on port 5000');
});


class Player {
  constructor(socket, id) {
    this._socket = socket;
    this._id = id;
    playerCount++;
    this._name = getAvailableCharacter();
    this._location = getAvailableLocation();
    this._cards = [];
  }
  get name() {
    this._socket.to(this._id).emit('message', 'test message');
    return this._name;
  }
  get id() {
    return this._id;
  }
  get location() {
    return this._location;
  }
  set location(loc) {
    this._location = loc;
  }
  get cards() {
    return this._cards; 
  }
  addCard(newCard) {
    //console.log(this._name + ' has card ' + newCard + ' ' + this._id);
    this._cards.push(newCard);
    //this._socket.to(this._id).emit('card', newCard);
  }
  sayHello() {
    return ('Hello, my name is ' + this.name + ', I have ID: ' + this._id);
  }
}


var players = {};
// Add the WebSocket handlers
io.on('connection', function(socket) {
    socket.on('new player', function() {
        console.log(socket.id);
        var newPlayer = new Player(socket, socket.id);
        Players.push(newPlayer);

        players[socket.id] = {
            x: 300,
            y: 300
        };
        io.sockets.emit('message', createMsg(newPlayer.name + ' has entered the match in the ' + newPlayer.location + '. -- PlayerCount = ' + playerCount));
        io.sockets.emit('message', createMsg(newPlayer.sayHello()));

        if (playerCount == 3) {
            who = getSuspectCard();
            what = getWeaponCard();
            where = getRoomCard();

            io.sockets.emit('message', createMsg('Case File CONFIDENTIAL has been populated'));
            io.sockets.emit('message', createMsg('Who = ' + who));
            io.sockets.emit('message', createMsg('What = ' + what));
            io.sockets.emit('message', createMsg('Where = ' + where));

            io.sockets.emit('message', createMsg('Dealing remaining cards'));
            dealCards(function() {
                Players.forEach(function(player) {
                    io.sockets.to(player.id).emit('card', player.cards);
                    io.sockets.to(player.id).emit('card', 'just ' + player.name + ' cards');
                });
            });


        }
  });
  socket.on('movement', function(data) {
    var player = players[socket.id] || {};
    if (data.left) {
      player.x -= 5;
    }
    if (data.up) {
      player.y -= 5;
    }
    if (data.right) {
      player.x += 5;
    }
    if (data.down) {
      player.y += 5;
    }
  });
});

setInterval(function() {
  io.sockets.emit('state', players);
}, 1000 / 60);

function getDateTime() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return  month + "/" + day + "/" + year + " " + hour + ":" + min + ":" + sec;
}

function getRandomInt(max, callback) {
    return callback(random.integer(0, max));
}


function getSuspectCard() {
    index = random.integer(0, suspects.length -1);
    var who = suspects[index];
    suspects.splice(index, 1);
    return who;
}

function getWeaponCard() {
    index = random.integer(0, weapons.length -1);
    var what = weapons[index];
    weapons.splice(index, 1);
    return what;
}

function getRoomCard() {
    index = random.integer(0, rooms.length -1);
    var where = rooms[index];
    rooms.splice(index, 1);
    return where;
}

function getAvailableCharacter() {
    index = random.integer(0, availableCharacters.length -1);
    var chosenCharacter = availableCharacters[index];
    availableCharacters.splice(index, 1);
    return chosenCharacter;
}

function getAvailableLocation() {
    index = random.integer(0, availableLocations.length -1);
    var chosenLocation = availableLocations[index];
    availableLocations.splice(index, 1);
    return chosenLocation;
}

function createMsg(message) {
    return (getDateTime()  + ' -- ' + message);
}

function dealCards(callback) {
    var i = 0;
    while (suspects.length > 0) {
        //console.log(Players[i].name + ' getting a card');
        Players[i].addCard(getSuspectCard());
        if (i < playerCount -1) {
            i++;
        } else {
            i = 0;
        }
    }
    while (weapons.length > 0) {
        //console.log(Players[i].name + ' getting a card');
        Players[i].addCard(getWeaponCard());
        if (i < playerCount -1) {
            i++;
        } else {
            i = 0;
        }
    }
    while (rooms.length > 0) {
        //console.log(Players[i].name + ' getting a card');
        Players[i].addCard(getRoomCard());
        if (i < playerCount -1) {
            i++;
        } else {
            i = 0;
        }
    }
    callback();
}
