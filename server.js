const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const sanitizeHtml = require('sanitize-html')
const MD5 = require('md5')
const compression = require('compression')
const helmet = require('helmet')

const dbConfig = require('./config/db_config.js')
const connection = mysql.createConnection(dbConfig)

const port = 8888

app.use(helmet())
app.use(compression())
app.use(express.static('public'))
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/html/main.html')
})

app.get('/download', (req, res) => {
    res.sendFile(__dirname + '/public/html/download.html')
})

app.get('/board', (req, res) => {
    connection.query(`SELECT * FROM board`, (err, result) => {
        if (err) {
            throw err
        }

        let html
        let list = ''

        for (let i = result.length - 1; i >= 0; i--) {
            if (sanitizeHtml(result[i].title) == '') {
                result[i].title += '걸러진 제목'
            }
            if (sanitizeHtml(result[i].name) == '') {
                result[i].name += '걸러진 이름'
            }
            if (sanitizeHtml(result[i].description) == ''){
                result[i].name += '걸러진 본문'
            }
            
            let description = result[i].description
            description = description.replace(/(?:\r\n|\r|\n)/g, '<br>')
            description = description.replace(/\s/g, '&nbsp;')
            list += `
            <div class="board">
                <a href="/board/${result[i]._id}">
                    <div class="content">
                        <div class="title">${sanitizeHtml(result[i].title.replace(/\s/g, '&nbsp;'))}</div>
                        <div class="name">${sanitizeHtml(result[i].name)}&nbsp;&nbsp;|&nbsp;&nbsp;</div>
                        <div class="date">${result[i].date}</div>
                        <div class="description">${description}</div>
                        <div class="commentCount"><i class="fa fa-commenting-o" aria-hidden="true"></i>&nbsp;&nbsp;${result[i].commentCount}</div>
                    </div>
                </a>    
            </div>
            `
        }

        html = `
        <!DOCTYPE html>
        <html>
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="./css/board.css">
            <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic&display=swap&subset=korean" rel="stylesheet">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
            <link rel="shortcut icon" href="./icon/favicon.ico">
            <link rel="icon" href="favicon.ico">
            <script src="http://localhost:9999/socket.io/socket.io.js"></script>
            <title>Board</title>
        </head>
        
        <body>
        <ul class="navUl">
            <li class="navLi title"><a href="#"><i class="fa fa-circle-o" aria-hidden="true"></i>&nbsp;&nbsp;자유 게시판</a></li>        
            <li class="navLi main hover"><a href="/"><i class="fa fa-home" aria-hidden="true"></i>&nbsp;&nbsp;메인</a></li>        
            <li class="navLi main hover"><a href="/download"><i class="fa fa-gamepad" aria-hidden="true"></i>&nbsp;&nbsp;다운로드</a></li>        
            <li class="navLi create hover"><a href="/board/create"><i class="fa fa-pencil" aria-hidden="true"></i>&nbsp;&nbsp;글작성</a></li>
        </ul>
        ${list}
        <div id="userSet">
            <div id="inputContainer">
                <h3>채팅방</h3>
                <input type="text" id="userNameInput" onkeydown="checkEnter('enterChat')" minlength=2 maxlength=8 placeholder="닉네임을 입력해주세요...">
                <input type="submit" id="submit" value="입장" onclick="enterChat()">
            </div>
        </div>
        <div id="chat">
            <div id="msgOutputDiv"></div>
            <div id="inputContainer">
                <input type="text" id="msgInput" onkeydown="checkEnter('sendMsg')" autofocus>
                <input type="submit" id="submit" value="전송" onclick="sendMsg()">
            </div>
        </div>
        <script>
            window.addEventListener('scroll', function() {
                let el = document.querySelector('.navUl')
                
                if(window.scrollY >= 60){
                    el.classList.add('fixed')
                }else {
                    el.classList.remove('fixed')
                }
            })
            const socket = io('http://localhost:9999')
            const userNameInput = document.getElementById('userNameInput')        
            const userSet = document.getElementById('userSet')        
            const chat = document.getElementById('chat')        
            const msgOutputDiv = document.getElementById('msgOutputDiv')
            const msgInput = document.getElementById('msgInput')        
            socket.on('connect', () => {
                console.log('서버 접속')
            })
            socket.on('msg', (msg) => {
                const message = document.createElement('div')
                message.innerHTML = msg["Sender"]+' : '+msg["Message"]
                message.style.padding = '5px'
                msgOutputDiv.appendChild(message)
                msgOutputDiv.scrollTop = msgOutputDiv.scrollHeight
            })
            socket.on('msgM', (msg) => {
                const message = document.createElement('div')
                message.innerHTML = msg["Sender"]+' : '+msg["Message"]
                message.style.color = 'blue'
                message.style.padding = '5px'
                msgOutputDiv.appendChild(message)
                msgOutputDiv.scrollTop = msgOutputDiv.scrollHeight
            })
            socket.on('chatEnter', (user)=>{
                const message = document.createElement('div')
                if(user == undefined){
                    message.innerHTML = 'Guest님이 입장하셨습니다.'
                }else{
                    message.innerHTML = user+'님이 입장하셨습니다.'
                }
                message.style.padding = '5px'
                message.style.textAlign = 'center'
                message.style.color = 'gray'
                msgOutputDiv.appendChild(message)
                msgOutputDiv.scrollTop = msgOutputDiv.scrollHeight
            })
            socket.on('chatExit', (user)=>{
                const message = document.createElement('div')
                if(user == undefined){
                    message.innerHTML = 'Guest님이 퇴장하셨습니다.'
                }else{
                    message.innerHTML = user+'님이 퇴장하셨습니다.'
                }
                message.style.padding = '5px'
                message.style.textAlign = 'center'
                message.style.color = 'gray'
                msgOutputDiv.appendChild(message)
                msgOutputDiv.scrollTop = msgOutputDiv.scrollHeight
            })

            function checkEnter(which) {
                if (event.keyCode == 13) {
                    if(which == 'enterChat'){
                        return enterChat()
                    }else{
                        return sendMsg()
                    }
                }
            }

            function enterChat(){
                if(userNameInput.value == '' || userNameInput.value.length <2){
                    alert('닉네임을 2자~8자로 입력해주세요.')
                }else{
                    let userName = userNameInput.value
                    socket.emit('userName', userName)
                    userNameInput.value = ''
                    userSet.style.display = 'none'
                    chat.style.display = 'block'

                }

            }

            function sendMsg() {
                let msg = msgInput.value
                if (msg) {
                    msg = '{"Sender": "", "Message": "'+msg+'"}'
                    socket.emit('msg', msg)
                    msgInput.value = ''
                }
            }
        </script>
        </body>
        </html>
        `
        res.send(html)
    })
})

app.get('/board/create', (req, res) => {
    res.sendFile(__dirname + '/public/html/board_create.html')
})

app.get('/board/create_process', (req, res) => {
    res.status(404).send('잘못된 접근입니다.')
})

app.get('/board/:boardId', (req, res) => {
    connection.query(`SELECT * FROM board`, (err, result) => {
        if (err) {
            throw err
        }

        let isExist = false

        for (let i = 0; i < result.length; i++) {
            if (req.params.boardId == result[i]._id) {
                isExist = true
                connection.query(`SELECT * FROM board WHERE _id = ?`, [req.params.boardId], (err, selectResult) => {
                    connection.query(`SELECT * FROM comment WHERE boardId = ?`, [req.params.boardId], (err, commentResult) => {
                        if (err) {
                            throw err
                        }

                        let htmlId
                        let htmlTitle
                        let htmlName
                        let htmlDate
                        let htmlDescription
                        let commentCount
                        let comment = ''
                        let html

                        if (sanitizeHtml(selectResult[0].title) == '') {
                            selectResult[0].title += '걸러진 제목'
                        }
                        if (sanitizeHtml(selectResult[0].name) == '') {
                            selectResult[0].name += '걸러진 이름'
                        }
                        if (sanitizeHtml(selectResult[0].description) == '') {
                            selectResult[0].description += '걸러진 본문'
                        }

                        htmlId = selectResult[0]._id
                        htmlTitle = selectResult[0].title
                        htmlName = selectResult[0].name
                        htmlDate = selectResult[0].date
                        htmlDescription = selectResult[0].description
                        commentCount = selectResult[0].commentCount

                        htmlTitle = htmlTitle.replace(/\s/g, '&nbsp;')
                        htmlDescription = sanitizeHtml(htmlDescription)
                        htmlDescription = htmlDescription.replace(/(?:\r\n|\r|\n)/g, '<br>')
                        htmlDescription = htmlDescription.replace(/\s/g, '&nbsp;')


                        for (let i = 0; i < commentResult.length; i++) {
                            let commentDescription = commentResult[i].description
                            commentDescription = sanitizeHtml(commentDescription)
                            commentDescription = commentDescription.replace(/(?:\r\n|\r|\n)/g, '<br>')
                            commentDescription = commentDescription.replace(/\s/g, '&nbsp;')
                            comment += `
                            <ul class="commentUl">
                                <div class="commentName_date_btn">
                                    <li class="comment commentName">${sanitizeHtml(commentResult[i].name)}</li>
                                    <li class="comment commentDate">${commentResult[i].date}</li>
                                    <li class="comment btn">
                                        <a href="/board/${htmlId}/comment/${commentResult[i]._id}/update"><i class="fa fa-pencil" aria-hidden="true"></i></a>
                                        &nbsp;&nbsp;
                                        <a href="/board/${htmlId}/comment/${commentResult[i]._id}/delete"><i class="fa fa-trash" aria-hidden="true"></i></a>
                                    </li>
                                </div>
                                <li class="comment commentDescription">${commentDescription}</li>
                            </ul>
                            `
                        }
                        html = `
                        <!DOCTYPE html>
                        <html>
                        
                        <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link rel="stylesheet" href="../css/board_read.css">
                        <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic&display=swap&subset=korean" rel="stylesheet">
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                        <link rel="shortcut icon" href="../icon/favicon.ico">
                        <link rel="icon" href="favicon.ico">
                        <title>${sanitizeHtml(htmlTitle)}</title>
                        </head>
                        
                        <body>
                        <ul class="navUl">
                            <li class="navLi title"><a href="#"><i class="fa fa-circle-o" aria-hidden="true"></i>&nbsp;&nbsp;자유 게시판</a></li>        
                            <li class="navLi list hover"><a href="/board"><i class="fa fa-list-ul" aria-hidden="true"></i>&nbsp;&nbsp;목록</a></li>
                            <li class="navLi delete hover"><a href="/board/${htmlId}/delete"><i class="fa fa-trash" aria-hidden="true"></i>&nbsp;&nbsp;삭제</a></li>
                            <li class="navLi update hover"><a href="/board/${htmlId}/update"><i class="fa fa-pencil" aria-hidden="true"></i>&nbsp;&nbsp;수정</a></li>
                        </ul>

                        <div class="board">
                            <div class="content">
                                <div id="htmlTitle">${sanitizeHtml(htmlTitle)}</div>  
                                <div class="name_date">  
                                    <div id="htmlName">${sanitizeHtml(htmlName)}&nbsp;&nbsp;|&nbsp;&nbsp;</div>
                                    <div id="htmlDate">${htmlDate}</div>
                                </div>
                                <div id="htmlDescription">${htmlDescription}</div>
                                <div>
                                <div class="commentContainer">
                                    <div id="commentCount">&nbsp;&nbsp;<i class="fa fa-commenting-o" aria-hidden="true"></i>&nbsp;&nbsp;댓글&nbsp;${commentCount}</div>
                                    <div id="htmlComment">${comment}</div>
                                </div>
                                <div class="inputContainer">
                                <form action="/board/${htmlId}/comment/create_process" method="POST">
                                    <div class="descriptionDiv gap">
                                        <span class="descriptionSpan">댓글 달기</span> <textarea name="description" id="description" minlength="4" maxlength="2000" placeholder="댓글..."></textarea>
                                    </div>
                                    <div id="notice">*비밀번호는 나중에 글을 수정 및 삭제 할때 사용될 정보입니다.*</div>
                                    <div class="name_password_submit">
                                        <div class="nameDiv gap">
                                            <div class="underline">
                                                <i class="fa fa-user" aria-hidden="true"></i>&nbsp;<input type="text" name="name" id="name" minlength="2" maxlength="8" placeholder="닉네임">
                                            </div>
                                        </div>
                                        <div class="passwordDiv gap">
                                            <div class="underline">
                                                <i class="fa fa-lock" aria-hidden="true"></i>&nbsp;<input type="password" name="password" id="password" minlength="8" maxlength="16" placeholder="비밀번호">
                                            </div>
                                        </div>
                                        <div class="submitDiv">
                                            <input type="submit" value="작성">
                                        </div>
                                    </div>
                                </form>
                                </div>
                            </div>
                        </div>
                        <script>
                            window.addEventListener('scroll', function() {
                                let el = document.querySelector('.navUl')
                                
                                if(window.scrollY >= 60){
                                    el.classList.add('fixed')
                                }else {
                                    el.classList.remove('fixed')
                                }
                            })
                        </script>
                        </body>
                        
                        </html>
                        `
                        res.send(html)
                    })
                })
                break
            }
        }

        if (isExist === false) {
            res.status(404).send('없는 페이지 입니다.')
        }

    })

})

app.get('/board/:boardId/update', (req, res) => {
    connection.query(`SELECT * FROM board`, (err, result) => {
        if (err) {
            throw err
        }

        let isExist = false

        for (let i = 0; i < result.length; i++) {
            if (req.params.boardId == result[i]._id) {
                isExist = true
                connection.query(`SELECT * FROM board WHERE _id = ?`, [req.params.boardId], (err, result) => {
                    if (err) {
                        throw err
                    }

                    let htmlId
                    let htmlTitle
                    let htmlDescription
                    let html

                    htmlId = result[0]._id
                    htmlTitle = result[0].title
                    htmlDescription = result[0].description
                    html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic&display=swap&subset=korean" rel="stylesheet">
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                        <link rel="stylesheet" href="../../css/update.css">
                        <link rel="shortcut icon" href="../../icon/favicon.ico">
                        <link rel="icon" href="favicon.ico">
                        <script src="../../js/submitFunc.js"></script>
                        <title>Update</title>
                    </head>
                    <body>
                    <ul class="navUl">    
                        <li class="navLi title"><a href="#"><i class="fa fa-circle-o" aria-hidden="true"></i>&nbsp;&nbsp;글수정</a></li>
                        <li class="navLi cancle hover"><a href="/board/${htmlId}"><i class="fa fa-times" aria-hidden="true"></i>&nbsp;&nbsp;취소</a></li>
                        <li class="navLi update hover"><a href="#" onclick="submitFunc()"><i class="fa fa-pencil" aria-hidden="true"></i>&nbsp;&nbsp;글수정</a></li>
                    </ul>
                    <div class="container">
                        <div id="notice">*글을 작성하실때 입력하신 비밀번호를 입력해주세요*</div>
                        <form id="myForm" action="/board/${htmlId}/update_process" method="POST">
                            <input type="hidden" name="id" value="${htmlId}">
                            <div class="passwordDiv gap">
                                <div class="underline">
                                    <i class="fa fa-lock" aria-hidden="true"></i>&nbsp;<input type="password" name="password" id="password" minlength="8" maxlength="16" placeholder="비밀번호">
                                </div>
                            </div>
                            <div class="titleDiv gap">
                                <input type="text" name="title" id="title" minlength="4" maxlength="80" placeholder="&nbsp;제목" value="${sanitizeHtml(htmlTitle)}">
                            </div>
                            <div class="descriptionDiv gap">
                                <span class="descriptionSpan">내용</span> <textarea name="description" id="description" minlength="4" maxlength="10000">${sanitizeHtml(htmlDescription)}</textarea>
                            </div>
                        </form>
                    </div>
                    </body>
                    </html>
                    `
                    res.send(html)
                })
                break
            }
        }

        if (isExist === false) {
            res.status(404).send('없는 페이지 입니다.')
        }
    })
})

app.get('/board/:boardId/update_process', (req, res) => {
    res.status(404).send('잘못된 접근입니다.')
})

app.get('/board/:boardId/delete', (req, res) => {
    connection.query(`SELECT * FROM board`, (err, result) => {
        if (err) {
            throw err
        }

        let isExist = false

        for (let i = 0; i < result.length; i++) {
            if (req.params.boardId == result[i]._id) {
                isExist = true
                connection.query(`SELECT * FROM board WHERE _id = ?`, [req.params.boardId], (err, result) => {
                    if (err) {
                        throw err
                    }

                    let htmlId
                    let html

                    htmlId = result[0]._id
                    html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic&display=swap&subset=korean" rel="stylesheet">
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                        <link rel="stylesheet" href="../../css/delete.css">
                        <link rel="shortcut icon" href="../icon/favicon.ico">
                        <link rel="icon" href="favicon.ico">
                        <script src="../../js/submitFunc.js"></script>
                        <title>Delete</title>
                    </head>
                    <body>
                    <ul class="navUl">    
                        <li class="navLi title"><a href="#"><i class="fa fa-circle-o" aria-hidden="true"></i>&nbsp;&nbsp;글삭제</a></li>
                        <li class="navLi cancle hover"><a href="/board/${htmlId}"><i class="fa fa-times" aria-hidden="true"></i>&nbsp;&nbsp;취소</a></li>
                        <li class="navLi delete hover"><a href="#" onclick="submitFunc()"><i class="fa fa-trash" aria-hidden="true"></i>&nbsp;&nbsp;글삭제</a></li>
                    </ul>
                    <div class="container">
                        <form id="myForm" action="/board/${htmlId}/delete_process" method="POST">
                            <input type="hidden" name="id" value="${htmlId}">
                            <div id="notice">*글을 작성하실때 입력하신 비밀번호를 입력해주세요*</div>
                            <div class="passwordDiv gap">
                                <div class="underline">
                                    <i class="fa fa-lock" aria-hidden="true"></i>&nbsp;<input type="password" name="password" id="password" minlength="8" maxlength="16" placeholder="비밀번호">
                                </div>
                            </div>
                        </form>
                    </div>
                    </body>
                    </html>
                    `
                    res.send(html)
                })
                break
            }
        }

        if (isExist === false) {
            res.status(404).send('없는 페이지 입니다.')
        }
    })
})

app.get('/board/:boardId/delete_process', (req, res) => {
    res.status(404).send('잘못된 접근입니다.')
})

app.get('/board/:boardId/comment/create_process', (req, res) => {
    res.status(404).send('잘못된 접근입니다.')
})

app.get('/board/:boardId/comment/:commentId/update', (req, res) => {
    connection.query(`SELECT * FROM comment`, (err, result) => {
        if (err) {
            throw err
        }

        let isExist = false

        for (let i = 0; i < result.length; i++) {
            if (req.params.commentId == result[i]._id) {
                isExist = true
                connection.query(`SELECT * FROM comment WHERE _id = ?`, [req.params.commentId], (err, result) => {
                    if (err) {
                        throw err
                    }

                    let boardId
                    let commentId
                    let commentDescription
                    let html

                    boardId = result[0].boardId
                    commentId = result[0]._id
                    commentDescription = result[0].description
                    html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic&display=swap&subset=korean" rel="stylesheet">
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                        <link rel="stylesheet" href="../../../../css/update.css">
                        <link rel="shortcut icon" href="../../../../icon/favicon.ico">
                        <link rel="icon" href="favicon.ico">
                        <script src="../../../../js/submitFunc.js"></script>
                        <title>Update</title>
                    </head>
                    <body>
                    <ul class="navUl">    
                        <li class="navLi title"><a href="#"><i class="fa fa-circle-o" aria-hidden="true"></i>&nbsp;&nbsp;댓글수정</a></li>
                        <li class="navLi cancle hover"><a href="/board/${boardId}"><i class="fa fa-times" aria-hidden="true"></i>&nbsp;&nbsp;취소</a></li>
                        <li class="navLi update hover"><a href="#" onclick="submitFunc()"><i class="fa fa-pencil" aria-hidden="true"></i>&nbsp;&nbsp;댓글수정</a></li>
                    </ul>
                    <div class="comment container">
                        <div id="notice">*댓글을 작성하실때 입력하신 비밀번호를 입력해주세요*</div>
                        <form id="myForm" action="/board/${boardId}/comment/${commentId}/update_process" method="POST">
                            <input type="hidden" name="id" value="${commentId}">
                            <div class="passwordDiv gap">
                                <div class="underline">
                                    <i class="fa fa-lock" aria-hidden="true"></i>&nbsp;<input type="password" name="password" id="password" minlength="8" maxlength="16" placeholder="비밀번호">
                                </div>
                            </div>
                            <div class="descriptionDiv gap">
                                <span class="descriptionSpan">내용</span> <textarea name="description" id="description" minlength="4" maxlength="2000">${sanitizeHtml(commentDescription)}</textarea>
                            </div>
                        </form>
                    </div>
                    </body>
                    </html>
                    `
                    res.send(html)
                })
                break
            }
        }

        if (isExist === false) {
            res.status(404).send('없는 페이지 입니다.')
        }
    })
})

app.get('/board/:boardId/comment/:commentId/delete', (req, res) => {
    connection.query(`SELECT * FROM comment`, (err, result) => {
        if (err) {
            throw err
        }

        let isExist = false

        for (let i = 0; i < result.length; i++) {
            if (req.params.commentId == result[i]._id) {
                isExist = true
                connection.query(`SELECT * FROM comment WHERE _id = ?`, [req.params.commentId], (err, result) => {
                    if (err) {
                        throw err
                    }

                    let boardId
                    let commentId
                    let html

                    commentId = result[0]._id
                    boardId = result[0].boardId
                    html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic&display=swap&subset=korean" rel="stylesheet">
                        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
                        <link rel="stylesheet" href="../../../../css/delete.css">
                        <link rel="shortcut icon" href="../../../../icon/favicon.ico">
                        <link rel="icon" href="favicon.ico">
                        <script src="../../../../js/submitFunc.js"></script>
                        <title>Delete</title>
                    </head>
                    <body>
                    <ul class="navUl">    
                        <li class="navLi title"><a href="#"><i class="fa fa-circle-o" aria-hidden="true"></i>&nbsp;&nbsp;댓글삭제</a></li>
                        <li class="navLi cancle hover"><a href="/board/${boardId}"><i class="fa fa-times" aria-hidden="true"></i>&nbsp;&nbsp;취소</a></li>
                        <li class="navLi delete hover"><a href="#" onclick="submitFunc()"><i class="fa fa-trash" aria-hidden="true"></i>&nbsp;&nbsp;댓글삭제</a></li>
                    </ul>
                    <div class="container">
                        <form id="myForm" action="/board/${boardId}/comment/${commentId}/delete_process" method="POST">
                            <input type="hidden" name="id" value="${commentId}">
                            <div id="notice">*댓글을 작성하실때 입력하신 비밀번호를 입력해주세요*</div>
                            <div class="passwordDiv gap">
                                <div class="underline">
                                    <i class="fa fa-lock" aria-hidden="true"></i>&nbsp;<input type="password" name="password" id="password" minlength="8" maxlength="16" placeholder="비밀번호">
                                </div>
                            </div>
                        </form>
                    </div>
                    </body>
                    </html>
                    `
                    res.send(html)
                })
                break
            }
        }

        if (isExist === false) {
            res.status(404).send('없는 페이지 입니다.')
        }
    })
})

app.get('/board/:boardId/comment/:commentId/update_process', (req, res) => {
    res.status(404).send('잘못된 접근입니다.')
})

app.get('/board/:boardId/comment/:commentId/delete_process', (req, res) => {
    res.status(404).send('잘못된 접근입니다.')
})

app.post('/board/create_process', (req, res) => {
    if (req.body.name === '' || req.body.password === '' || req.body.title === '' || req.body.description === '') {
        let error = `<script>if(!alert("정보가 빠짐없이 입력되었는지 확인해주세요."))document.location="/board/create"</script>`
        res.send(error)
    } else {
        connection.query(`INSERT INTO board (name, password, title, description, date) VALUES (?, MD5(?), ?, ?, NOW())`, [req.body.name, req.body.password, req.body.title, req.body.description], (err, result) => {
            if (err) {
                throw err
            }
            res.redirect(`/board/${result.insertId}`)
        })
    }
})

app.post('/board/:boardId/update_process', (req, res) => {
    connection.query(`SELECT * FROM board WHERE _id = ?`, [req.body.id], (err, selectResult) => {
        if (req.body.password === '' || req.body.title === '' || req.body.description === '') {
            let error = `<script>if(!alert("정보가 빠짐없이 입력되었는지 확인해주세요."))document.location="/board/${selectResult[0]._id}/update"</script>`
            res.send(error)
        } else if (MD5(req.body.password) != selectResult[0].password) {
            let error = `<script>if(!alert("비밀번호를 잘못입력하셨습니다."))document.location="/board/${selectResult[0]._id}/update"</script>`
            res.send(error)
        } else {
        connection.query(`UPDATE board SET title=?, description=?, date=NOW() WHERE _id=?`, [req.body.title, req.body.description, req.params.boardId], (err, result) => {
                if (err) {
                    throw err
                }
                res.redirect(`/board/${selectResult[0]._id}`)
            })
        }
    })
})

app.post('/board/:boardId/delete_process', (req, res) => {
    connection.query(`SELECT * FROM board WHERE _id = ?`, [req.body.id], (err, selectResult) => {
        if (req.body.password === '') {
            let error = `<script>if(!alert("정보가 빠짐없이 입력되었는지 확인해주세요."))document.location="/board/${selectResult[0]._id}/delete"</script>`
            res.send(error)
        } else if (MD5(req.body.password) != selectResult[0].password) {
            let error = `<script>if(!alert("비밀번호를 잘못입력하셨습니다."))document.location="/board/${selectResult[0]._id}/delete"</script>`
            res.send(error)
        } else {
            connection.query(`DELETE FROM board WHERE _id = ?`, [selectResult[0]._id], (err, result) => {
                if (err) {
                    throw err
                }
                connection.query(`DELETE FROM comment WHERE boardId = ?`,[selectResult[0]._id], (err, result)=>{
                    if(err){
                        throw err
                    }
                })
                res.redirect('/board')
            })
        }
    })
})

app.post('/board/:boardId/comment/create_process', (req, res) => {
    if (req.body.name === '' || req.body.password === '' || req.body.description === '') {
        let error = `<script>if(!alert("정보가 빠짐없이 입력되었는지 확인해주세요."))document.location="/board/${req.params.boardId}"</script>`
        res.send(error)
    } else {
        connection.query(`INSERT INTO comment (boardId, name, password, description, date) VALUES (?, ?, MD5(?), ?, NOW())`, [req.params.boardId, req.body.name, req.body.password, req.body.description], (err, result) => {
            if (err) {
                throw err
            }
            connection.query(`SELECT * FROM board WHERE _id = ?`,[req.params.boardId],(err,boardSelectResult)=>{
                connection.query(`UPDATE board SET commentCount = ? WHERE _id = ?`,[++boardSelectResult[0].commentCount, req.params.boardId],(err, boardUpdateResult)=>{
                    if(err){
                        throw err
                    }
                })
            })
            res.redirect(`/board/${req.params.boardId}`)
        })
    }
})

app.post('/board/:boardId/comment/:commentId/update_process', (req, res) => {
    connection.query(`SELECT * FROM comment WHERE _id = ?`, [req.body.id], (err, selectResult) => {
        if (req.body.password === '' || req.body.description === '') {
            let error = `<script>if(!alert("정보가 빠짐없이 입력되었는지 확인해주세요."))document.location="/board/${selectResult[0].boardId}/comment/${selectResult[0]._id}/update"</script>`
            res.send(error)
        } else if (MD5(req.body.password) != selectResult[0].password) {
            let error = `<script>if(!alert("비밀번호를 잘못입력하셨습니다."))document.location="/board/${selectResult[0].boardId}/comment/${selectResult[0]._id}/update"</script>`
            res.send(error)
        } else {
            connection.query(`UPDATE comment SET description=?, date=NOW() WHERE _id=?`, [req.body.description, selectResult[0]._id], (err, result) => {
                if (err) {
                    throw err
                }
                res.redirect(`/board/${selectResult[0].boardId}`)
            })
        }
    })
})

app.post('/board/:boardId/comment/:commentId/delete_process', (req, res) => {
    connection.query(`SELECT * FROM comment WHERE _id = ?`, [req.body.id], (err, selectResult) => {
        if (req.body.password === '') {
            let error = `<script>if(!alert("정보가 빠짐없이 입력되었는지 확인해주세요."))document.location="/board/${selectResult[0].boardId}/comment/${selectResult[0]._id}/delete"</script>`
            res.send(error)
        } else if (MD5(req.body.password) != selectResult[0].password) {
            let error = `<script>if(!alert("비밀번호를 잘못입력하셨습니다."))document.location="/board/${selectResult[0].boardId}/comment/${selectResult[0]._id}/delete"</script>`
            res.send(error)
        } else {
            connection.query(`DELETE FROM comment WHERE _id = ?`, [selectResult[0]._id], (err, result) => {
                if (err) {
                    throw err
                }
                connection.query(`SELECT * FROM board WHERE _id = ?`,[req.params.boardId],(err,boardSelectResult)=>{
                    connection.query(`UPDATE board SET commentCount = ? WHERE _id = ?`,[--boardSelectResult[0].commentCount, req.params.boardId],(err, boardUpdateResult)=>{
                        if(err){
                            throw err
                        }
                    })
                })
                res.redirect(`/board/${selectResult[0].boardId}`)
            })
        }
    })
})

app.use(function (req, res, next) {
    res.status(404).send('없는 페이지 입니다.')
})

app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

app.listen(port, () => {
    console.log('\u001b[1m', '\u001b[32m', 'Server is running on ' + port, '\u001b[0m')
})