let changeBgImageCount = 0

function backgrounFunc() {
    changeBgImage(0)
    setTimeout(() => {
        fadeIn_Out(55)
    }, 10000)
}

function changeBgImage() {
    if (changeBgImageCount == 5) {
        changeBgImageCount = 0
    }
    const bg = document.getElementById('bg')
    bg.style.backgroundImage = `url(../image/main${changeBgImageCount}.jpg)`
    changeBgImageCount++
}

function fadeIn_Out(opacity, isTurning = true) {
    const black = document.getElementById('black')
    setTimeout(() => {
        if (opacity < 100 && isTurning === true) {
            fadeIn_Out(opacity + 1, true)
            if (opacity == 99) {
                fadeIn_Out(100, false)
                changeBgImage()
            }
        } else if (opacity > 55 && isTurning === false) {
            fadeIn_Out(opacity - 1, false)
            if (opacity == 56) {
                setTimeout(() => {
                    fadeIn_Out(55, true)
                }, 8000)
            }
        }
        black.style.backgroundColor = `rgba(0, 0, 0, ${opacity/100})`
    }, 25)
}

function enter(path) {
    window.location.href = path
}