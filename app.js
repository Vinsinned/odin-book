var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var FacebookStrategy = require('passport-facebook');
const mongoose = require("mongoose");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const User = require('./models/user');
const bcrypt = require('bcryptjs');
require('dotenv').config();

var passport = require('passport');
var FacebookStrategy = require('passport-facebook');

const mongoDb = "mongodb+srv://vinsinned:a@cluster0.iqztj.mongodb.net/collection0?retryWrites=true&w=majority";
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    //Remember to put your domain, dummby mistake from em
    callbackURL: 'http://localhost:3000/user/log-in-facebook',
    profileFields: ['emails', 'name', 'picture.type(normal)']
  },
  function(accessToken, refreshToken, profile, done) {
    //Check the DB to find a User with the profile.id

    //facebook_id
    User.findOne({ username: profile.emails[0].value }, function(err, user) {//See if a User already exists with the Facebook ID
      if(err) {
        console.log(err);  // handle errors!
      }
      if (user) {
        done(null, user); //If User already exists login as stated on line 10 return User
      } else { //else create a new User
        const user = new User({
          first_name: profile.name.givenName,
          last_name: profile.name.familyName,
          username: profile.emails[0].value,
          password: profile.id
        })
        user.save(function (err) {
          if (err) { console.log(err); }
        });

        done(null, user);
      }
    });
  }
));

passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) { 
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          // passwords match! log user in
          return done(null, user)
        } else {
          // passwords do not match!
          return done(null, false, { message: "Incorrect password" })
        }
      })
    });
  })
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var postsRouter = require('./routes/posts');

var app = express();

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/posts', postsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
