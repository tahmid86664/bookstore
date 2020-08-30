var express = require('express');
const user = require('../models/user');
const cookieParser = require('cookie-parser');
var router = express.Router();

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const uri = "mongodb+srv://tahmid:526628Tahmid@test1.mbzeo.mongodb.net/bookstore?retryWrites=true&w=majority";
const client = new MongoClient(uri, {useNewUrlParser: true});
let bookCollection;

const global = require('../my_module/global');

router.use(cookieParser());
//try to store in cookie( the cart data actually)
router.use((req, res, next) => {
  
  if(global.addItemToCookie){
    let randomName = Math.random().toString().substring(2);
    let cookieName = "BN" + randomName; //BN are products that added(By Buynow)
    let cookie = req.cookies.$cookieName;
    res.cookie(cookieName, global.bookInfo, {maxAge: 9000000, httpOnly: false, secure: true})
    console.log("book added");
    global.addItemToCookie = false;
  }
  next();
});

client.connect().then((client) => {
  bookCollection = client.db("bookstore").collection("books");
  let commentCollection = client.db("bookstore").collection("comments");
  let temp_cartCollection = client.db("bookstore").collection("temp_cart");
  router.get('/', (req, res) => {
    bookCollection.find().count().then(cnt => {
      let books = bookCollection.aggregate([{$sample: {size: cnt}}]).toArray() // randomize the list
      .then(books => {
        console.log(req.user);
        console.log(req.session);
        res.render("index", {
          title: "Home",
          books: books
        })
      }).catch(err => { 
        console.log(err);
      })
    }).catch(err => {console.log(err);})
  });

  // ===============individual product show=================
  router.get('/products/show/:id', (req, res) => {
    let book = bookCollection.findOne(ObjectId(req.params.id))
      .then(book => {
        let comments = commentCollection.find({productId:req.params.id}).toArray().then(cmnt => {
          console.log(cmnt);
          res.render("product", {
            title: "Show Product",
            book: book,
            comments: cmnt
          })
        }).catch(err => console.error(err))
        // console.log(book)
      }).catch(err => {
        console.log(err);
      })
  });

  // =================== Add to cart=================================
  router.post("/products/show/:id/addtocart", (req, res) => {
    if(!req.body.qty){
      req.flash("error", "Please fill Qty. field")
      res.redirect("/products/show/"+req.params.id);
    }else{
      let book = bookCollection.findOne(ObjectId(req.params.id))
        .then(book => {
          if(!global.addItemToCookie){
            // need to add item to cart but as butnow
            global.bookInfo = {
              bookName: book.name,
              bookPrice: book.price,
              bookQty: req.body.qty
            }
            global.addItemToCookie = true; // give permission to save in cookies
            res.redirect("/products/show/"+req.params.id+"/addtocart");
            console.log("item added to cookie")
          }
        });
    }
  })
  router.get("/products/show/:id/addtocart", (req, res) => {
    req.flash("success", "Item is added to cart");
    res.redirect("/products/show/" + req.params.id);
  })


  //==================== Buy Now ============================
  router.post("/products/show/:id/buynow", (req, res) => {
    console.log(req.body.qty);
    // console.log(req.session.cookie);
    if(!req.body.qty){
      req.flash("error", "Please fill Qty. field")
      res.redirect("/products/show/"+req.params.id);
    }else{
      let book = bookCollection.findOne(ObjectId(req.params.id))
        .then(book => {
          if(!global.addItemToCookie){
            // need to add item to cart but as butnow
            global.bookInfo = {
              bookName: book.name,
              bookPrice: book.price,
              bookQty: req.body.qty
            }
            global.addItemToCookie = true;
            res.redirect("/products/show/"+req.params.id+"/buynow");
            console.log("item added to cookie")
          }
          


          // temp_cartCollection.findOne({ip: req.id}).then(result => {
          //   if(!result){
          //     console.log("not found");
          //     let tempCart = temp_cartCollection.insertOne({
          //       ip : req.ip,
          //       booksInfo:[{
          //         name: book.name,
          //         price: book.price,
          //         qty: req.body.qty
          //       }]
          //     }).then(result => {
          //       res.redirect("/cart");
          //     })
          //   }else{
          //     console.log("Found");
          //     temp_cartCollection.update({ip: req.ip}, {
          //       $push: {
          //         booksInfo : {
          //           name: book.name,
          //           price: book.price,
          //           qty: req.body.qty
          //         }
          //       }
          //     })
          //   }
          // }).catch(err => {
          //   console.error(err);
          // })
      })
    }
  })
  router.get("/products/show/:id/buynow", (req, res) => {
    res.redirect("/cart");
  })

  // ============question area==================
  router.post('/products/show/:id', (req, res) => {
    if(!req.user){
      req.flash("error", "You must be login to comment or ask")
      res.redirect('/users/login')
    }else{
      let question = req.body.question
      

      commentCollection.insertOne({
        question: question,
        person: req.user.username,
        personImage: req.user.profileImage,
        productId: req.params.id,
        date: new Date()
      }).then(result => {
        res.location('/products/show/' + req.params.id)
        res.redirect('/products/show/' + req.params.id);
      }).catch(err => {
        console.error(err);
      })
    }
  })



  
  //==================================== Cart ==============================
  router.get("/cart", (req, res) => {
    console.log(req.cookies)

    let items = {}
    for(let key in req.cookies){
      // console.log(key);
      if(key.substring(0,2) === "BN"){ // BN are products(By Buynow)
        items[key]= req.cookies[key]
      }
    }
    console.log(items);

    res.render("cart", {
      title: "Cart",
      items: items
    })
  })


  //================clear cart===================
  router.get("/cart/clear", (req, res) => {
    for(let key in req.cookies){
      if(key.substring(0,2) === "BN"){ // BN are products(By Buynow)
        res.clearCookie(key)
      }
    }
    req.flash("success", "Your cart is cleared")
    res.redirect("/cart");
  })

  // =====================decrease one product====================
  router.get("/cart/decrease/:objectId/:bookname/:bookprice/:qty", (req, res) => {
    console.log(req.params.objectId);
    console.log(req.params.bookname);
    console.log(req.params.bookprice);
    console.log(req.params.qty);
    if(req.params.qty > 1){
      global.bookInfo = {
        bookName: req.params.bookname,
        bookPrice: req.params.bookprice,
        bookQty: req.params.qty - 1
      }
      res.cookie(req.params.objectId, global.bookInfo,{maxAge: 9000000, httpOnly: false, secure: true});
      res.redirect("/cart/decrease");
      console.log("updated item");
    }else{
      req.flash("error", "You're trying to get less then one! If want to remove then please press remove button")
      res.redirect("/cart");
    }
  })
  router.get("/cart/decrease", (req, res) => {
    req.flash("success", "Cart has been changed");
    res.redirect("/cart");
  })

  // ===========================remove one product================
  router.get("/cart/remove/:objectId", (req, res) => {      
    res.clearCookie(req.params.objectId);
    res.redirect("/cart/remove");
    console.log("updated cart");
  })
  router.get("/cart/remove", (req, res) => {
    req.flash("success", "Cart has been changed");
    res.redirect("/cart");
  })

  // client.close();
}).catch(error => {
  console.log(error);
});


module.exports = router;
