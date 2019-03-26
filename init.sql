CREATE TABLE `BOOK` (
  `Isbn` varchar(10) NOT NULL,
  `Title` varchar(300) NOT NULL,
  `Cover` varchar(100) NOT NULL,
  `Publisher` varchar(100),
  `Pages` smallint,
  PRIMARY KEY (`Isbn`)
);

CREATE TABLE `AUTHORS` (
  `Author_id` smallint NOT NULL AUTO_INCREMENT,
  `Name` varchar(60) NOT NULL,
  PRIMARY KEY (`Author_id`)
);

CREATE TABLE `BOOK_AUTHORS` (
  `Book_author_id` smallint NOT NULL AUTO_INCREMENT,
  `Author_id` smallint NOT NULL,
  `Isbn` varchar(10) NOT NULL,
  PRIMARY KEY (`Book_author_id`)
);

CREATE TABLE `BORROWER` (
  `Card_id` varchar(8) AUTO_INCREMENT NOT NULL,
  `Ssn` varchar(11) UNIQUE NOT NULL,
  `First_name` varchar(40) NOT NULL,
  `Last_name` varchar(40) NOT NULL,
  `Email` varchar(60) NOT NULL,
  `Address` varchar(100) NOT NULL,
  `City` varchar(50) NOT NULL,
  `State` varchar(50) NOT NULL,
  `Phone` varchar(20) NOT NULL,
  `Date`  datetime DEFAULT NOW(), 
  PRIMARY KEY (`Card_id`)
);

CREATE TABLE `BOOK_LOANS` (
  `Loan_id` int NOT NULL AUTO_INCREMENT,
  `Card_id` varchar(8) NOT NULL,
  `Isbn` varchar(10) NOT NULL,
  `Date_out` datetime DEFAULT NOW(),
  `Due_date` datetime,
  `Date_in` datetime,
   PRIMARY KEY (`Loan_id`)
);

CREATE TRIGGER due_date_trigger BEFORE INSERT ON `book_loans` 
FOR EACH ROW SET
    NEW.Due_date = TIMESTAMPADD(DAY, 14, NOW());

CREATE TABLE `FINES` (
  `Fine_id` int NOT NULL AUTO_INCREMENT,
  `Loan_id` int NOT NULL,
  `Fine_amount` double DEFAULT 0 NOT NULL,
  `Paid` tinyint DEFAULT 0 NOT NULL,
   PRIMARY KEY (`Fine_id`)
);

ALTER TABLE book_authors ADD CONSTRAINT fk_author_id FOREIGN KEY (Author_id) REFERENCES authors(Author_id);
ALTER TABLE book_authors ADD CONSTRAINT fk_isbn_id FOREIGN KEY (Isbn) REFERENCES book(Isbn);
ALTER TABLE book_loans ADD CONSTRAINT fk_book_loan_card_id FOREIGN KEY (Card_id) REFERENCES borrower(Card_id);
ALTER TABLE book_loans ADD CONSTRAINT fk_book_loan_isbn_id FOREIGN KEY (Isbn) REFERENCES book(Isbn);
ALTER TABLE fines ADD CONSTRAINT fk_fines_loan_id FOREIGN KEY (Loan_id) REFERENCES book_loans(Loan_id);

CREATE VIEW book_view AS
SELECT book.Isbn, title, Cover, Publisher, Pages, GROUP_CONCAT(authors.name SEPARATOR ', ') as Authors FROM book 
JOIN book_authors ON book_authors.Isbn = book.Isbn JOIN authors ON book_authors.Author_id = authors.Author_id 
GROUP BY book_authors.Isbn;