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
app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({limit: '1mb', extended: true}));


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/html/main.html')
})

app.get('/game', (req, res) => {
    res.sendFile(__dirname + '/public/game/NeptuneChat.html')
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
            <title>Board</title>
        </head>
        
        <body>
        <ul class="navUl">
            <li class="navLi title"><a href="/board"><i class="fa fa-circle-o" aria-hidden="true"></i>&nbsp;&nbsp;자유 게시판</a></li>        
            <li class="navLi main hover"><a href="/"><i class="fa fa-home" aria-hidden="true"></i>&nbsp;&nbsp;메인</a></li>        
            <li class="navLi main hover"><a href="/game"><i class="fa fa-gamepad" aria-hidden="true"></i>&nbsp;&nbsp;게임하기</a></li>        
            <li class="navLi create hover"><a href="/board/create"><i class="fa fa-pencil" aria-hidden="true"></i>&nbsp;&nbsp;글작성</a></li>
        </ul>
        ${list}
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

                        let commentCount

                        if (!commentResult.length) {
                            commentCount = 0
                        } else {
                            commentCount = commentResult.length
                        }

                        let htmlId
                        let htmlTitle
                        let htmlName
                        let htmlDate
                        let htmlDescription
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

                        htmlTitle = htmlTitle.replace(/\s/g, '&nbsp;')
                        htmlDescription = sanitizeHtml(htmlDescription)
                        htmlDescription = htmlDescription.replace(/(?:\r\n|\r|\n)/g, '<br>')
                        htmlDescription = htmlDescription.replace(/\s/g, '&nbsp;')


                        for (let i = 0; i < commentCount; i++) {
                            let commentDescription = commentResult[i].description
                            commentDescription = sanitizeHtml(commentDescription)
                            commentDescription = commentDescription.replace(/(?:\r\n|\r|\n)/g, '<br>')
                            commentDescription = commentDescription.replace(/\s/g, '&nbsp;')
                            comment += `
                            <ul>
                                <li>${sanitizeHtml(commentResult[i].name)}</li>
                                <li>${commentResult[i].date}</li>
                                <li>${commentDescription}</li>
                                <li>
                                    <a href="/board/${htmlId}/comment/${commentResult[i]._id}/update"><button>수정</button></a>
                                    <a href="/board/${htmlId}/comment/${commentResult[i]._id}/delete"><button>삭제</button></a>
                                </li>
                            </ul>
                            `
                        }
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
                        <div>${htmlDescription}</div>
                        <div>댓글 ${commentCount}</div>
                        <div>${comment}</div>
                        <div>
                        <div>*비밀번호는 나중에 댓글을 수정 및 삭제 할때 사용될 정보입니다.*</div>
                        <form action="/board/${htmlId}/comment/create_process" method="POST">
                            <div>
                                <span>닉네임</span> <input type="text" name="name" id="name" minlength="2" maxlength="8">
                            </div>
                            <div>
                                <span>비밀번호</span> <input type="password" name="password" id="password" minlength="8" maxlength="16">
                            </div>
                            <div>
                                <span>내용</span> <textarea name="description" id="description" cols="30" rows="10" minlength="4" maxlength="2000"></textarea>
                            </div>
                            <div>
                                <input type="submit" value="게시">
                            </div>
                        </form>
                        </div>
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
                        <title>Update</title>
                    </head>
                    <body>
                    <form action="/board/${htmlId}/update_process" method="POST">
                        <input type="hidden" name="id" value="${htmlId}">
                        <div>
                            *글을 작성하실때 입력하신 비밀번호를 입력해주세요*
                        </div>
                        <div>
                            <span>비밀번호</span> <input type="password" name="password" id="password" minlength="8" maxlength="16">
                        </div>
                        <div>
                            <span>제목</span> <input type="text" name="title" id="title" minlength="4" maxlength="80" value="${sanitizeHtml(htmlTitle)}">
                        </div>
                        <div>
                            <span>내용</span> <textarea name="description" id="description" cols="30" rows="10" minlength="4" maxlength="10000">${sanitizeHtml(htmlDescription)}</textarea>
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
                        <title>Delete</title>
                    </head>
                    <body>
                    <form action="/board/${htmlId}/delete_process" method="POST">
                        <input type="hidden" name="id" value="${htmlId}">
                        <div>
                            *글을 작성하실때 입력하신 비밀번호를 입력해주세요*
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
                    <form action="/board/${boardId}/comment/${commentId}/update_process" method="POST">
                        <input type="hidden" name="id" value="${commentId}">
                        <div>
                            *글을 작성하실때 입력하신 비밀번호를 입력해주세요*
                        </div>
                        <div>
                            <span>비밀번호</span> <input type="password" name="password" id="password" minlength="8" maxlength="16">
                        </div>
                        <div>
                            <span>내용</span> <textarea name="description" id="description" cols="30" rows="10" minlength="4" maxlength="2000">${sanitizeHtml(commentDescription)}</textarea>
                        </div>
                        <div>
                            <input type="submit" value="수정">    
                        </div>
                    </form>
                        <div>
                            <a href="/board/${boardId}"><button>취소</button></a>
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
                        <title>Delete</title>
                    </head>
                    <body>
                    <form action="/board/${boardId}/comment/${commentId}/delete_process" method="POST">
                        <input type="hidden" name="id" value="${commentId}">
                        <div>
                            *글을 작성하실때 입력하신 비밀번호를 입력해주세요*
                        </div>
                        <div>
                            <span>비밀번호</span> <input type="password" name="password" id="password" minlength="8" maxlength="16">
                        </div>
                        <div>
                            <input type="submit" value="삭제">    
                        </div>
                    </form>
                        <div>
                            <a href="/board/${boardId}"><button>취소</button></a>
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