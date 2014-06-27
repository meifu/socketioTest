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
  this.status = 0; //0: not begin, 1: round 1, 2: round 2, 3: round 3 
  this.playersRecord = {
    round1: {left: '', right: '', winner: ''},
    round2: {left: '', right: '', winner: ''},
    round3: {left: '', right: '', winner: ''}
  }
}

exports.initGame = function(sio, socket){
	io = sio;
  gameSocket = socket;
  gameSocket.emit('connected', { message: "You are connected!" });

  // Host Events
  gameSocket.on('hostCreateNewGame', hostCreateNewGame);
  gameSocket.on('playerMakeChoice', recordPlayerChoice);
  gameSocket.on('clearRound', clearOneRound);

  // Player Events
  gameSocket.on('playerJoinGame', playerJoinGame);
  gameSocket.on('updateReady', updateReadyStatus);

  //listRoom
  gameSocket.on('askRooms', getRoomsInfo);
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
      roomPool[data.gameId].status = 1;
      io.sockets.in(data.gameId).emit('goInToTheGame', {
        leftName: roomPool[data.gameId].leftPerson.name,
        leftPoint: roomPool[data.gameId].leftPerson.point,
        rightName: roomPool[data.gameId].rightPerson.name,
        round: roomPool[data.gameId].status
      });
    }
  } else {
    console.log('SERVER find no room');
  }
  
}

function recordPlayerChoice(data) {
  // console.log('gameID: ' + data.gameId);
  // console.log('playerId: ' + data.playerId);
  // console.log('game status: ' + roomPool[data.gameId].status);
  var currentPosition = '';
  var currentRound = 'round' + roomPool[data.gameId].status;
  if (data.playerId === roomPool[data.gameId].leftPerson.uuid) {
    console.log('left player made choice');
    roomPool[data.gameId].playersRecord[currentRound]['left'] = data.choice;
    currentPosition = 'left';
  } else if (data.playerId === roomPool[data.gameId].rightPerson.uuid) {
    console.log('right player made choice');
    roomPool[data.gameId].playersRecord[currentRound]['right'] = data.choice;
    currentPosition = 'right';
  }
  console.log('test current room: ' + roomPool[data.gameId].playersRecord[currentRound]['left']);
  console.log('test current room: ' + roomPool[data.gameId].playersRecord[currentRound]['right']);
  io.sockets.in(data.gameId).emit('showPlayerChoice', {choicePosition: currentPosition, choice: data.choice});

  //如果兩個玩家都已經作出決定
  if (roomPool[data.gameId].playersRecord[currentRound]['left'] !== '' && roomPool[data.gameId].playersRecord[currentRound]['right'] !== '') {
    console.log('Both two players made choices');
    //判斷誰贏
    var winner = judgeWinner(roomPool[data.gameId].playersRecord[currentRound]['left'], roomPool[data.gameId].playersRecord[currentRound]['right']);
    roomPool[data.gameId].playersRecord[currentRound]['winner'] = winner;
    var winCounts = getWinRounds(data.gameId);
    io.sockets.in(data.gameId).emit('showBothChoices', {leftChoice: roomPool[data.gameId].playersRecord[currentRound]['left'], rightChoice: roomPool[data.gameId].playersRecord[currentRound]['right'], winRounds: winCounts});
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

/* *****************************
   *                           *
   *        GAME LOGIC         *
   *                           *
   ***************************** */
function judgeWinner(leftChoice, rightChoice) {
  var rockPaperScissorsCode = {'scissors': 0, 'rock': 1, 'paper': 2};
  var pssRule = [[0, -1, 1], [1, 0, -1], [-1, 1, 0]];
  var result = pssRule[rockPaperScissorsCode[leftChoice]][rockPaperScissorsCode[rightChoice]];
  console.log('SERVER result: ' + result);
  if (result > 0) {
    return 'left';
  } else if (result < 0) {
    return 'right';
  } else {
    return 0;
  }
}

function getWinRounds(gameId) {
  var winNumbers = {leftWin: 0, rightWin: 0};
  for (var i = 0; i < 3; i++ ) {
    console.log('SERVER check round: ' + i);
    console.log('SERVER check round: ' + roomPool[gameId].playersRecord['round' + (i+1)]);
    if (roomPool[gameId].playersRecord['round' + (i+1)].winner === 'left') {
      winNumbers.leftWin = winNumbers.leftWin + 1;
    } else if (roomPool[gameId].playersRecord['round' + (i+1)].winner === 'right') {
      winNumbers.rightWin = winNumbers.rightWin + 1;
    }
  }

  return winNumbers;
  
}

function clearOneRound(data) { //data.gameId
  console.log('checkroom: ' + roomPool[data.gameId].gameId);
  console.log('checkroom: ' + roomPool[data.gameId].leftPerson.uuid);
  console.log('checkroom: ' + roomPool[data.gameId].rightPerson.uuid);
  console.log('checkroom: ' + roomPool[data.gameId].playersRecord.round1.left + ' , ' + roomPool[data.gameId].playersRecord.round1.right + ' , ' + roomPool[data.gameId].playersRecord.round1.winner);
  console.log('checkroom: ' + roomPool[data.gameId].playersRecord.round2.left + ' , ' + roomPool[data.gameId].playersRecord.round2.right + ' , ' + roomPool[data.gameId].playersRecord.round2.winner);
  console.log('checkroom: ' + roomPool[data.gameId].playersRecord.round3.left + ' , ' + roomPool[data.gameId].playersRecord.round3.right + ' , ' + roomPool[data.gameId].playersRecord.round3.winner);
  if (roomPool[data.gameId].status <= 3) {
    roomPool[data.gameId].status = roomPool[data.gameId].status + 1;  
  }
  

}


/* *****************************
   *                           *
   *      ADMIN FUNCTIONS      *
   *                           *
   ***************************** */
function getRoomsInfo() {
  console.log('SERVER GETROOMSINFO');
  // console.log(Object.keys(io));
  // console.log(Object.keys(io.sockets));
  console.log(Object.keys(io.nsps));
  // console.log(io.sockets.sockets);
  for (nsp in io.nsps) {
    console.log(io.nsps[nsp].connected);
  }

  this.emit('showRoom', Object.keys(io.nsps));

}
