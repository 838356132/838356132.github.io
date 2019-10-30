
#!title:    Bad Apple!!
#!date:     2019-08-11
#!authors:  Mikukonai
#!cover:    
#!type:     原创
#!tags:     


#!content

<canvas id="cv" style="width:320px;height:320px;" width="320" height="320"></canvas>

# 进度

|日期|:进度|
|--------|
|2019.08.11|模仿模拟示波器XY模式的动画框架，绘制含有两个连通分量的简单图形|

#!style

canvas {
    display: block;
    border: none;
    box-shadow: 0 2px 5px 0 rgba(0,0,0,0.2);
    margin: 10px auto 10px auto;
}

#!script

#!script:./script/signal.js
#!script:./script/image.js
#!script:./script/canvas.js

let cv = new Canvas('cv', [-160, -160], [160, 160]);
cv.SetBackgroundColor("#000");

let amplitude = 80;

let X = (t)=>{
    if(Math.sin(t) > 0) {
        return amplitude * Math.sin(t*2+(Math.PI/4)) - amplitude;
    }
    else {
        return amplitude * Math.sin(-(t*2+(Math.PI/4))) + amplitude;
    }
};
let Y = (t)=>{
    if(Math.sin(t) > 0) {
        return -amplitude * Math.cos(t*2+(Math.PI/4)) + amplitude;
    }
    else {
        return amplitude * Math.cos(-(t*2+(Math.PI/4))) - amplitude;
    }
};
/*
let FRAME = [
    [-50, -50], [-50, -40], [-50, -30], [-50, -20], [-50, -10],
    [-50, 0], [-50, 10], [-50, 20], [-50, 30], [-50, 40],
    [-50, 50], [-40, 50], [-30, 50], [-20, 50], [-10, 50],
    [0, 50], [10, 50], [20, 50], [30, 50], [40, 50],
    [50, 50], [50, 40], [50, 30], [50, 20], [50, 10],
    [50, 0], [50, -10], [50, -20], [50, -30], [50, -40],
    [50, -50], [40, -50], [30, -50], [20, -50], [10, -50],
    [0, -50], [-10, -50], [-20, -50], [-30, -50], [-40, -50]
];

X = (t)=>{
    let index = Math.round(Math.abs(t) * 1000) % (FRAME.length);
    return FRAME[index][0];
}
Y = (t)=>{
    let index = Math.round(Math.abs(t) * 1000) % (FRAME.length);
    return FRAME[index][1];
}
*/

let t = 0;
let step = 1;

// 绘制各帧
let tt = 0;
setInterval(()=> {
    amplitude = 20 * Math.sin(tt) + 60;
    tt += 0.1;
}, 20);

// 绘制单帧
function Oscilloscope() {
    cv.SetBackgroundColor("#000");
    // 余辉拖尾效果
    const interval = 0.01;
    for(let delta = 0; delta < 10; delta += interval) {
        let x = X(t - delta);
        let y = Y(t - delta);
        let x0 = X(t - delta - interval);
        let y0 = Y(t - delta - interval);
        cv.Line([x0, y0], [x, y], "#66ffaa");
    }
    t += step;
    window.requestAnimationFrame(Oscilloscope);
}
window.requestAnimationFrame(Oscilloscope);
