var createError = require('http-errors');
var express = require('express');
var path = require('path');
const bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const multer = require('multer');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const db = mongoose.connection;
const requestIP = require('request-ip');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const aboutRouter = require('./routes/about');
const contactRouter = require('./routes/contact');

const global = require('./my_module/global');

const { cookie } = require('express-validator');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.locals.truncateText = (text, length) => {
  let truncatedText = text.substring(0, length);
  return truncatedText;
}
app.locals.truncateRemainingText = (text, length) => {
  let truncatedText = text.substring(length);
  return truncatedText;
}

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// set a cookie
app.use(function (req, res, next) {
  // check if client sent cookie
  let cookie = req.cookies.visitor;
  if (cookie === undefined) {
    // no: set a new cookie
    let randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('visitor',randomNumber, { maxAge: 900000, httpOnly: false, path: "/"});
    
    console.log('cookie created successfully');
  } else {
    console.log('cookie exists', cookie);
  } 
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

//ip getting
app.use(requestIP.mw())
app.use((req, res, next) => {
  req.ip = req.clientIp;
  next();
})

//session
app.use(session({
  secret: "boom boom secret",
  saveUninitialized: true,
  resave: true,
  // cookie: {secure: true, 
  //   maxAge: 60000 * 60 * 24 * 30,
  //   user: Math.random().toString().substring(2)
  // },
}));

//passport
app.use(passport.initialize());
app.use(passport.session());

//flash
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// user authentication
app.get('*', (req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);
app.use('/about', aboutRouter);
app.use('/contact', contactRouter);

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
