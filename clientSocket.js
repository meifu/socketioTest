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
            App[App.myRole].updateWaiting(data);
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

            displayNewGameScreen : function(gameid) {
                // Fill the game screen with the appropriate HTML
                App.$hostGameArea.html(App.$newGameTemplate);
                // Display the URL on screen
                console.log('displayNewGameScreen ' + $('#shareUrl').val());
                // Show the gameId / room id on screen
                var shareUrl = $('#shareUrl').val() + App.gameId;
                $('#shareUrl').val(shareUrl);
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

                // Display the Join Game HTML on the player's screen.
                App.$hostGameArea.html(App.$templateJoinGame);
                console.log('template: ' + App.$templateJoinGame);
                console.log('name' + $('#username').html());
            },
            onPlayerStartClick: function() {
                console.log('Player clicked "Start"');

                // collect data to send to the server
                var data = {
                    gameId : +($('#inputGameId').val()),
                    playerName: $('#username').html()
                };

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);

                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
            },
        },

        /* **************************
                  UTILITY CODE
           ************************** */

    };

    IO.init();
    App.init();
}($));
