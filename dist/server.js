"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const next_1 = __importDefault(require("next"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
const passport_oauth2_1 = __importDefault(require("passport-oauth2"));
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
dotenv_1.default.config();
const port = parseInt((_a = process.env.PORT) !== null && _a !== void 0 ? _a : '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next_1.default({ dev });
const handle = app.getRequestHandler();
passport_1.default.use(new passport_oauth2_1.default({
    authorizationURL: 'https://api.nightbot.tv/oauth2/authorize',
    tokenURL: 'https://api.nightbot.tv/oauth2/token',
    clientID: process.env.NIGHTBOT_CLIENT_ID,
    clientSecret: process.env.NIGHTBOT_CLIENT_SECRET,
    callbackURL: dev ? 'http://localhost:3000/auth/callback' : 'https://flygon.maybreak.com/auth/callback',
    scope: 'song_requests_queue',
}, function (accessToken, refreshToken, profile, cb) {
    return cb(null, { accessToken, refreshToken });
}));
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
        const server = express_1.default();
        server.use(express_session_1.default(sessionConfig));
        server.use(passport_1.default.initialize());
        server.use(passport_1.default.session());
        passport_1.default.serializeUser((user, done) => {
            done(null, user);
        });
        passport_1.default.deserializeUser((user, done) => {
            done(null, user);
        });
        server.get('/auth', passport_1.default.authenticate('oauth2'));
        server.get('/auth/callback', passport_1.default.authenticate('oauth2', { failureRedirect: '/' }), function (_req, res) {
            res.redirect("/");
        });
        server.get('/login', (req, res) => handle(req, res));
        server.get('/logout', (req, res) => {
            req.logout();
            res.redirect('/login');
        });
        server.get('/playing', async (req, res) => {
            if (!req.isAuthenticated())
                return res.status(500).send('Unauthorized');
            console.log(req.user.accessToken);
            const response = await isomorphic_fetch_1.default('https://api.nightbot.tv/1/song_requests/queue', {
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
            res.send("Oops, something went wrong.");
        });
        server.listen(3000, (err) => {
            if (err)
                throw err;
            console.log(`> Server listening on port ${port} (dev: ${dev})`);
        });
    }
    catch (e) {
        console.error('Unable to start server, exiting...');
        console.error(e);
        process.exit();
    }
});
//# sourceMappingURL=server.js.map