const express = require('express')
const app = express()

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

app.listen(8888,()=>{
    console.log('Server is running...')
})