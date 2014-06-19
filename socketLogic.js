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
  this.join('/' + thisGameId.toString(), function(err){
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
  console.log('game_id: ' + data.gameId);
  console.log('room: ' + Object.keys(roomPool));

  // console.log('playerJoinGame1 ' + Object.keys(gameSocket));
  // console.log('playerJoinGame0 rooms: ' + gameSocket.rooms);
  // console.log('playerJoinGame1 id: ' + gameSocket.id);
  // console.log('playerJoinGame1 client: ' + Object.keys(gameSocket.client));
  // console.log('playerJoinGame1 client: ' + Object.keys(gameSocket.client.nsps));
  // console.log('playerJoinGame0 io: ' + Object.keys(io));
  // console.log('playerJoinGame0 io.nsps1: ' + Object.keys(io.nsps));
  // console.log('playerJoinGame0 io.nsps2: ' + Object.keys(io.nsps['/' + data.gameId]));
  // console.log('playerJoinGame0 io.nsps3 (sockets): ' + Object.keys(io.nsps['/' + data.gameId].sockets[0]));
  // console.log('playerJoinGame0 io.nsps4 (server):' + Object.keys(io.nsps['/' + data.gameId].server));
  // console.log('playerJoinGame0 io.nsps5 (connected): ' + io.nsps['/' + data.gameId].connected);
  // console.log('playerJoinGame0 io.nsps5 (connected): ' + Object.keys(io.nsps['/' + data.gameId].connected));
  // console.log('playerJoinGame0 io._path: ' + io._path);
  // console.log('playerJoinGame0 io._adapter: ' + io._adapter);
  // console.log('playerJoinGame0 io.sockets: ' + Object.keys(io.sockets)); //io.sockets = io
  // console.log('playerJoinGame0 io.eio: ' + Object.keys(io.eio));
  // console.log('playerJoinGame0 io.engine: ' + Object.keys(io.engine));
  // console.log('playerJoinGame0 io.engine clientscount: ' + io.engine.clientsCount);
  // console.log('playerJoinGame0 io.engine clients: ' + Object.keys(io.engine.clients));
  // var room = gameSocket('/' + data.gameId);

  // If the room exists...
  if (room) {
    
    console.log('room exist');

    room.numbers += 1;

    // Join the room
    sock.join(data.gameId);

    //tell host screen to update numbers
    var host_id = roomPool[data.gameId].hostId;
    // console.log('update host screen ' + Object.keys(io.sockets.sockets));
    console.log('update host screen ' + Object.keys(io.sockets.connected));
    console.log('hostid obj ' + io.sockets.connected[host_id]);
    // io.sockets.connected[host_id].emit('updateWait', {numbersInRoom: room.numbers});

    // Emit an event notifying the clients that the player has joined the room.
    io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

  // } else {
  //   // Otherwise, send an error message back to the player.
  //   this.emit('error',{message: "This room does not exist."} );
  }
  
}
