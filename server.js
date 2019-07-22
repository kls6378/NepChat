const express = require('express')
const app = express()

const port = 8888

app.use(express.static('public'))

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/public/html/main.html')
})

app.get('/game',(req,res)=>{
    res.sendFile(__dirname+'/public/game/NeptuneChat.html')
})

app.get('/community',(req,res)=>{
    res.sendFile(__dirname+'/public/html/community.html')
})

app.listen(port,()=>{
    console.log('\u001b[1m', '\u001b[32m', 'Server is running on ' + port, '\u001b[0m')
})