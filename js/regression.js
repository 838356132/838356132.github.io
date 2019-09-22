function Regression(xs, ys) {
    this.xs = xs;
    this.ys = ys;
    this.args = new Array();
}
Regression.prototype = {
    Linear: function(x) {
        return this.args[0] * x + this.args[1];
    },
    setArgs: function(w, b) {
        this.args[0] = w;
        this.args[1] = b;
    },
    loss: function() {
        let size = this.xs.length;
        let sum = 0;
        for(let i = 0; i < size; i++) {
            let e = this.ys[i] - this.Linear(this.xs[i]); // 残差
            sum += (e * e);
        }
        return sum;
    },
    // 批量梯度
    lossd0: function() {
        let size = this.xs.length;
        let sum = 0;
        for(let i = 0; i < size; i++) {
            let e = this.ys[i] - this.Linear(this.xs[i]); // 残差
            sum += (e * (- this.xs[i]));
        }
        return 2 * sum;
    },
    lossd1: function() {
        let size = this.xs.length;
        let sum = 0;
        for(let i = 0; i < size; i++) {
            let e = this.ys[i] - this.Linear(this.xs[i]); // 残差
            sum += (e * (- 1));
        }
        return 2 * sum;
    },
    // 小批量随机梯度：随机选取一半样本计算梯度
    lossd0s: function() {
        let size = Math.floor(this.xs.length * 0.5)
        let indexes = {};
        let count = 0;
        while(count < size) {
            let index = Math.floor(Math.random() * this.xs.length);
            if(indexes[index] === undefined) {
                indexes[index] = 1;
                count++;
            }
            else {
                continue;
            }
        }
        // console.log(indexes);
        let sum = 0;
        for(let i in indexes) {
            let e = this.ys[i] - this.Linear(this.xs[i]); // 残差
            sum += (e * (- this.xs[i]));
        }
        return 2 * sum;
    },
    lossd1s: function() {
        let size = Math.floor(this.xs.length * 0.5)
        let indexes = {};
        let count = 0;
        while(count < size) {
            let index = Math.floor(Math.random() * this.xs.length);
            if(indexes[index] === undefined) {
                indexes[index] = 1;
                count++;
            }
            else {
                continue;
            }
        }
        // console.log(indexes);
        let sum = 0;
        for(let i in indexes) {
            let e = this.ys[i] - this.Linear(this.xs[i]); // 残差
            sum += (e * (- 1));
        }
        return 2 * sum;
    },
};



function GD(reg, sflag, canvas) {
    let context = canvas.getContext('2d');

    const xs = reg.xs;
    const ys = reg.ys;

    let STEP = 0.0001;
    let THRESHOLD = 0.1;
    if(sflag) {
        STEP = 0.0001;
        THRESHOLD = 1;
    } 
    else {
        STEP = 0.0001;
        THRESHOLD = 0.05;
    }
    const XRANGE = Math.max.apply(null, xs) - Math.min.apply(null, xs);
    const YRANGE = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    const XMIN   = Math.min.apply(null, xs);
    const XMAX   = Math.max.apply(null, xs);
    const YMIN   = Math.min.apply(null, ys);
    const YMAX   = Math.max.apply(null, ys);

    let w = Math.random() * 20 - 10;
    let b = Math.random() * 40 - 20;

    const toCanvasX = function(x) {
        return (x-XMIN) * canvas.width / XRANGE;
    };
    const toCanvasY = function(y) {
        return (YMAX-y) * canvas.height / YRANGE;
    };

    const drawLine = function() {
        context.textBaseline = 'top';
        context.font = '12px Arial';
        context.fillStyle = 'rgb(0,0,0)';
        context.fillText('ω=' + w.toFixed(3).toString(), 8, 8);
        context.fillText('b=' + b.toFixed(3).toString(), 8, 22);
        context.fillText('Grad=' + grad.toFixed(3).toString(), 8, 36);

        context.strokeStyle = 'rgb(255,0,0)';
        let x0, y0, x1, y1;

        if(b <= YMIN) {
            x0 = toCanvasX(-b / w);
            y0 = toCanvasY(YMIN);
            x1 = toCanvasX(XMAX);
            y1 = toCanvasY(XMAX * w + b);
        }
        else {
            x0 = toCanvasX(0);
            y0 = toCanvasY(b);
            x1 = toCanvasX(XMAX);
            y1 = toCanvasY(XMAX * w + b);
        }
        context.beginPath();
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
        context.stroke();
    };

    reg.setArgs(w, b);
    let d0 = reg.lossd0();
    let d1 = reg.lossd1();
    let grad = Math.sqrt(d0 * d0 + d1 * d1);
    let timer = setInterval(function() {
        if(grad > THRESHOLD) {
            w += STEP * (-d0);
            b += STEP * (-d1);
            reg.setArgs(w, b);
            if(sflag) {
                d0 = reg.lossd0s();
                d1 = reg.lossd1s();
            } 
            else {
                d0 = reg.lossd0();
                d1 = reg.lossd1();
            }
            grad = Math.sqrt(d0 * d0 + d1 * d1);
            clear(canvas);
            plot(reg.xs, reg.ys, canvas);
            drawLine();
        }
        else {
            clearInterval(timer);
        }
    }, 0);
    drawLine();
    return timer;
}

function clear(canvas) {
    canvas.height = canvas.height;
}

function plot(xs, ys, canvas) {
    let context = canvas.getContext('2d');
    const XRANGE = Math.max.apply(null, xs) - Math.min.apply(null, xs);
    const YRANGE = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    const XMIN   = Math.min.apply(null, xs);
    const XMAX   = Math.max.apply(null, xs);
    const YMIN   = Math.min.apply(null, ys);
    const YMAX   = Math.max.apply(null, ys);

    const toCanvasX = function(x) {
        return (x-XMIN) * canvas.width / XRANGE;
    };
    const toCanvasY = function(y) {
        return (YMAX-y) * canvas.height / YRANGE;
    };

    context.fillStyle = '#000000';
    for(let i = 0; i < xs.length; i++) {
        context.fillRect(toCanvasX(xs[i]), toCanvasY(ys[i]), 2, 2);
    }
}