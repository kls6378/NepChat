const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const compression = require('compression')
const helmet = require('helmet')

const port = 9999

app.use(helmet())
app.use(compression())

io.on('connection',(socket)=>{
    console.log(`${socket.id} connected`)
    socket.on('disconnect', ()=>{
        io.emit('chatExit',socket.name)
        console.log(`${socket.id} disconnected`)
    })
    socket.on('userName', (val)=>{
        socket.name = val
        io.emit('chatEnter',val)
    })



    socket.on('msg',(val)=>{
        val = JSON.parse(val)
        console.log(val)
        if(val['Sender'] == 'None' || val['Sender'] == ''){
            val['Sender'] = socket.name
        }
        socket.broadcast.emit('msg',val)
        socket.emit('msgM',val)
    })
})

http.listen(port, () => {
    console.log('\u001b[1m', '\u001b[32m', 'Server is running on ' + port, '\u001b[0m')
})