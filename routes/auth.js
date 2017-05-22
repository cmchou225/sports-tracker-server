require('dotenv').config();

const ENV = process.env.NODE_ENV || 'development';
const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig[ENV]);

const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const dbUsers = require('../db/users')(knex);
const dbFavourites = require('../db/favourites')(knex);
const dbCards = require('../db/cards')(knex);

const router = express.Router();

module.exports = (function() {

  router.use((req, res, next) => {
    console.log('ROUTER MIDDLEWARE');
    const sessionUsername = req.session.username
    if(!sessionUsername)
      res.locals.user = null
    else { 
      let user = dbUsers.getUserByUserName(sessionUsername).then((result) => {
        console.log('Got here');
        res.locals.user = result;
        res.locals.username = result.Username;
      });
    }
    console.log(sessionUsername);
    next();
  });
  // Root page
  // router.get('/', (req, res) => {
  //   if(res.locals.user){
  //     res.redirect('/');
  //   } else {
  //     res.redirect('/login');
  //   }
  // });
  router.get('/', (req, res) => {
    console.log('wtff');
    res.sendFile('/build/index.html');
  });
  
  router.get('register', (req, res) => {
    if(res.locals.user){
      res.redirect('/');
      return;
    } else {
      let templateVars = { user: res.locals.user};
      res.render('urls_reg', templateVars);
      return;
    }
  });

  router.post('/register', (req, res) => {
    console.log(`request received`)
    const newUsername = req.body.username;
    console.log(newUsername);
    dbUsers.getUserByUserName(newUsername).then(result =>{
      if(!req.body.email || !req.body.password || !req.body.username){
        res.status(400).send('Please input both email and password. <a href="/register">Try again</a>');
        return;
      }
      else if(result[0]){
        res.status(400).send('Email entered already in use. Please <a href="/register">register</a> with another email');
      }

      else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          const username = req.body.username;
          const email = req.body.email;
          dbUsers.insertUser(username, email, hash)
          .then(()=> {
            console.log(dbUsers.getUserByUserName(username));
            req.session.username = req.body.username;
            res.redirect('/');
          });
        });
      }
    });
  });
  // LOGIN routes
  router.get('/login', (req, res) => {
    console.log(`request received`)
    if(res.locals.user){
      res.redirect('/');
      return;
    }
    res.render('/');
  });

  router.post('/login', (req, res, next) => {
    console.log('GOT TO LOGIN')
    let inputPw = req.body.password,
        inputUsername = req.body.username
    dbUsers.getUserByUserName(inputUsername).then((result) => {
      console.log(result)
      if(!result[0]){
        res.status(403)
        return Promise.reject({
          type: 403,
          message: `Account with email entered not found.`
        });
      } else {
        let registeredPw = result[0].password
        console.log(registeredPw);
        bcrypt.compare(inputPw, registeredPw, function(err, result){
          if(!result){
            res.status(401).send('incorrect username or password');
            return;
          } else {
            req.session.username = inputUsername;
            res.redirect('/');
          }
        });
      }
    }).catch(err => {
      console.log(err);
      res.redirect('/')
    });
  });

  //Logout route
  router.post('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
  });

  return router;
})();