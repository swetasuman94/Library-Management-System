const mysql = require('mysql');

const db = mysql.createConnection ({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'library'
});

// connect to database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;


var async = require("async");

module.exports.User = {
    addBookData: function(books, globalcallback) {
        async.forEachOf(books, function (value, key, callback) {
            async.parallel({
                addBook: function(cb) {
                    db.query("INSERT INTO BOOK (Isbn, Title, Cover, Publisher, pages) VALUES ( ?, ?, ?, ?, ?)", [value.isbn, value.title, value.cover, value.publisher, value.pages], function(err,result){
                        console.log('err', err);
                        cb(result);
                    });
                },
                addAuthor: function(cb) {
                    var authors = value.author.split(',');
                    async.forEachOf(authors, function (author, key, cbb) {
                        async.waterfall([
                            function(c) {
                                db.query("INSERT INTO authors (Name) select ? " +
                                "WHERE (Select count(*) from authors where name = ?) < 1;", [author, author], function(err,result){
                                    console.log('err', err);
                                    c(null);
                                });
                            },
                            function(c) {
                                db.query("Select Author_id from authors where name = ?;", [author], function(err,result){
                                    console.log('err', err);
                                    c(null, result[0].Author_id);
                                });
                            },
                            function(id, c) {
                                db.query("INSERT INTO BOOK_AUTHORS (Author_id, Isbn) VALUES (?, ?)", [id, value.isbn], function(err,result){
                                    console.log('err', err);
                                    c(null, 'done');
                                });
                            }
                        ], function (err, result) {
                            // result now equals 'done'
                            cbb(null, result);
                        });
                    }, function (err, result) {
                        if (err) console.error(err);
                        cb(null, result);
                    });
                }
            }, function(err, results) {
                console.log(results);
                callback(null, results);
            });
        }, function (err, result) {
            if (err) console.error(err);
            globalcallback("done");
        });
    },
    addBorrower: function(b, callback) {
        async.waterfall([
            function(cb) {
                db.query("SELECT SUBSTRING(Card_id, 4) as prevId FROM borrower ORDER BY date desc LIMIT 1", [], function(err,result){
                    if (err) cb(err)
                    else if ( result.length > 0 ) {
                        cb(null, parseInt(result[0].prevId) + 1);
                    } else {
                        cb(null, 1);
                    }
                });
            },
            function(id, cb) {
                var card_id = b.fname.charAt(0) + "x" + b.lname.charAt(0) + id; 
                db.query("INSERT INTO BORROWER (`Card_id`, `Ssn`, `First_name`, `Last_name`, `Email`, `Address`, `City`, `State`, `Phone`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
                [card_id, b.ssn, b.fname, b.lname, b.email, b.address, b.city, b.state, b.phone ], function(err,result){
                    if (err) cb(err);
                    else cb(null, 'Successfully added ' + b.fname + " " + b.lname + " as borrower with membership number " + card_id + ".");
                });
            }
        ], function (err, result) {
            if ( err ) callback("SSN already exist. Enter correct SSN.");
            else callback(result);
        }); 
    }
}

module.exports.Library = {
    book_search: function(obj, callback){
        var searchKey = "%" + obj.keyword + "%";
        db.query("SELECT b.Isbn, title, Cover, Publisher, Pages, Authors, book_loans.Isbn as Loanable, (SELECT COUNT(*) FROM book_view WHERE TITLE LIKE ? OR authors LIKE ?  OR b.Isbn = ?) AS total FROM book_view b " +
        "LEFT JOIN book_loans ON book_loans.Isbn = b.Isbn AND book_loans.Date_in IS NULL " +
        "WHERE TITLE LIKE ? OR authors LIKE ?  OR b.Isbn = ? LIMIT ?, 10;", [searchKey, searchKey, obj.keyword, searchKey, searchKey, obj.keyword, obj.offset], function(err,result){
            if (err) callback(err)
            else {
                callback(result);
            } 
		});
    },
    check_out: function(value, callback) {
        
        async.waterfall([
            function(cb) {
                db.query("SELECT count(*) as book_count, b.Isbn FROM BOOK_LOANS as a LEFT JOIN BOOK_LOANS as b ON b.isbn = ? AND b.Date_in IS NULL Where a.Date_in IS NULL AND a.Card_id = ?", [value.isbn, value.cardid], function(err,result){
                    if (err) cb(err)
                    if ( result.length > 0 && (result[0].book_count == 3 || result[0].Isbn != null)) {
                        if ( result[0].book_count == 3 ) {
                            cb("Book limit for User is 3.");
                        } else {
                            cb("Book is already checked out from library.");
                        }
                    } else {
                        cb(null, null);
                    }
                });
            },
            function(e, cb) {
                db.query("INSERT INTO BOOK_LOANS (`Card_id`, `Isbn`) VALUES (?, ?)", 
                [value.cardid, value.isbn ], function(err,result){
                    if (err) cb(err);
                    else cb(null, 'Successfully checked out the book.');
                });
            }
        ], function (err, result) {
            callback(err, result);
        }); 
    },
    search_checked_out_book: function(searchKey, callback) {
        db.query("SELECT book_loans.Loan_id, book_loans.Card_id, book_loans.Isbn, book_loans.Due_date, book_loans.Date_out, borrower.First_name, " +
        "borrower.Last_name, fines.Fine_amount, book.Title, book.Cover FROM book_loans " + 
        "JOIN borrower ON borrower.Card_id = book_loans.Card_id " + 
        "JOIN book ON book.Isbn = book_loans.Isbn " +
        "LEFT JOIN fines ON  book_loans.Loan_id = fines.Loan_id " +
        "WHERE book_loans.Date_in IS NULL AND (book_loans.Card_id = ? OR book_loans.Isbn = ? OR borrower.First_name LIKE ? OR borrower.Last_name LIKE ?)", [searchKey, searchKey, "%"  + searchKey + "%",  "%"  + searchKey + "%"], function(err, result) {
            if (err) callback(err);
            else callback(result);
        })
    },
    check_in: function(value, callback) {
        async.parallel({
            checkin: function(cb) {
                if ( value.chkin == 1) {
                    db.query("UPDATE book_loans SET Date_in = ? WHERE Loan_id = ?", [new Date(), value.loanid], function(err,result){
                        if (err) cb(err);
                        else cb(null, result);
                    });
                } else {
                    cb(null);
                }
            },
            payfine: function(cb) {
                if ( value.pay == 1) {
                    db.query("UPDATE fines SET Paid = 1 WHERE Loan_id = ?", [value.loanid], function(err,result){
                        if (err) cb(err);
                        else cb(null, result);
                    });
                } else {
                    cb(null);
                }
            }
        }, function(err, results) {
            if (err) callback(err)
            else callback(null, results);
        });
    },
    fine_data: function(paid, callback) {
        db.query("SELECT sum(Fine_amount) as Fine, Paid, Card_id FROM fines f " +
        "INNER JOIN book_loans b ON b.Loan_id = f.Loan_id WHERE Paid = ? GROUP BY Card_id;", [paid], function(err,result){
            if (err) callback(err);
            else callback(null, result);
        });
    },
    fine_update: function(callback) {
        async.parallel({
            update: function(cb) {
                db.query("UPDATE fines INNER JOIN book_loans " +
                "ON fines.Loan_id = book_loans.Loan_id " +
                "SET fines.Fine_amount = DATEDIFF(IF(Date_in IS NULL, now(), Date_in), Due_date)*0.25 " +
                "WHERE DATE(book_loans.Due_date) < DATE(now()) && fines.Paid = 0", [], function(err,result){
                    if (err) cb(err);
                    else cb(null, result);
                });
            },
            insert: function(cb) {
                db.query("INSERT INTO fines (Loan_id, Fine_amount, Paid) " + 
                "SELECT Loan_id, DATEDIFF(IF(Date_in IS NULL, now(), Date_in), Due_date)*0.25, 0 from book_loans " +
                "WHERE book_loans.Loan_id NOT IN (Select Loan_id from fines) " +
                "AND DATE(book_loans.Due_date) < DATE(now());", [], function(err,result){
                    if (err) cb(err);
                    else cb(null, result);
                });
            }
        }, function(err, results) {
            if (err) callback(err)
            else callback(null, results);
        });
    },
    check_for_books: function(id, cb) {
        db.query("SELECT count(*) as count FROM book_loans WHERE Card_id = ? AND Date_in IS NULL;", [id], function(err,result){
            if (err) cb(JSON.stringify(err));
            else if ( result[0].count == 0) {
                db.query("UPDATE fines f SET Paid = 1 WHERE f.Loan_id IN " + 
                "(SELECT b.Loan_id FROM book_loans b WHERE b.Card_id = ?);", [id], function(err,result){
                    if (err) cb(err);
                    else cb("Fines cleared for card no. " + id);
                });
            } else {
                cb("Please checkout all the books before clearing library fine for the borrower " + id + ".");
            }
        });
    },
}