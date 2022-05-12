var express = require('express');
var router = express.Router();
var path = require('path');
var multer = require('multer');
var fs = require('fs');
var  nodeMailer = require('nodemailer');

const passport = require('passport');
const passportLocal = require('passport-local');

const Tourist = require('../model/placesModel').TouristSchema;
const User = require('../model/placesModel').UserSchema;

passport.use(new passportLocal(User.authenticate()));

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads');
  },
  filename: function (req, file, cb) {
    let modifiedName = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    cb(null, modifiedName);
  }
});


var upload = multer({
  storage : storage,
  fileFilter: function (req, file, cb) {

    var filetypes = /jpeg|jpg|png|gif/;
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: File upload only supports the following filetypes - " + filetypes);
  }
 }).single('avatar');

/* POST add new Date page. */
router.post('/addNew', function(req, res){
  upload(req,res,function(err){
      if(err) throw err;  

        const newUser = new Tourist({
          title: req.body.title,
          contact: req.body.contact,
          description: req.body.description,
          location: req.body.location.toLowerCase(),
          gmail: req.body.gmail,
          facebook: req.body.facebook,
          instagram: req.body.instagram,
          image: req.file.filename
        });
       
        newUser.save()
          .then( ()=> res.redirect('/admin-create') )
          .catch(err => res.send(err));
  });
});


/* GET home page. */
router.get('/', function(req, res, next) {
  Tourist.find()
    .then( result => {
      let location = [];
      result.map(el => location.push(el.location) );
      let data = [...new Set(location)];
     
      console.log(data)

      res.render('index', {data})
    })
    .catch( err => res.send(err));  
});

/* GET admin_home page. */
router.get('/admin-home', isLoggedIn, function(req, res, next) {
  Tourist.find()
    .then(data => {
      res.render('admin_home', {data});
    })
    .catch(err => res.send(err));
  
});

/* GET admin_create page. */
router.get('/admin-create', isLoggedIn,  function(req, res, next) { 
  res.render('admin_addnew');
});

/* GET admin_update page. */
router.get('/admin-update', isLoggedIn, function(req, res, next) {
  Tourist.find()
    .then(data => {
      res.render('admin_update', {data});
    })
    .catch(err => res.send(err));
});

/* GET admin_login page. */
router.get('/admin-login',  function(req, res, next) {
  res.render('admin_login');
});

/* GET delete page. */
router.get('/delete/:id', isLoggedIn, function(req, res, next) {
  Tourist.findOneAndRemove({_id: req.params.id})
    .then( ()=> res.redirect('/admin-update') )
    .catch(err => res.send(err));
});

/* GET update_form page. */
router.get('/update/:id', isLoggedIn, function(req, res, next) {
  Tourist.findOne({_id: req.params.id})
  .then(data =>{ 
    console.log(data)
    res.render('update_form', {data});
  })
  .catch(err => res.send(err));
});

/* POST update page. */
router.post('/update/:id', isLoggedIn, function(req, res){
  upload(req,res,function(err){
      if(err) throw err;  
      var oldImage;
      Tourist.findOne({_id: req.params.id})
      .then( result => oldImage = result.image)
      .catch(err => res.send(err));

      let data= {
        title: req.body.title,
        contact: req.body.contact,
        description: req.body.description.toLowerCase(),
        location: req.body.location,
        gmail: req.body.gmail,
        facebook: req.body.facebook,
        instagram: req.body.instagram,
      };

      if(req.file) data.image = req.file.filename;

      Tourist.findOneAndUpdate({_id: req.params.id}, {$set: data }, {new: true})
        .then( () => {
          if(req.file) 
          fs.unlinkSync('./public/uploads/'+oldImage);
          res.redirect('/update/'+req.params.id);
        })
        .catch( err => res.send(err));
  });
});

/* post host-palce page. */
router.get('/host-place/:location', function(req, res, next) {
  Tourist.find({location: req.params.location})
    .then( data => {
      res.render('places', {data, place: req.params.location})})
    .catch( err => res.send(err));  
});

/* POST host-palce page. */
router.get('/host-place', function(req, res, next) {
  Tourist.find({location: req.query.city.toLowerCase()})
    .then( data => {
      res.render('places', {data, place: req.query.city.toLowerCase()})})
    .catch( err => res.send(err));  
});

router.post('/admin-login', passport.authenticate('local',{
  successRedirect: '/admin-home',
  failureRedirect: '/'
}), (req, res, next)=>{});

/* GET logout page. */
router.get('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()) return next();
  console.log('out!');
  res.redirect('/');
}

// POST register page.
// router.get('/register', (req, res) => {
//   const newUser = new User({
//     username: "prashu123"
//   });

//   User.register(newUser, "prashu123")
//     .then(user => {
//        res.send('Done!');
//     })
//     .catch( err => res.send(err));
// })

router.post('/send-email', function (req, res) {
  
  let transporter = nodeMailer.createTransport({
      service: 'gmail',
      auth: {
          user: 'prashunayak25@gmail.com',
          pass: 'nayak@1008'
      }
  });

  console.log(req.body.message);

  let mailOptions = {
      from: req.body.email, // sender address
      to: 'prashunayak25@gmail.com', // list of receivers
      subject: "Form Tourist Guide Application", // Subject line
      text: req.body.message
  };
  transporter.sendMail(mailOptions, (error, info) => {
      if (error) return res.send(error);
      res.redirect('/');
      });
  });

module.exports = router;
