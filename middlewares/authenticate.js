var passport = require("passport");
var LocalStrategy = require("passport-local").Strategy;
var User = require("../src/users/userModel");
var JwtStrategy = require("passport-jwt").Strategy;
var ExtractJwt = require("passport-jwt").ExtractJwt;
var jwt = require("jsonwebtoken"); // used to create, sign, and verify tokens
var FacebookTokenStrategy = require("passport-facebook-token");

var config = require("../config.js");

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
  return jwt.sign(user, config.secretKey, { expiresIn: '5d' });
};

var opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(
  new JwtStrategy(opts, (jwt_payload, done) => {
    console.log("JWT payload: ", jwt_payload);
    User.findOne({ _id: jwt_payload._id }, (err, user) => {
      if (err) {
        return done(err, false);
      } else if (user) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })
);

exports.verifyUser = passport.authenticate("jwt", { session: false });

exports.verifyAdmin = (req, res, next) => {
  if (req.user.admin) {
    return next();
  } else {
    err = new Error("You are not authorized to perform this operation!");
    err.status = 403;
    return next(err);
  }
};

// Try JWT auth but continue even if no token is present
exports.optionalAuth = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};

// Returns the hospitalId for the authenticated user
// HOSPITAL role users are their own hospital; staff carry hospitalId field
exports.getHospitalId = (user) => {
  if (!user) return null;
  if (user.role === 'HOSPITAL') return user._id;
  return user.hospitalId || null;
};

// Attaches req.userScope: a MongoDB filter that restricts records to those
// owned by the current user and their linked staff.
// HOSPITAL and admin users get no extra scope (hospital filter alone is enough).
// DOCTOR sees their own patients + patients created by their receptionists.
// RECEPTION sees their own patients + patients created by their linked doctors.
exports.userScopeFilter = async (req, res, next) => {
  try {
    if (!req.user) return next();
    const { role, _id, hospitalId, doctorIds } = req.user;
    if (role === 'HOSPITAL' || req.user.admin) return next();

    if (role === 'DOCTOR') {
      const receptionists = await User.find(
        { doctorIds: _id, role: 'RECEPTION', hospitalId },
        '_id'
      );
      req.userScope = { user: { $in: [_id, ...receptionists.map(r => r._id)] } };
    } else if (role === 'RECEPTION') {
      req.userScope = { user: { $in: [_id, ...(doctorIds || [])] } };
    } else {
      req.userScope = { user: _id };
    }
    next();
  } catch (err) {
    next(err);
  }
};

exports.facebookPassport = passport.use(
  new FacebookTokenStrategy(
    {
      clientID: config.facebook.clientId,
      clientSecret: config.facebook.clientSecret
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne({ facebookId: profile.id }, (err, user) => {
        if (err) {
          return done(err, false);
        }
        if (!err && user !== null) {
          return done(null, user);
        } else {
          user = new User({ username: profile.displayName });
          user.facebookId = profile.id;
          user.firstname = profile.name.givenName;
          user.lastname = profile.name.familyName;
          user.save((err, user) => {
            if (err) return done(err, false);
            else return done(null, user);
          });
        }
      });
    }
  )
);
