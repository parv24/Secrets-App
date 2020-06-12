require('dotenv').config()
const express=require('express');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const app=express();
const mongoose = require('mongoose');
//const md5=require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;
//var encrypt = require('mongoose-encryption');

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended: true }));


const userSchema=new mongoose.Schema({username:String,password:String});
//const secret = process.env.SOME_LONG_UNGUESSABLE_STRING;
//userSchema.plugin(encrypt, { secret: secret ,encryptedFields:['password']});
const User = mongoose.model('User', userSchema);

mongoose.connect('mongodb://localhost:27017/UserDB', {useNewUrlParser: true, useUnifiedTopology: true});
app.post("/register",function(req,res)
{
  const userName=req.body.username;
  const pwd=req.body.password;
  User.findOne({username:userName},function(err,existingUser)
{
  if(!err)
  {
    if(existingUser)
    {
      console.log("You are already registered,please login");
      res.redirect("/login");
    }
    else
    {
      bcrypt.hash(pwd, saltRounds, function(err, hash) {
        const newUser=new User({username:userName,password:hash});
        newUser.save();
      });
      console.log("You are registered successfully,now please login");
      res.redirect("/login");
    }
  }
});
});
app.post("/login",function(req,res)
{
  const userName=req.body.username;
  const pwd=req.body.password;
  User.findOne({username:userName},function(err,existingUser)
{
  if(!err)
  {
    if(existingUser)
    {
      bcrypt.compare(pwd, existingUser.password, function(err, result) {
        if(result)
        {
          res.render("secrets.ejs");
        }
        else
        {
          console.log("Your password is incorrect,please try again");
          res.redirect("/login");
        }
      });
    }
    else
    {
      console.log("please register first");
      res.redirect("/register");
    }
  }
  else
  {
    console.log(err);
  }
});
});

app.get("/",function(req,res){
  res.render("home.ejs");
})
app.get("/login",function(req,res){
  res.render("login.ejs");
})
app.get("/register",function(req,res){
  res.render("register.ejs");
})

app.listen(process.env.PORT || 3000, function()
{
  console.log("server started at port 3000");
})
