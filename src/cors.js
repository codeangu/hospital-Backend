const express = require("express");
const cors = require("cors");
const app = express();

const whitelist = [
    "http://localhost:5000",
    "http://localhost:3000",
    "http://localhost:4200",
    "http://localhost:4300",
    "https://localhost:3443",
    "https://localhost:4500",
    "http://192.168.100.*",
    "https://hospital-backend-lmdb.vercel.app"

];

var corsOptionsDelegate = (req, callback) => {
    var corsOptions;
    console.log('req.header("Origin")', req.header("Origin"));
    if (whitelist.indexOf(req.header("Origin")) !== -1) {
        corsOptions = { origin: true };
    } else {
        corsOptions = { origin: false };
    }
    callback(null, corsOptions);
};

exports.cors = cors();
exports.corsWithOptions = cors(corsOptionsDelegate);