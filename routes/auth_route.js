const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');

const authRoute  = express.Router();
const app = express();

module.exports = function() {
  app.use(cookieSession({
    name: 'session',
    keys: ['Lighthouse'],
    maxAge: 24 * 60 * 60 * 1000
  }));
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    let user = knex('users').select('*').where({email: req.session.userEmail}).then((result) => {
      if(result) {
        res.locals.user = result;
        res.locals.email = result.email
      } else {
        res.locals.user = null;
      }
      next();
      })})
    
    // Root page
  app.get('/', (req, res) => {
    if(res.locals.user){
      res.redirect('/');
    } else {
      res.redirect('/login');
    }
  });

  //Registeration routes
  app.get('/register', (req, res) => {
    if(res.locals.user){
      res.redirect('/');
      return;
    } else {
      let templateVars = { user: res.locals.user};
      res.render('urls_reg', templateVars);
      return;
    }
  });

  app.post('/register', (req, res) => {
    const userID = helperFunc.genRanString();
    const newEmail = req.body.email;
    const userInDB = users.find((obj) => obj.email === newEmail);

    if(!newEmail || !req.body.password){
      res.status(400).send('Please input both email and password. <a href="/register">Try again</a>');
    }

    else if(userInDB){
      res.status(400).send('Email entered already in use. Please <a href="/register">register</a> with another email');
    }

    else {
      let newUser = {
        id: userID,
        email: req.body.email
        };
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        newUser.password = hash;
        users.push(newUser);
        req.session.userEmail = req.body.email;
        res.redirect('/urls');
      });

    }
  });
  // LOGIN routes
  app.get('/login', (req, res) => {
    if(res.locals.user){
      res.redirect('/');
      return;
    }
    res.render('urls_login');
  });

  app.post('/login', (req, res, next) => {
    let inputPw = req.body.password,
        inputEmail = req.body.email,
        userInDB = knex('users').select('*').where({email: req.body.email})
    if(!userInDB){
      res.status(403).send(`Account with email entered not found. <a href="/login">Try again</a>`);
    } else {
      let registeredPw = userInDB.password
      bcrypt.compare(inputPw, registeredPw, function(err, result){
        if(result){
          req.session.userEmail = inputEmail;
          res.redirect('/');
        } else{
          res.status(401).send(`Unable to log in. Email or password entered incorrectly. <a href="/login">Try again</a>`);
        }
      });
    }
  });

  //Logout route
  app.post('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
  });


}
}