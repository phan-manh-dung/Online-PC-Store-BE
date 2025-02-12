const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const router = require('./router');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

dotenv.config();
const app = express();
const server = http.createServer(app);

// Middleware để truyền io vào req
app.use((req, res, next) => {
    next();
});

const PORT = process.env.PORT_USER_SERVICE || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));

app.use(bodyParser.json());
app.use(cookieParser());

router(app);

mongoose
    .connect(`${process.env.MONGO_DB}`)
    .then(() => {
        console.log('Connect to Database success');
    })
    .catch(() => {
        console.log('Connect database ERROR');
    });

// port 4000
server.listen(PORT, () => {
    console.log('Server on running port', +PORT);
});

module.exports = { app };