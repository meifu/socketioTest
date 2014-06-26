;
jQuery(function($){    
    'use strict';
    var IO = {
        init: function() {
            IO.socket = io.connect();
            IO.bindEvents();
        },
        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('tooManyPeople', IO.onTooManyPlayers);
            IO.socket.on('startGame', IO.startGame);
        },
        onConnected : function(data) {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.sessionid;
            console.log('client sessionid: '+ Object.keys(IO.socket));
            console.log(data.message);
        },
        onNewGameCreated : function(data) { //data include: gameId, mySocketId
            console.log('onNewGameCreated: ' + data);
            App.Host.gameInit(data);
        },
        playerJoinedRoom : function(data) {
            console.log('playerJoinedRoom: ' + Object.keys(data));
            console.log('playerJoinedRoom: ' + App.myRole);
            App[App.myRole].updateWaiting(data);
        },
        onTooManyPlayers : function(data) {
            console.log('too many: ' + data);
            $('#playerWaitingMessage').html(data);
        },
        startGame : function(data) {
            // $('#initialScreen').fadeOut();
            $('#hostGameArea').fadeOut();
            App[App.myRole].gameStartInit(data);
            
        }

    }

    var App = {
        gameId: 0,
        myRole: '',   //'Player' or 'Host'
        mySocketId: '',
        currentRound: 0,
        /* *************************************
         *                Setup                *
         * *********************************** */
        init: function () {
            App.cacheElements();
            App.bindEvents();

        },

        cacheElements: function () {
            App.$doc = $(document);
            App.$newGameTemplate = $('#create-game-template').html();
            App.$hostGameArea = $('#hostGameArea');
            App.$templateJoinGame = $('#join-game-template').html();
            App.$gamePlayerStartTemplate = $('#game-main-player-template').html();
            App.$gamePlayerWaitTemplate = $('#game-wait-player-template').html();
        },

        bindEvents: function () {
            // Host
            App.$doc.on('click', '#createNewGame', App.Host.onCreateClick);

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart', App.Player.onPlayerStartClick);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        /* *******************************
           *         HOST CODE           *
        ******************************* */
        Host : {
            players : [],
            isNewGame : false,
            numPlayersInRoom: 0,
            currentCorrectAnswer: '',
            onCreateClick: function () {
                console.log('Clicked "Create A Game"');
                $('#initialScreen').fadeOut();
                $('h1').fadeOut();
                IO.socket.emit('hostCreateNewGame');
            },

            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
                // console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
            },

            displayNewGameScreen: function(gameid) {
                // Fill the game screen with the appropriate HTML
                App.$hostGameArea.html(App.$newGameTemplate);
                // Display the URL on screen
                $('#roomlink img').attr('src', 'http://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=http://localhost:3000/');
                // Show the gameId / room id on screen
                $('#shareUrl').val(App.gameId);
            },

            updateWaiting: function(data) {
                // console.log('Host data numbers: ' + data.numbersInRoom);
                $('#waitingMsg span').html(data.numbersInRoom);
            },

            gameStartInit: function(data) {

            }
        },

        /* *****************************
           *        PLAYER CODE        *
           ***************************** */
        Player : {
            hostSocketId: '',
            myName: '',
            onJoinClick: function () {
                console.log('Clicked "Join A Game"');
                $('#initialScreen').fadeOut();
                // Display the Join Game HTML on the player's screen.
                App.$hostGameArea.html(App.$templateJoinGame);
                $('#ProfileMe').append('<span>' + $('#username').html() + '</span>');
            },
            onPlayerStartClick: function() {
                console.log('Player clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId : $('#inputGameId').val(),
                    playerName: $('#username').html()
                };

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);
                console.log('gameId: ' + data.gameId);
                io('/' + data.gameId);

                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;

                $('h1').fadeOut();
                $('#hostGameArea').fadeOut();
                $('#gameWaitArea').html(App.$gamePlayerWaitTemplate);
            },

            updateWaiting: function(data) {
                console.log('Player data numbers: ' + data.numbersInRoom);
                $('#playerWaitingMessage').html(data.numbersInRoom + ' player in room');
            },

            gameStartInit: function(data) {
                $('#gameWaitArea').html(App.$gamePlayerStartTemplate);
            }
        },

        /* **************************
                  UTILITY CODE
           ************************** */

    };

    IO.init();
    App.init();
}($));
