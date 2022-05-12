const mongoose = require('mongoose');
const database = require('./configuration').mongodbURL;
const passportLocalMongoose = require('passport-local-mongoose');


mongoose.connect(database, {useNewUrlParser: true, useUnifiedTopology: true})
  .then( () => console.log('database connected...'))
  .catch( err => console.log(err));

var touristSchema = new mongoose.Schema({
 title: String,
 description: String,
 location: String,
 contact: String,
 gmail: String,
 facebook: String,
 instagram: String, 
 image: String
}, {timestamps: true});

var userSchema = new mongoose.Schema({
    username: String,
    password: String
},{timestamps: true});

userSchema.plugin(passportLocalMongoose);
 
const UserSchema = mongoose.model('User', userSchema);
const TouristSchema = mongoose.model('Tourist', touristSchema);


module.exports = { UserSchema, TouristSchema };