import express from 'express';
import session from 'express-session';
import next from 'next';
import dotenv from 'dotenv';
import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import fetch from 'isomorphic-fetch';

dotenv.config();

const port = parseInt(process.env.PORT ?? '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

passport.use(new OAuth2Strategy(
  {
    authorizationURL: 'https://api.nightbot.tv/oauth2/authorize',
    tokenURL: 'https://api.nightbot.tv/oauth2/token',
    clientID: process.env.NIGHTBOT_CLIENT_ID,
    clientSecret: process.env.NIGHTBOT_CLIENT_SECRET,
    callbackURL: dev ? 'http://localhost:3000/auth/callback' : 'https://flygon.maybreak.com/auth/callback',
    scope: 'song_requests_queue',
  },
  function(accessToken, refreshToken, profile, cb) {
    return cb(null, { accessToken, refreshToken });
  }
));


const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
  },
};

app.prepare().then(async () => {
  try {
    const server = express();

    server.use(session(sessionConfig));
    server.use(passport.initialize());
    server.use(passport.session());

    passport.serializeUser((user, done) => {
      done(null, user);
    });
    
    passport.deserializeUser((user, done) => {
      done(null, user);
    });

    server.get('/auth', passport.authenticate('oauth2'));
    server.get('/auth/callback', passport.authenticate('oauth2', { failureRedirect: '/' }), function(_req, res) {
      res.redirect("/");
    });

    server.get('/login', (req, res) => handle(req, res));

    server.get('/logout', (req, res) => {
      req.logout();
      res.redirect('/login');
    });

    server.get('/playing', async (req, res) => {
      if (!req.isAuthenticated()) return res.status(500).send('Unauthorized');

      const response = await fetch('https://api.nightbot.tv/1/song_requests/queue', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${req.user.accessToken}`, 
        },
      });

      res.json(await response.json());
    });

    server.get('*', (req, res) => handle(req, res));

    server.use(function (err, req, res) {
      console.error(err);
      
      res.status(500);
      res.send("Oops, something went wrong.")
    });

    server.listen(3000, (err: Error): void => {
      if (err) throw err;

      console.log(`> Server listening on port ${port} (dev: ${dev})`); 
    });
  } catch(e) {
    console.error('Unable to start server, exiting...');
    console.error(e);
    process.exit();
  }
});