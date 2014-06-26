exports.passportModule = function(app){
	var passport = require('passport');
	app.use(passport.initialize());
	app.use(passport.session());
	return passport;
}