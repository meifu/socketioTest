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
            IO.socket.on('secondJoin', IO.secondJoinedRoom );
            IO.socket.on('tooManyPeople', IO.onTooManyPlayers);
            IO.socket.on('startGame', IO.startGame);
            IO.socket.on('readyLightOn', IO.readyLightOn);
            IO.socket.on('goInToTheGame', IO.goToGame);
            IO.socket.on('showPlayerChoice', IO.showChoice);
            IO.socket.on('showBothChoices', IO.showBothChoices);
            IO.socket.on('finalResult', IO.showFinalWinner);
        },
        onConnected : function(data) {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketId = IO.socket.sessionid;
            console.log('client sessionid: '+ Object.keys(IO.socket));
            console.log(data.message);
        },
        onNewGameCreated : function(data) { //data include: gameId, mySocketId
            console.log('onNewGameCreated: ' + data);
            App.gameId = data.gameId;
            App.Host.gameInit(data);
        },
        playerJoinedRoom : function(data) {
            console.log('playerJoinedRoom: ' + Object.keys(data));
            console.log('playerJoinedRoom: ' + App.myRole);
            App[App.myRole].updateWaiting(data);
        },
        secondJoinedRoom : function(data) { //data.rightName, data.leftName
            App.Host.secondPlayerJoin(data);
            App.Player.secondPlayerJoin(data);
        },
        onTooManyPlayers : function(data) {
            console.log('too many: ' + data);
            $('#flashLayer').css('display', 'block');
        },
        startGame : function(data) {
            // $('#initialScreen').fadeOut();
            $('#hostGameArea').fadeOut();
            App[App.myRole].gameStartInit(data);
            
        },
        readyLightOn : function(data) {
            App.Host.readyLightOn(data);
        },
        goToGame : function(data) {
            App[App.myRole].goInToGame(data);
        },
        showChoice : function(data) {
            App.Host.showPlayerChoice(data);
        },
        showBothChoices : function(data) {
            App[App.myRole].showTwoPlayersChoices(data);
        },
        showFinalWinner : function(data) {
            App[App.myRole].showFinalWinner(data);
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
            App.$gameHostWaitTemplate = $('#game-wait-host-template').html();
            App.$gameHostStartTemplate = $('#game-main-host-template').html();
            App.$winnerWaitTemplate = $('#win-wait-player-template').html();
            App.$loseTemplate = $('#lose-player-template').html();
        },

        bindEvents: function () {
            // Host
            App.$doc.on('click', '#createNewGame', App.Host.onCreateClick);

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart', App.Player.onPlayerStartClick);
            App.$doc.on('click', '#readyBtnM', App.Host.updateReady);
            App.$doc.on('click', '.choice', App.sendChoice);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */
        generateId: function() {
            var S4 = function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            };
            return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
        },

        sendChoice: function(e) { 
            // console.log('player id: ' + App.Player.myId);
            // console.log('click this: ' + $(e.target).parents('.choice').attr('id'));
            $('#flashLayer').css('display', 'block');
            var playerChoice = $(e.target).parents('.choice').attr('id');
            IO.socket.emit('playerMakeChoice', {choice: playerChoice, playerId: App.Player.myId, gameId: App.gameId});
        },

        /* ******************************
        *         HOST CODE             *
        ******************************* */
        Host : {
            // players : [],
            // isNewGame : false,
            // numPlayersInRoom: 0,
            // currentCorrectAnswer: '',
            onCreateClick: function () {
                console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
            },

            gameInit: function (data) {
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
                $('#roomlink img').attr('src', 'http://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=http://60.199.162.87:3000/');
                // Show the gameId / room id on screen
                $('#shareUrl').val(App.gameId);
            },

            updateWaiting: function(data) { //data.playerName, data.gameId, data.leftPoint
                // console.log('Host data numbers: ' + data.numbersInRoom);
                $('#hostGameArea').html(App.$gameHostWaitTemplate);
                $('#ProfileL').append('<span>' + data.playerName + '</span>');
                $('#ProfileL').find('.streak').find('span').html(data.leftPoint);
                $('#QRXL').append('<input type="text" value="' + data.gameId + '">');                
            },

            secondPlayerJoin: function(data) {
                console.log('secondPlayerJoin' + JSON.stringify(data));
                var tl = new TimelineLite();
                tl.add(TweenLite.to($('#waiting #QRXL'), 0.5, {top:"-=200px",opacity:"0"}));
                tl.add([
                        TweenLite.to($('#waiting #ProfileR'), 0.5, {right:"40px",opacity:"1"}),
                        TweenLite.to($('#waiting #readyBtn'), 1, {opacity:"1"}),
                        TweenLite.to($('#waiting #waitingDesc'), 1, {opacity:"0"}),
                    ]);
                $('#ProfileR').append('<span>' + data.rightName + '</span>');
                
            },

            updateReady: function() {
                console.log('to update ready status: ' + App.Player.myPosition);
                console.log('to update ready status: ' + App.gameId);
                IO.socket.emit('updateReady', {'position': App.Player.myPosition, 'gameId': App.gameId});
            },

            readyLightOn: function(data) {
                console.log('light on!' + data.position);
                if (data.position === 'left') {
                    TweenLite.to($('#waiting #readyL'), 0.5, {opacity:"1"});
                } else if (data.position === 'right') {
                    TweenLite.to($('#waiting #readyR'), 0.5, {opacity:"1"});
                }
                
            },
            goInToGame: function(data) {
                window.setTimeout(function(){
                    $('#hostGameArea').html(App.$gameHostStartTemplate);
                    $('#p1Profile').find('.gProfile').eq(0).append('<span>' + data.leftName + '</span>');
                    $('#p2Profile').find('.gProfile').eq(0).append('<span>' + data.rightName + '</span>');
                    $('#p1Profile').find('.streak').eq(0).append('<span>' + data.leftPoint + '<span>');
                }, 800);
            },

            showPlayerChoice: function(data) {
                console.log('current Pos: ' + data.choicePosition + ', current Choice: ' + data.choice);
                if (data.choicePosition === 'left') {
                    $('.p1Game').find('.gCircXL').eq(0).addClass('ready');
                } else if (data.choicePosition === 'right') {
                    $('.p2Game').find('.gCircXL').eq(0).addClass('ready');
                }
            },

            showTwoPlayersChoices: function(data) {
                console.log('two win counts: ' + data.winRounds.leftWin);
                console.log('two win counts: ' + data.winRounds.rightWin);
                window.setTimeout(function(){
                    $('.p1Game').find('.gCircXL').eq(0).addClass(data.leftChoice);
                    $('.p2Game').find('.gCircXL').eq(0).addClass(data.rightChoice);
                    
                    $('.p1Game').find('.gStatus').eq(0).find('ul').eq(0).addClass('win' + data.winRounds.leftWin);
                    $('.p2Game').find('.gStatus').eq(0).find('ul').eq(0).addClass('win' + data.winRounds.rightWin);
                    
                }, 2000);
                window.setTimeout(function(){
                    IO.socket.emit('clearRound', {gameId: App.gameId});
                    $('.p1Game').find('.gCircXL').eq(0).attr('class', 'gs gCircXL circ');
                    $('.p2Game').find('.gCircXL').eq(0).attr('class', 'gs gCircXL circ');
                    if (data.leftChoice !== data.rightChoice) {
                        console.log('not equal');
                        $('#round').html(parseInt($('#round').html()) + 1);
                    }
                    
                }, 4000);
            },

            showFinalWinner: function(data) {
                $('#hostGameArea').html(App.$gameHostWaitTemplate);
                $('#ProfileL').append('<span>' + data.finalWinnerName + '</span>');
                $('#ProfileL').find('.streak').eq(0).find('span').html(data.finalWinnerPoint);
                $('#QRXL').find('img').eq(0).attr('src', 'http://chart.apis.google.com/chart?cht=qr&chs=200x200&chl=http://60.199.162.87:3000/');
            }
        },

        /* *****************************
           *        PLAYER CODE        *
           ***************************** */
        Player : {
            hostSocketId: '',
            myName: '',
            myId: '',
            myPosition: '',
            myOpponent: '',
            onJoinClick: function () {
                console.log('Clicked "Join A Game" ' + $('#username').html());
                App.Player.myName = $('#username').html();
                // Display the Join Game HTML on the player's screen.
                App.$hostGameArea.html(App.$templateJoinGame);
                $('#username2').html(App.Player.myName);
            },
            onPlayerStartClick: function() {
                console.log('Player clicked "Start" ' + $('#username2').html());
                
                // Set the appropriate properties for the current player.
                App.myRole = 'Player';
                App.Player.myName = $('#username2').html();
                App.Player.myId = App.generateId();

                // collect data to send to the server
                var data = {
                    gameId : $('#inputGameId').val(),
                    playerName: $('#username2').html(),
                    playerUuid: App.Player.myId
                };

                App.gameId = data.gameId;

                $('#hostGameArea').html(App.$gamePlayerWaitTemplate);

                // Send the gameId and playerName to the server
                IO.socket.emit('playerJoinGame', data);
                console.log('gameId: ' + data.gameId);
                io('/' + data.gameId);

            },

            updateWaiting: function(data) {  //這個只有第一個player會跑
                console.log('Player data numbers: ' + data.numbersInRoom);
                $('#playerWaitingMessage').html(data.numbersInRoom + ' player in room');
                $('#ProfileMe').append('<span>' + data.playerName + '</span>');
                $('#ProfileMe').find('.streak').html(data.leftPoint);
                App.Player.myPosition = 'left';
            },

            secondPlayerJoin: function(data) {
                $('#readyBtnM').css('display','block');
                TweenLite.to($('#waitingDescM'), 1, {opacity:"0"});
                TweenLite.to($('#ProfileOpp'), 1, {opacity:"1"});
                TweenLite.to($('#ProfileMe'), 1, {css:{'top':'3%'}});
                TweenLite.to($('#readyBtnM'), 1, {opacity:"1"});
                TweenLite.to($('#oppoDesc'), 1, {opacity:"1"});
                TweenLite.to($('#descWhite'), 1, {opacity:"1"});
                console.log('testmyname: ' + App.Player.myName + ' , testmyid: ' + App.Player.myId);
                if (data.leftUuid === App.Player.myId) { //如果現在frontend是左邊第一個進來的，就只要去補opponent的name...
                    console.log('first player');
                    $('#ProfileOpp').append('<span>' + data.rightName + '</span>');
                } else if (data.rightUuid === App.Player.myId) { //如果現在frontend是右邊第二個進來的就要補很多...
                    console.log('second player');
                    App.Player.myPosition = 'right';
                    $('#ProfileMe').append('<span>' + App.Player.myName + '</span>');
                    $('#ProfileMe').find('.streak').html(data.leftPoint);
                    $('#ProfileOpp').append('<span>' + data.leftName + '</span>');
                }
            },

            gameStartInit: function(data) {
                $('#gameWaitArea').html(App.$gamePlayerStartTemplate);
            },

            goInToGame: function(data) {
                window.setTimeout(function(){
                    $('#hostGameArea').html(App.$gamePlayerStartTemplate);
                    $('#hostGameArea').addClass('mobile');
                    $('#p1Profile').find('.gProfile').eq(0).append('<span>' + data.leftName + '</span>');
                    $('#p2Profile').find('.gProfile').eq(0).append('<span>' + data.rightName + '</span>');
                    $('#p1Profile').find('.streak').eq(0).append('<span>' + data.leftPoint + '</span>');
                }, 800);
            },

            showTwoPlayersChoices: function(data) {
                window.setTimeout(function(){
                    $('#flashLayer').css('display', 'none');
                    $('#p1Profile').find('.gStatus').eq(0).find('ul').eq(0).addClass('win' + data.winRounds.leftWin);
                    $('#p2Profile').find('.gStatus').eq(0).find('ul').eq(0).addClass('win' + data.winRounds.rightWin);
                }, 2000);
                
            },

            showFinalWinner: function(data) {
                console.log('showFinal my side: ' + App.Player.myPosition + ', and game ID is: ' + App.gameId);
                if (App.Player.myPosition === data.finalWinnerSide) {
                    //to winner waiting...
                    $('#hostGameArea').html(App.$winnerWaitTemplate);
                    $('#ProfileMe').append('<span>' + App.Player.myName + '</span>');
                    $('#ProfileMe').find('.streak').eq(0).find('span').html(data.finalWinnerPoint);
                } else {
                    //to loser page...
                    $('#hostGameArea').html(App.$loseTemplate);
                    IO.socket.emit('iamlose', {'gameId': App.gameId});
                }
            }

        }


    };

    IO.init();
    App.init();
}($));
