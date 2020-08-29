var express = require('express');
const cookieParser = require('cookie-parser');
var router = express.Router();

const passport = require('passport');
const {check, validationResult, query} = require('express-validator');
const global = require('../my_module/global');
const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://tahmid:526628Tahmid@test1.mbzeo.mongodb.net/bookstore?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
let bookCollection;

const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://tahmid:526628Tahmid@test1.mbzeo.mongodb.net/bookstore?retryWrites=true&w=majority");
const db = mongoose.connection;
const adminSchema = new mongoose.Schema({
  username : {
    type: String
  },
  password : {
    type: String
  }
},{collection: 'admin'})
const admin = mongoose.model('admin', adminSchema);

router.get('/', (req, res) => {
  res.render('admin', {
    title: "Admin Login"
  })
})

// router.get('/manage', (req, res) => {
//   res.render('manage', {
//     title: "Manage"
//   })
// })

router.get('/manage/add_book', (req, res) => {
  res.render('add_book', {
    title: "Add Book"
  })
});

client.connect().then(client => {
  console.log('Connected with the database');
  bookCollection = client.db('bookstore').collection('books');
  // =====================Add Book==============
  router.post('/manage/add_book', global.upload, [
    check("book_name", "Book name is required").notEmpty(),
    check("writer_name", "Writer name is required").notEmpty(),
    check("description", "Your book must have a description").notEmpty(),
    check("book_price", "Book must have a price").notEmpty()
  ], (req, res) => {
    let errors = validationResult(req);
    console.log(errors.mapped())
    if( !errors.isEmpty() ){
      res.render("add_book", {
        title: "Add Book",
        errors: errors.mapped()
      })
      return;
    }

    // collecting data from form
    let bookName =  req.body.book_name;
    let writerName =  req.body.writer_name;
    let bookDescription =  req.body.description;
    let bookPrice = req.body.book_price;

    // work with image
    let bookCover;
    // validation
    if(!req.file) {
      bookCover = "no-image.png"
    }else{
      let bookCoverOriginalName = req.file.originalname;
      let bookCoverPath = req.file.path;
      let bookCoverMime = req.file.mimetype;
      let bookCoverSize = req.file.size;
      bookCover = req.file.filename;
    } 
    

    bookCollection.insertOne({
      name: bookName.trim(),
      writer: writerName.trim(),
      description: bookDescription.trim(),
      price: parseFloat(bookPrice.trim()),
      book_cover: bookCover
    }).then(result => {
      req.flash("success", "Book has been added successfully")
      res.location('/admin/manage/add_book');
      res.redirect('/admin/manage/add_book');
    }).catch(err => console.log(err))
  })

  // =============================Admin login======================
  // make authenticated
  router.post('/', (req, res) => {
    console.log(req.body.username)
    console.log(req.body.password)
    let query = {username:req.body.username}
    admin.findOne(query, (err, _admin) => {
      if(err) console.error(err);
      else{
        if(!_admin){
          console.log("You're not admin")
          req.flash("error", "Invalid admin")
          res.render('admin', {
            title: "Admin Login"
          })
        }else{
          if(req.body.password !== _admin.password){
            console.log("not match")
            req.flash("error", "Incorrect password")
            res.render('admin', {
              title: "Admin Login"
            })
          }else{
            req.flash("success", "Successfully logged in");
            // res.location("/admin/manage");
            // res.redirect("/admin/manage");
            res.render("manage", {
              title: "Manage"
            })
          }
        }
      }
    })
  })

  // client.close(); // closing the database
}).catch(error => {
  console.log(error)
})

/* GET home page. */

module.exports = router;
