const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const dbConfig = require('./config/db_config.js')
const connection = mysql.createConnection(dbConfig)

const port = 8888

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended : false}))

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/public/html/main.html')
})

app.get('/game',(req,res)=>{
    res.sendFile(__dirname+'/public/game/NeptuneChat.html')
})

app.get('/board',(req,res)=>{
    res.sendFile(__dirname+'/public/html/board.html')
})

app.get('/board/create',(req,res)=>{
    res.sendFile(__dirname + '/public/html/board_create.html')
})

app.get('/board/:boardIds',(req,res)=>{
})

app.post('/board/create_process',(req,res)=>{
    connection.query(`INSERT INTO board (name, password, title, description, date) VALUES (?, MD5(?), ?, ?, NOW());`, [req.body.name, req.body.password, req.body.title, req.body.description],(err,results)=>{
        if(err){
            throw err
        }
        res.redirect(`/board/${results.insertId}`)
    })
})

app.listen(port,()=>{
    console.log('\u001b[1m', '\u001b[32m', 'Server is running on ' + port, '\u001b[0m')
})