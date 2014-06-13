var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');

app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');
// app.engine('ejs', require('ejs-locals'));
app.set('base_url', 'http://localhost:3000/');
app.set('serverAddress', 'http://localhost:3000/');
app.set('port', 3000);

server.listen(app.get('port'));

app.use(express.static(__dirname + '/'));
app.use(cookieParser());
app.use(bodyParser());
// app.use(express.methodOverride());
app.use(express.session({secret: 'keyboard cat'}));
app.use(flash());

require('./routes')(app);

// Listen for Socket.IO Connections. Once connected, start the game logic.
io.sockets.on('connection', function (socket) {
	console.log('client connected');
	require('./socketLogic').initGame(io, socket);
});
