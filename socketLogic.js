var io;
var gameSocket;

var roomNums = [], roomPool = {};
var roomObj = function(n, game_id) {
  this.numbers = n || 0;
  this.gameId = game_id || '';
  this.hostId = '';
}

exports.initGame = function(sio, socket){
	io = sio;
  gameSocket = socket;
  gameSocket.emit('connected', { message: "You are connected!" });

  // Host Events
  gameSocket.on('hostCreateNewGame', hostCreateNewGame);

  // Player Events
  gameSocket.on('playerJoinGame', playerJoinGame);
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

      // Emit an event notifying the clients that the player has joined the room.
      io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

      if (room.numbers == 2) {
        io.sockets.in(data.gameId).emit('startGame', data);
      }

    } else { //room.number > 2
      sock.emit('tooManyPeople', 'There are already 2 people in the room.');
    }
    

  } else {
    console.log('SERVER: room not exist');
  }
  
}
