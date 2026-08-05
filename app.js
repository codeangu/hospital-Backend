const dns = require('dns');
// Local network DNS resolver sometimes can't resolve MongoDB Atlas SRV
// records (queryTxt/querySrv EREFUSED); force public DNS for reliability.
dns.setServers(['8.8.8.8', '1.1.1.1']);

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
require('dotenv').config();
const indexRouter = require('./mainRoutes/index');
const usersRouter = require('./src/users/userRouter');

const session = require("express-session");
const FileStore = require("session-file-store")(session);
const passport =require("passport");
const mongoose = require("mongoose");
const cors = require('./src/cors');
const {apiStart} = require('./src/shared/apiStart');
const app = express();
const config = require("./config");
app.use(cors.corsWithOptions); 
// Middleware to determine the subdomain
app.use((req, res, next) => {
    const subdomain = req.hostname.split('.')[0];
    req.subdomain = subdomain;
    next();
  });


const url = config.mongoUrl;
const connect = mongoose.connect(url, {
    useNewUrlParser: true, 
    // connectTimeoutMS: 30000,
    useUnifiedTopology: true 
    //  useCreateIndex: true, //make this true
    //  autoIndex: true, //make this also true
});
connect.then(
    db => {
        console.log("Connected correctly to server", app.get("port") );
    },
    err => {
        console.log(err);
    }
);

app.set('trust proxy', 1);

app.all('*', (req, res, next) => {
    if (req.secure) {
        return next();
    }
    else {
        // Note: No need to include the port in the redirect URL
        res.redirect(307, 'https://' + req.hostname + req.url);
    }
});
app.use(
    session({
        name: "session-id",
        secret: "99##OCD*zAGpx1xm{NeQhc;",
        saveUninitialized: false,
        resave: false,
        // store: new FileStore()
    })
);



app.use(passport.initialize());
app.use(passport.session());
app.use(apiStart+'/users', usersRouter);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false,limit: '50mb' }));
app.use(cookieParser());

// Domain-based routing middleware
// app.use((req, res, next) => {

  
//     res.sendFile(path.join(__dirname + "/public/index.html"))
  
  
// });

app.use(express.static(path.join(__dirname, 'public')));

// require('./mainRoutes')(app);
require('./mainRoutes')(app);


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
