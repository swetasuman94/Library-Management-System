var express = require('express');
var models = require('./models.js');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var session = require('express-session');
var errorHandler = require('errorhandler');
var async = require('async');
var os = require("os");
var fs = require("fs");
var User = models.User;
var Library = models.Library;

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {layout: false});
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(session({ secret: 'ABC', 
                  saveUninitialized: true,
                  resave: true }));
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));
app.use(errorHandler({ dumpExceptions: true, showStack: true }));

// Routes
app.get('/', function(req,res){
	res.render("home");	
});

app.get('/home', function(req, res) {
    res.render("home");
});

app.get('/fines', function(req, res) {
    res.render("fines");
});


app.get('/fines/:flag', function(req, res) {
    Library.fine_data(req.params.flag, function(err, results){
        if ( err ) res.send(err);
		res.render("fine-results", {items: results});
	});
});

app.get('/checkin', function(req, res) {
    res.render("checkin");
});

app.get('/addborrower', function(req, res) {
    res.render("addborrower");
});

app.get('/books/:keyword/:offset', function(req,res){
    var obj = {};
    obj.keyword = req.params.keyword;
   
    obj.offset = parseInt(req.params.offset);
	Library.book_search(obj, function(results){     
		res.render("search-results", {items:results});
	});	
});

app.post("/borrower/add", function(req,res){
    var values = {};
    values.fname = req.body.fname;
    values.lname = req.body.lname;
	values.state = req.body.state;
	values.city = req.body.city;
	values.address = req.body.address;
    values.email = req.body.email;
    values.ssn = req.body.ssn;
    var ph = req.body.phone;
    values.phone = "(" + ph.substring(0,3) + ") " + ph.substring(3, 6)  +"-" + ph.substring(6)
	User.addBorrower(values, function(err, result){
        if ( err ) {
            res.send(err);
        } else
		    res.send(result);
	})
});

app.post("/checkout/book", function(req,res){
    var values = {};
    values.cardid = req.body.cardNum;
    values.isbn = req.body.isbn;

	Library.check_out(values, function(err, result){
        if ( err ) res.send(err); 
        else res.send(result);
	})
});

app.get('/searchCheckedInBooks/:keyword', function(req,res){
	Library.search_checked_out_book(req.params.keyword, function(results){
		res.render("checkin-search-results", {items:results});
	});	
});

app.post("/checkin/book", function(req,res){
	Library.check_in(req.body, function(err, result){
        if ( err ) res.send(err); 
        else res.send(result);
	})
});

app.get("/updatefine", function(req,res) {
	Library.fine_update(function(err, result) {
        if (err) res.send(err)
        else {
            Library.fine_data(0, function(err, results) {
                if (err) res.send(err);
                res.render("fine-results", {items: results});
            });
        }
	})
});

app.post("/checkforbooks", function(req,res){
    var cardid = req.body.cardid;

	Library.check_for_books(cardid, function(err, result){
        if ( err ) res.send(err); 
        else res.send(result);
	})
});
// fs.readFile('./books.csv', function(err, data) {
//     var wholefiledata = data.toString('utf8');
//     var booksdata = wholefiledata.split('\r\n');
//     var books = [];
//     for ( var i = 20001; i < 21001; i++ ) {
//         var bookdata = booksdata[i].split('\t');
//         var book = {};
//         book.isbn = bookdata[0];
//         book.title = bookdata[2];
//         book.author = bookdata[3];
//         book.cover = "http://covers.openlibrary.org/b/isbn/" + bookdata[0] + "-M.jpg";
//         book.publisher = bookdata[5];
//         book.pages = parseInt(bookdata[6]);
//         books.push(book);
//     }
//     User.addBookData(books, function(result){
//         console.log("done-----");
//     });
//     console.log(err);
// });

app.get("*", function(req,res){
	res.redirect("/404");
});

var port = 8080;
app.listen(port, function(){
    console.log("Server is running on port " + port);
});