var io;
var gameSocket;
var roomNums = [], roomPool = {};
var roomObj = function(n, game_id) {
  this.numbers = n || 0;
  this.gameId = game_id || '';
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
function hostCreateNewGame() {

  // Create a unique Socket.IO Room
  var thisGameId = ( Math.random() * 100000 ) | 0;

  // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
  this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});
  console.log('SERVER hostCreateNewGame: ' + thisGameId.toString());
  // Join the Room and wait for the players
  this.join(thisGameId.toString(), function(err){
    console.log('hostCreateNewGame rooms: ' + gameSocket.rooms);
    console.log('err ' + err);
    roomNums.push(thisGameId.toString());
    roomPool[thisGameId] = new roomObj(0, thisGameId);
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
  // var room = gameSocket.manager.rooms["/" + data.gameId];
  // console.log('playerJoinGame1 ' + Object.keys(gameSocket));
  console.log('playerJoinGame1 rooms: ' + gameSocket.rooms);
  // console.log('playerJoinGame1 id: ' + gameSocket.id);
  // console.log('playerJoinGame1 client: ' + Object.keys(gameSocket.client));
  // console.log('playerJoinGame1 client: ' + Object.keys(gameSocket.client.nsps));
  console.log('playerJoinGame0 io: ' + Object.keys(io));
  console.log('playerJoinGame0 io.nsps: ' + Object.keys(io.nsps));
  console.log('playerJoinGame0 io.nsps: ' + Object.keys(io.nsps['/']));
  // console.log('playerJoinGame0 io._path: ' + io._path);
  // console.log('playerJoinGame0 io._adapter: ' + io._adapter);
  // console.log('playerJoinGame0 io.sockets: ' + Object.keys(io.sockets)); //io.sockets = io
  // console.log('playerJoinGame0 io.eio: ' + Object.keys(io.eio));
  console.log('playerJoinGame0 io.engine: ' + Object.keys(io.engine));
  console.log('playerJoinGame0 io.engine clientscount: ' + io.engine.clientsCount);
  console.log('playerJoinGame0 io.engine clients: ' + Object.keys(io.engine.clients));
  var room = gameSocket.rooms["/" + data.gameId];

  // If the room exists...
  if( room != undefined ){
    // attach the socket id to the data object.
    data.mySocketId = sock.id;

    // Join the room
    sock.join(data.gameId);
    console.log('playerJoinGame1 ' + roomPool[data.gameId]);
    // console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

    // Emit an event notifying the clients that the player has joined the room.
    io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

  } else {
    // Otherwise, send an error message back to the player.
    this.emit('error',{message: "This room does not exist."} );
  }
  
}
