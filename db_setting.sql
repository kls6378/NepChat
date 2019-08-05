CREATE DATABASE NepChat;

USE NepChat;

CREATE TABLE board(
    _id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(32) NOT NULL,
    password VARCHAR(32) NOT NULL,
    title TINYTEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL
);

CREATE TABLE comment(
    _id INT AUTO_INCREMENT PRIMARY KEY,
    boardId INT NOT NULL,
    name VARCHAR(32) NOT NULL,
    password VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL
);
