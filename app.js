require('dotenv').config()
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const app=express();
const mongoose = require('mongoose');
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const findOrCreate=require("mongoose-findorcreate");
const GoogleStrategy = require('passport-google-oauth20').Strategy;

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "Our little secret",
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());


const userSchema=new mongoose.Schema({username:String,password:String,googleId:String,secret:String});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

mongoose.connect('mongodb://localhost:27017/UserDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
app.post("/register",function(req,res)
{
  User.register({username:req.body.username},req.body.password,function(err,user)
{
  if(err)
  {
    console.log(err);
    res.redirect("/register");
  }
  else
  {
    passport.authenticate("local")(req,res,function()
  {
    res.redirect("/login");
  })
  }
});
});
app.post("/login",function(req,res){
  const user=new User({username:req.body.username,password:req.body.password});
  req.login(user,function(err){
  if(err)
  {
    console.log(err);
  }
  else
  {
    passport.authenticate("local")(req,res,function(){
      res.redirect("/secrets");
    })
  }
});
});
app.post("/submit",function(req,res){
  const secret=req.body.secret;
  User.findById(req.user.id,function(err,foundUser){
    if(err)
    {
      console.log(err);
    }
    else
    {
      if(foundUser){
        foundUser.secret=secret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  })
})
app.get("/",function(req,res){
  res.render("home.ejs");
});

app.get('/auth/google',passport.authenticate('google', { successRedirect: '/secrets',scope:
  [ 'profile' ]
}));

app.get('/auth/google/secrets', passport.authenticate('google', { failureRedirect: '/login' }),function(req, res) {
  // Successful authentication, redirect to secrets.
  res.redirect('/secrets');
});

app.get("/login",function(req,res){
  res.render("login.ejs");
});

app.get("/secrets",function(req,res){
  if(req.isAuthenticated())
  {
    User.find({"secret":{$ne:null}},function(err,foundUsers){
      if(err)
      {
        console.log(err);
      }
      else
      {
        if(foundUsers){
          res.render("secrets.ejs",{usersWithSecrets:foundUsers})
        }
      }
    });
  }
  else
  {
    res.redirect("/login");
  }
});
app.get("/submit",function(req,res){
  if(req.isAuthenticated())
  {
    res.render("submit.ejs");
  }
  else
  {
    res.redirect("/login");
  }
});

app.get("/logout",function(req,res){
  req.session.destroy((err) => {
	if(err)
  {
    return next(err);
  }
  else
  {
    req.logout();
    res.redirect("/");
  }
});
});

app.get("/register",function(req,res){
  res.render("register.ejs");
});

app.listen(process.env.PORT || 3000, function()
{
  console.log("server started at port 3000");
});
