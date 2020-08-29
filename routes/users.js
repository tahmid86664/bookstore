var express = require('express');
var router = express.Router();
const {check, validationResult} = require('express-validator')
const passport = require('passport');
const localStrategy = require('passport-local');

// database
const mongo = require('mongodb')
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://tahmid:526628Tahmid@test1.mbzeo.mongodb.net/bookstore?retryWrites=true&w=majority";
const client = new MongoClient(uri, {useNewUrlParser: true});
let usersCollection;

// my module
const global = require('../my_module/global');
// my model
const User = require('../models/user');

router.use(passport.session())

client.connect().then(client => {
  console.log("user connected");
  usersCollection = client.db('bookstore').collection('users');

  router.get('/register', (req, res) => {
    res.render('register', {
      title: "Register",
    })
  })// button: Be a member
  
  router.get('/login', (req, res) => {
    res.render('login', {
      title: "Login",
    })
  })
  
  
  //==========================register post method===================
  router.post('/register', global.uploadUserProfile, [
    check('name', "Name field is empty").notEmpty(),
    check('email', "Email is invalid").notEmpty().isEmail(),
    check('username', "username is empty").notEmpty().trim(),
    check('password', "Password field is empty").notEmpty(),
    check('password', "Password must contain at least 6 characters").isLength({min: 6}),
    check('password2', "Password did not match").notEmpty()
  ], (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      console.log(errors.mapped())
      res.render('register',{
        title: "Register",
        errors: errors.mapped()
      })
      return;
    }

    //store info
    let name = req.body.name;
    let email = req.body.email;
    let username = req.body.username;
    let password = req.body.password;

    //image
    let profileImageName;
    let profileImageOriginalName;
    let profileImagePath;
    let profileImageMime;
    let profileImageExt;
    let profileImageSize;
    // checking the image
    if(!req.file){
      profileImageName = "profile_image-no-image.png"
    }else{
      profileImageName = req.file.filename;
      profileImageOriginalName = req.file.originalname;
      profileImagePath = req.file.path;
      profileImageExt = req.file.extname;
      profileImageMime = req.file.mimetype;
      profileImageSize = req.file.size;
    }

    //database work
    usersCollection.insertOne({
      name: name.trim(),
      email: email.trim(),
      username: username.trim(),
      password: password,
      profileImage: profileImageName
    }).then(result => {
      req.flash("success", "You've been registered successfully. Please login")
      res.redirect("/users/login");
    }).catch(err => {
      console.error(err);
    })

    console.log(req.file); 
    
  })


  //============================LOGIN part=================================
  passport.serializeUser((user, done) => {
    console.log("from serial" + user._id);
    done(null, user._id)
  });

  passport.deserializeUser((_id, done) => {
    User.findUserById(_id, (err, user) => {
      console.log("from deserial" + _id);
      done(err, user)
    })
  })

  // passport strategy
  passport.use(new localStrategy({
    passReqToCallback: true
  }, (req, username, password, done) => {
    // findUser(username, password, done)
    User.findUserByUsername(username, (err, user) => {
      if(err) return done(err);
      if(!user){
        console.log("Invalid username");
        return done(null, false, {message: "Invalid username"});
      }
      User.comparePassword(password, user.password, (err, isMatch) => {
        if(err) return done(err);
        if(!isMatch){
          console.log("Incorrect password");
          return done(null, false, {message: "Incorrect password"});
        }
        console.log("successfully logged in");
        return done(null, user);
      })
    })
  }
  ))

  //=====================login post method===================
  router.post('/login', passport.authenticate('local', {failureFlash: "Invalid username or password", failureRedirect: "/users/login"}),
  (req, res) => {
    req.flash('success', "You've logged in successfully");
    console.log(req.user);
    console.log(req.session);
    res.location('/')
    res.redirect('/');
  })

  //===================log out method======================
  router.get('/logout', (req, res) => {
    req.logout();
    console.log(req.session);
    req.flash('success', "You've successfully logged out")
    res.redirect('/');
  })

}).catch(err => {
  console.error(err);
})




module.exports = router;