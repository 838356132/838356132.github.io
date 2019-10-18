
#!title:    Harris角点
#!date:     2019-08-07
#!authors:  Mikukonai
#!cover:    
#!type:     原创
#!tags:     


#!content

: <button id="origin1" class="MikumarkButton">原图1</button> <button id="origin2" class="MikumarkButton">原图2</button> <button id="origin3" class="MikumarkButton">原图3</button> <button id="origin4" class="MikumarkButton">原图4</button> <button id="origin5" class="MikumarkButton">原图5</button> <button id="origin6" class="MikumarkButton">原图6</button>

: <button id="harris" class="MikumarkButton" style="width: 100%;">角点提取</button>

<canvas id="cv" style="width:640px;height:360px;" width="640" height="360"></canvas>

#!style

canvas {
    display: block;
    border: none;
    box-shadow: 0 2px 5px 0 rgba(0,0,0,0.2);
    margin: 10px auto 10px auto;
}

#!script

#!script:./ts/signal.js
#!script:./ts/image.js
#!script:./ts/canvas.js

let cv = new Canvas('cv', [0,360], [640,0]);

function loadImage(src, callback) {
    let image = document.createElement('img');
    image.src = src;
    image.addEventListener("load", function() {
        cv.context.drawImage(image, 0, 0);
        callback();
    });
}

setTimeout(()=>{loadImage("./image/euphonium/60.jpg", ()=>{});}, 0);

$("#origin1").click(()=> { loadImage(`./image/euphonium/60.jpg`, ()=> {}); });
$("#origin2").click(()=> { loadImage(`./image/euphonium/82.jpg`, ()=> {}); });
$("#origin3").click(()=> { loadImage(`./image/euphonium/108.jpg`, ()=> {}); });
$("#origin4").click(()=> { loadImage(`./image/euphonium/25.jpg`, ()=> {}); });
$("#origin5").click(()=> { loadImage(`./image/euphonium/130.jpg`, ()=> {}); });
$("#origin6").click(()=> { loadImage(`./image/euphonium/14.jpg`, ()=> {}); });

$("#harris").click(()=> {
    //loadImage(`./image/euphonium/60.jpg`, ()=> {
        let input = cv.ReadYUV420().Y;
        let corners = Harris(input, 100000);
        for(let i = 0; i < corners.length; i++) {
            cv.Circle(corners[i], 2, "red");
        }
    //});
});
