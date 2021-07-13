const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const exphbs = require("express-handlebars");
const api = require("./api");
const MongoClient = mongodb.MongoClient;
const { MongoMemoryServer } = require('mongodb-memory-server');

const mongoServer = new MongoMemoryServer({ debug: true });

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";

const memoryMongo = process.env.MEMORY_MONGO

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main", layoutsDir: `${__dirname}/views/layouts` }));
app.set("view engine", "handlebars");
app.set("views", __dirname + "/views/");

(async function () {
    
    const mongoURI = memoryMongo ? await mongoServer.getUri() : process.env.MONGO_URL
    const mongoDB = memoryMongo ? await mongoServer.getDbName() : process.env.MONGO_DB
    
    MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true }, (err, client) => {
        if (err) return console.error(err);
        app.listen(port, host, async () => {
            console.log("Listening on port " + port);
            app.use(api({ db: client.db(mongoDB) }));
            app.use((req, res) => {
                res.render("404");
            });
        });
    });
})();


