const express = require('express')
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const sanitizeHtml = require('sanitize-html')
const MD5 = require('md5')

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
    connection.query(`SELECT * FROM board`,(err,result)=>{
        let html
        let list = ''

        if(err){
            throw err
        }

        for(let i = result.length-1; i >= 0; i--){
            if(sanitizeHtml(result[i].title) == ''){
                result[i].title += '걸러진 제목'
            }
            if(sanitizeHtml(result[i].name) == ''){
                result[i].name += '걸러진 이름'
            }
            list += `
            <tr>
                <td id="title"><a href="/board/${result[i]._id}">${sanitizeHtml(result[i].title)}</a></td>
                <td id="name">${sanitizeHtml(result[i].name)}</td>
                <td id="date">${result[i].date}</td>
            </tr>
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
            <title>Board</title>
        </head>
        
        <body>
        <a href="/" id="goMain"><button>메인으로</button></a>        
        <h1>자유 게시판</h1>
        <a href="/board/create"><button>글작성</button></a>
        <table class="board">
            <thead>
                <tr>    
                    <th class="tableH title">제목</th>
                    <th class="tableH name">작성자</th>
                    <th class="tableH date">날짜</th>
                </tr>
            </thead>
            <tbody id="content">
                ${list}
            </tbody>
        </table>
        </body>

        <script>
        if ( self !== top ) {
            const goMain = document.getElementById('goMain')
            goMain.style.display = 'none'
          }          
        </script>
        
        </html>
        `
        res.send(html)
    })
})

app.get('/board/create',(req,res)=>{
    res.sendFile(__dirname + '/public/html/board_create.html')
})

app.get('/board/:boardId',(req,res)=>{
    connection.query(`SELECT * FROM board WHERE _id = ?`, [req.params.boardId],(err,result)=>{
        let htmlId
        let htmlTitle
        let htmlName
        let htmlDate
        let htmlDescription
        let html

        if(err){
            throw err
        }

        if(sanitizeHtml(result[0].title) == ''){
            result[0].title += '걸러진 제목'
        }
        if(sanitizeHtml(result[0].name) == ''){
            result[0].name += '걸러진 이름'
        }
        if(sanitizeHtml(result[0].description) == ''){
            result[0].description += '걸러진 본문'
        }

        htmlId = result[0]._id
        htmlTitle = result[0].title
        htmlName = result[0].name
        htmlDate = result[0].date
        htmlDescription = result[0].description
        html = `
        <!DOCTYPE html>
        <html>
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="../css/board_create.css">
            <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic&display=swap&subset=korean" rel="stylesheet">
            <title>${sanitizeHtml(htmlTitle)}</title>
        </head>
        
        <body>
            <a href="/board"><button>목록</button></a>
            <h1>${sanitizeHtml(htmlTitle)}</h1>
            <div>${sanitizeHtml(htmlName)}</div>
            <div>${htmlDate}</div>
            <a href="/board/${htmlId}/update"><button>수정</button></a>
            <a href="/board/${htmlId}/delete"><button>삭제</button></a>
            <div>${sanitizeHtml(htmlDescription)}</div>
        </body>
        
        </html>
        `
        res.send(html)
    })

})

app.get('/board/:boardId/update',(req,res)=>{
    connection.query(`SELECT * FROM board WHERE _id = ?`,[req.params.boardId],(err,result)=>{
        let htmlId
        let htmlTitle
        let htmlDescription
        let html

        if(err){
            throw err
        }

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
            <title>Update</title>
        </head>
        <body>
        <form action="/board/${htmlId}/update_process" method="POST">
            <input type="hidden" name="id" value="${htmlId}">
            <div>
                *글을 작성하실때 입력하신 아이디와 비밀번호를 입력해주세요*
            </div>
            <div>
                <span>아이디</span> <input type="text" name="name" id="name" minlength="2" maxlength="32">
            </div>
            <div>
                <span>비밀번호</span> <input type="password" name="password" id="password" minlength="8" maxlength="16">
            </div>
            <div>
                <span>제목</span> <input type="text" name="title" id="title" minlength="4" maxlength="255" value="${sanitizeHtml(htmlTitle)}">
            </div>
            <div>
                <span>내용</span> <textarea name="description" id="description" cols="30" rows="10" minlength="4" maxlength="65535">${sanitizeHtml(htmlDescription)}</textarea>
            </div>
            <div>
                <input type="submit" value="수정">    
            </div>
        </form>
            <div>
                <a href="/board/${htmlId}"><button>취소</button></a>
            </div>
        </body>
        </html>
        `
        res.send(html)
    })
})

app.get('/board/:boardId/delete',(req,res)=>{
    connection.query(`SELECT * FROM board WHERE _id = ?`,[req.params.boardId],(err,result)=>{
        let htmlId
        let html

        if(err){
            throw err
        }

        htmlId = result[0]._id
        html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css?family=Nanum+Gothic&display=swap&subset=korean" rel="stylesheet">
            <title>Delete</title>
        </head>
        <body>
        <form action="/board/${htmlId}/delete_process" method="POST">
            <input type="hidden" name="id" value="${htmlId}">
            <div>
                *글을 작성하실때 입력하신 아이디와 비밀번호를 입력해주세요*
            </div>
            <div>
                <span>아이디</span> <input type="text" name="name" id="name" minlength="2" maxlength="32">
            </div>
            <div>
                <span>비밀번호</span> <input type="password" name="password" id="password" minlength="8" maxlength="16">
            </div>
            <div>
                <input type="submit" value="삭제">    
            </div>
        </form>
            <div>
                <a href="/board/${htmlId}"><button>취소</button></a>
            </div>
        </body>
        </html>
        `
        res.send(html)
    })
})

app.post('/board/create_process',(req,res)=>{
    if(req.body.name === '' || req.body.password === '' || req.body.title === '' || req.body.description === ''){
        let error = `<script>if(!alert("공백이 없도록 해주세요."))document.location="/board/create"</script>`
        res.send(error)
    }else{
        connection.query(`INSERT INTO board (name, password, title, description, date) VALUES (?, MD5(?), ?, ?, NOW());`, [req.body.name, req.body.password, req.body.title, req.body.description],(err,result)=>{
            if(err){
                throw err
            }
            res.redirect(`/board/${result.insertId}`)
        })
    }
})

app.post('/board/:boardId/update_process',(req,res)=>{
    connection.query(`SELECT * FROM board WHERE _id = ?`,[req.body.id],(err,selectResult)=>{
        if(req.body.name === '' || req.body.password === '' || req.body.title === '' || req.body.description === ''){
            let error = `<script>if(!alert("공백이 없도록 해주세요."))document.location="/board/${selectResult[0]._id}/update"</script>`
            res.send(error)
        }else if(req.body.name!=selectResult[0].name || MD5(req.body.password)!=selectResult[0].password){
            let error = `<script>if(!alert("아이디 또는 비밀번호를 잘못입력하셨습니다."))document.location="/board/${selectResult[0]._id}/update"</script>`
            res.send(error)
        }else{
            connection.query(`UPDATE board SET title=?, description=?, date=NOW() WHERE _id=?`,[req.body.title, req.body.description, req.params.boardId],(err,result)=>{
                if(err){
                    throw err
                }
                res.redirect(`/board/${selectResult[0]._id}`)
            })
        }
    })
})

app.post('/board/:boardId/delete_process',(req,res)=>{
    connection.query(`SELECT * FROM board WHERE _id = ?`,[req.body.id],(err,selectResult)=>{
        if(req.body.name === '' || req.body.password === ''){
            let error = `<script>if(!alert("공백이 없도록 해주세요."))document.location="/board/${selectResult[0]._id}/delete"</script>`
            res.send(error)
        }else if(req.body.name!=selectResult[0].name || MD5(req.body.password)!=selectResult[0].password){
            let error = `<script>if(!alert("아이디 또는 비밀번호를 잘못입력하셨습니다."))document.location="/board/${selectResult[0]._id}/delete"</script>`
            res.send(error)
        }else{
            connection.query(`DELETE FROM board WHERE _id = ?`,[selectResult[0]._id],(err,result)=>{
                if(err){
                    throw err
                }
                res.redirect('/board')
            })
        }
    })
})

app.listen(port,()=>{
    console.log('\u001b[1m', '\u001b[32m', 'Server is running on ' + port, '\u001b[0m')
})