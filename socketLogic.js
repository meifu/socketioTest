var io;
var gameSocket;

var roomNums = [], roomPool = {};
var roomObj = function(n, game_id) {
  this.numbers = n || 0;
  this.gameId = game_id || '';
  this.hostId = '';
  this.leftPerson = {name: '', uuid: '', point: 0};
  this.rightPerson = {name: '', uuid: '', point: 0};
  this.readyNumber = 0;
}

exports.initGame = function(sio, socket){
	io = sio;
  gameSocket = socket;
  gameSocket.emit('connected', { message: "You are connected!" });

  // Host Events
  gameSocket.on('hostCreateNewGame', hostCreateNewGame);

  // Player Events
  gameSocket.on('playerJoinGame', playerJoinGame);
  gameSocket.on('updateReady', updateReadyStatus);
}


/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */
function generateRoom(length) {
  var haystack = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var room = '';

  for (var i = 0; i < length; i++) {
    room += haystack.charAt(Math.floor(Math.random() * 62));
  }
  console.log('SERVER: room: ' + room);
  return room;
}


function hostCreateNewGame() {

  // Create a unique Socket.IO Room
  var thisGameId = generateRoom(6);

  // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
  this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});
  console.log('SERVER hostCreateNewGame: ' + thisGameId.toString());

  var nsp = io.of('/' + thisGameId);

  // Join the Room and wait for the players
  this.join(thisGameId.toString(), function(err){
    // console.log('hostCreateNewGame rooms: ' + gameSocket.rooms);
    console.log('hostCreateNewGame id: ' + gameSocket.id);
    
    roomNums.push(thisGameId.toString());
    roomPool[thisGameId] = new roomObj(0, thisGameId);
    roomPool[thisGameId].hostId = gameSocket.id;
    console.log('new room obj: ' + Object.keys(roomPool[thisGameId]));
  });
  
  
};

function updateReadyStatus(data) { //position, gameId
  if (roomPool[data.gameId]) {
    roomPool[data.gameId].readyNumber = roomPool[data.gameId].readyNumber + 1;
    io.sockets.in(data.gameId).emit('readyLightOn', {position: data.position/*, readyNumbers: roomPool[data.gameId].readyNumber*/});

    if (roomPool[data.gameId].readyNumber === 2) {
      io.sockets.in(data.gameId).emit('goInToTheGame', {});
    }
  } else {
    console.log('SERVER find no room');
  }
  
}

/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

function playerJoinGame(data) {
  console.log('Player ' + data.playerName + ' attempting to join game: ' + data.gameId );

  // A reference to the player's Socket.IO socket object
  var sock = this;

  // Look up the room ID in the Socket.IO manager object.
  var room = roomPool[data.gameId];
  // console.log('room: ' + Object.keys(roomPool));
  console.log('test socket id ' + sock.id);

  // If the room exists...
  if (room) {
    
    console.log('room exist');

    room.numbers += 1;
    data.numbersInRoom = room.numbers;

    if (room.numbers <= 2) {

      // Join the room
      sock.join(data.gameId);

      //tell host screen to update numbers
      var host_id = roomPool[data.gameId].hostId;
      
      console.log('connected socket: ' + io.sockets.connected[sock.id]);

      if (room.numbers == 1) {
        room.leftPerson.name = data.playerName;  //如果他是第一個進來的就算在左邊
        room.leftPerson.uuid = data.playerUuid;
        data.leftPoint = room.leftPerson.point;  //傳他的point到frontend
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
      }

      if (room.numbers == 2) {
        room.rightPerson.name = data.playerName; //如果他是第一個進來的就算在右邊
        room.rightPerson.uuid = data.playerUuid;
        data.leftName = room.leftPerson.name;
        data.leftPoint = room.leftPerson.point;
        data.leftUuid = room.leftPerson.uuid;
        data.rightName = room.rightPerson.name;
        data.rightUuid = room.rightPerson.uuid;
        // io.sockets.in(data.gameId).emit('startGame', data);
        io.sockets.in(data.gameId).emit('secondJoin', data);
      }

    } else { //room.number > 2
      sock.emit('tooManyPeople', 'There are already 2 people in the room.');
    }
    

  } else {
    console.log('SERVER: room not exist');
  }
  
}
