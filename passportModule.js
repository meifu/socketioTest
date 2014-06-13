exports.passportModule = function(app){
	var passport = require('passport'), LocalStrategy = require('passport-local').Strategy;
	app.use(passport.initialize());
	app.use(passport.session());
	return passport;
}