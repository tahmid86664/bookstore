const multer = require('multer');
const path = require('path');
const { type } = require('os');
const { Double } = require('mongodb');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./public/images/upload");
    },

    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})

const userProfileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./public/images/users/profile");
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})

module.exports.upload = multer({
    storage: storage
}).single('book_cover');

module.exports.uploadUserProfile = multer({
    storage: userProfileStorage
}).single('profile_image');


module.exports.addItemToCookie = false;

module.exports.bookInfo = {
    bookName: {
        type: String
    },
    bookPrice: {
        type: Double
    },
    bookQty: {
        type: Number
    }
}