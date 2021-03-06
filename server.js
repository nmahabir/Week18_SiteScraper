var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Handlebars
var exphbs = require("express-handlebars");


app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect(
  "mongodb://localhost/sitescraper",
  { useNewUrlParser: true }
);

// Routes


// A GET route to render the index

app.get("/", function(req, res) {
  res.render("index");
})

// A GET route for scraping the NYTimes website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.nytimes.com/section/travel").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // article.css-180b3ld
    // console.log(response.data);
    // 3Now, we grab every h2 within an article tag, and do the following:
    $(".story-body").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text()
        .trim();
      result.link = $(this)
        .children("a")
        .attr("href");
      result.summary = $(this)
        .children("summary")
        .text()
        .trim();
      console.log("Result: " + result);
    //   Create a new Article using the `result` object built from scraping
      db.article
        .create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          // console.log("DB Article: " + dbArticle);
          res.render("index", {articles: dbArticle})
        })
        // .catch(function(err) {
        //   // If an error occurred, send it to the client
        // res.json(err);
        // });
    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    // res.send("Scrape Complete");
    // res.render("index", {articles: dbArticle.title}, {summary: dbArticle.summary}, {link: dbArticle.link});
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  // db.Article.find({})
  //   .then(response => res.json(response))
  //   .catch(err => res.json(err));
  db.article
    .find({})
    .then(function(dbArticle) {
      res.render("index", {articles: dbArticle});
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
  db.article
    .find({ _id: req.params.id })
    // .then(response => res.json(response))
    // .catch(err => res.json(err));
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  db.note
    .create(req.body)
    .then(function(dbNote) {
      return db.article.findOneAndUpdate(
        {
          _id: req.params.id
        },
        {
          note: dbNote._id
        },
        {
          new: true
        }
      );
    })
    .catch(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
