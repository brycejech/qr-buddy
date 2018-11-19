
'use strict';

const express      = require('express'),
      exphbs       = require('express-handlebars'),
      // cookie       = require('cookie'),
      // cookieParser = require('cookie-parser'),
      bodyParser   = require('body-parser'),
      path         = require('path');

// Server setup
const server = express();

server.set('case sensitive routing', true);
server.enable('trust proxy'); // If running behind Nginx proxy

server.use(express.static(path.join(__dirname, 'client')));

// Parse cookies, accept form data
// server.use(cookieParser());
server.use(bodyParser.json(), bodyParser.urlencoded({extended: true}));

// Remove "X-Powered-By" header
server.use((req, res, next) => {
    res.removeHeader('X-Powered-By');
    next();
});

// Handlebars setup
let hbs = exphbs.create({
    layoutsDir: path.join(__dirname, 'views/layouts/'),
    defaultLayout: 'main',
    extname: 'html' // Set the file extension type for looking up views
});
server.engine('.html', hbs.engine);
server.set('view engine', 'html');


// Render home page
server.get('/', (req, res, next) => {
    res.render('home');
});


// Mount routes
require('./routes')(server);


// Start server
server.listen(8000, () => { console.log('Server listening on 8000') });
