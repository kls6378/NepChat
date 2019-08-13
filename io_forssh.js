const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const sanitizeHtml = require('sanitize-html')
const compression = require('compression')
const helmet = require('helmet')

const port = 9999

app.use(helmet())
app.use(compression())

io.on('connection',(socket)=>{
    console.log(`${socket.id} connected`)
    socket.on('disconnect', ()=>{
        console.log(`${socket.id} disconnected`)
    })
    socket.on('userName', (val)=>{
        if(typeof(val) != String){
            val = val.toString()
        }
        val = val.trim()
        val = sanitizeHtml(val)
        socket.name = val
    })
    socket.on('msg',(val)=>{
        let msg
        
        console.log(`\nFrom client : ${val}`)

        try {
            msg = JSON.parse(val)
            msg['Message'] = msg['Message'].trim()
            msg['Message'] = sanitizeHtml(msg['Message'])
        } catch (error) {
            if(error instanceof SyntaxError){
                val = val.trim()
                val = sanitizeHtml(val)
                msg = {Sender: 'Guest', Message: val}
            }else{
                console.log(error)
                return false
            }
        }
        console.log('\nJSON parse result : ')
        console.log(msg)
        if(msg['Sender'] == 'None' || msg['Sender'] == ''){
            if(socket.name){
                msg['Sender'] = socket.name
            }else{
                msg['Sender'] = 'Guest'
            }
        }
        if(msg == undefined){
            msg = {Sender: 'Guest', Message: val}
        }
        if(msg['Message'] == ''){
            return false
        }
        console.log('\nSend message : ')
        console.log(msg)
        socket.broadcast.emit('msg',msg)
        socket.emit('msgM',msg)
    })
})

http.listen(port, () => {
    console.log('\u001b[1m', '\u001b[32m', 'Server is running on ' + port, '\u001b[0m')
})
