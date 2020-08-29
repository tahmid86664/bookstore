const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://tahmid:526628Tahmid@test1.mbzeo.mongodb.net/bookstore?retryWrites=true&w=majority")
const db = mongoose.connection;

const userSchema = {
    name: {
        type: String
    },
    email: {
        type: String
    },
    username: {
        type: String
    },
    password: {
        type: String
    },
    profileImage: {
        type: String
    }
}

const User = module.exports = mongoose.model("User", userSchema);

module.exports.findUserByUsername = (username, callback) => {
    let query = {username: username};
    User.findOne(query, callback);
}

module.exports.findUserById = (id, callback) => {
    User.findById(id, callback)
}

module.exports.comparePassword = (givingPassword, passwordInDb, callback) => {
    if(givingPassword !== passwordInDb){
        console.log("Incorrect pass");
        callback(null, false);
      }
      else{
        callback(null, true);
      }
}
