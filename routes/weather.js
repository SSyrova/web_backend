var express = require('express');
var router = express.Router();
var http = require('http');
var https = require('https');

var pgp = require('pg-promise')({})
const cn = {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'PjWfjSg4M',
    max: 10
};
var db = pgp("postgres://postgres:PjWfjSg4M@localhost:5432/postgres");

db.one("CREATE TABLE IF NOT EXISTS favorites (id SERIAL PRIMARY KEY, lat varchar, lng varchar)");

const apiKey = "6d2a4733147114b53616a260387a5b83";

router.get('/weather/city', function (req, res, next) {
    var options = {
        host: "parseapi.back4app.com",
        headers: {
            'X-Parse-Application-Id': 'mxsebv4KoWIGkRntXwyzg6c6DhKWQuit8Ry9sHja',
            'X-Parse-Master-Key': 'TpO0j3lG2PmEVMXlKYQACoOXKQrL3lwM0HwR9dbH',
        },
        path: "/classes/City?limit=20&keys=name,country.name,location&where=" + encodeURIComponent(JSON.stringify({
            "name": {
                "$regex": req.query.name
            }
        }))
    };
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", 'origin, content-type, accept');
    https.get(options, function (response) {
        response.on('data', function (data) {
            res.send(data);
        });
    });
});

router.get('/weather/coordinates', function (req, res, next) {
    var options = {
        host: "api.openweathermap.org",
        path: "/data/2.5/weather?units=metric&lang=ru&lat=" + req.query.lat + "&lon=" + req.query.lng + "&appid=" + apiKey
    };
    https.get(options, function (response) {
        response.on('data', function (data) {
            res.send(data);
        });
    });
});

router.delete('/favourites', function (req, res, next) {
    db.result("DELETE FROM favorites WHERE id IN (SELECT id FROM favorites WHERE lat = $1 AND lng = $2 LIMIT 1)", [req.query.lat, req.query.lng])
        .then(function (data) {
            res.status(200).send({})
        })
        .catch(function (error) {
            res.status(500).send({})
        });
});

router.post('/favourites', function (req, res, next) {
    db.result("INSERT INTO favorites (lat, lng) VALUES ($1, $2)", [req.query.lat, req.query.lng])
        .then(function (data) {
            res.status(200).json({})
        })
        .catch(function (error) {
            res.status(500).json({})
        });
});

var QRE = pgp.errors.QueryResultError;
var qrec = pgp.errors.queryResultErrorCode;

router.get('/favourites', function (req, res, next) {
    db.many("SELECT lat, lng FROM favorites")
        .then(function (data) {
            res.json(data);
        })
        .catch(function (error) {
            if (error instanceof QRE && error.code === qrec.noData) {
                res.status(200).json([])
            } else {
                res.status(500).json({})
            }
        })
});

module.exports = router;