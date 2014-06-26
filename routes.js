module.exports = Routes;

function Routes (app) {

	var passport = require('./passportModule').passportModule(app);
	// var LocalStrategy = require('passport-local').Strategy;
	var FacebookStrategy = require('passport-facebook').Strategy;
	var users = [
		{id: 1, username: 'aa', password: '123'},
		{id: 2, username: 'bb', password: '456'}
	];

	// Passport session setup.
	passport.serializeUser(function(user, done) {
		console.log('serialize ' + Object.keys(user));
		done(null, user);
	});

	// passport.deserializeUser(function(id, done) {
	// 	findById(id, function (err, user) {
	// 		done(err, user);
	// 	});
	// });

	passport.deserializeUser(function(obj, done) {
		console.log('deserialize ' + obj);
		done(null, obj);
	});

	// passport.use(new LocalStrategy(
	//     function(username, password, done) {
	//         console.log('SERVER: ' + username);
	//         console.log('SERVER: ' + password);
	//         process.nextTick(function(){
	//             findByUsername(username, function(err, user) {
	//                 console.log('SERVER passport find user: ' + user);
	//                 if (err) { return done(err); }
	//                 if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
	//                 if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
	//                 return done(null, user);
	//             });
	//         });
	//     }
	// ));

	passport.use(new FacebookStrategy({
		clientID: "511239108925093",
		clientSecret: "31e5ef5790134a271bb146ca7c6d9dd0",
		callbackURL: "http://localhost:3000/auth/facebook/callback"
		},
		function(accessToken, refreshToken, profile, done){
			process.nextTick(function() {
				return done(null, profile);
			});
		}
	));
	
	app.get('/', function(req, res){
		res.render('index', {});
	});

	app.get('/game', ensureAuthenticated, function(req, res){
		res.render('game', {user: req.user});
	});

	// app.post('/game',
 //        passport.authenticate('local', { failureRedirect: '/fail', failureFlash: true}),
 //        function(req, res) {
 //            console.log('SERVER route welcome post req: ' + Object.keys(req.user));
 //            res.redirect('/game');
 //    	}
 //    );

	app.get('/auth/facebook', passport.authenticate('facebook'), function(req, res) {

	});

	app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/'}), function(req, res) {
		res.redirect('/game');
	});

    app.get('/fail', function(req, res){
		res.render('fail', {});
	});

	app.get('/join', ensureAuthenticated, function(req, res){
		res.render('join', {user: req.user});
	});

	app.get('/game', ensureAuthenticated, function(req, res){
		res.render('game', {user: req.user});
	});

    function findById(id, fn) {
		var idx = id - 1;
		if (users[idx]) {
			fn(null, users[idx]);
		} else {
			fn(new Error('User ' + id + ' does not exist'));
		}
	}

	function findByUsername(username, fn) {
		for (var i = 0, len = users.length; i < len; i++) {
			var user = users[i];
			if (user.username === username) {
			  return fn(null, user);
			}
		}
		return fn(null, null);
	}

	function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/');
    }

    function generateRoom(length) {
		var haystack = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		var room = '';

		for (var i = 0; i < length; i++) {
			room += haystack.charAt(Math.floor(Math.random() * 62));
		}
		console.log('SERVER: room: ' + room);
		return room;
	}


}

