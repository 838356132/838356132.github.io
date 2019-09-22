// 图像处理相关
// 2019.08.02
var PAImage = /** @class */ (function () {
    function PAImage() {
    }
    PAImage.clamp = function (val) {
        if (val >= this.MinValue && val <= this.MaxValue)
            return Math.round(val);
        else if (val > this.MaxValue)
            return this.MaxValue;
        else if (val < this.MinValue)
            return this.MinValue;
        else
            return val;
    };
    PAImage.MinValue = 0;
    PAImage.MaxValue = 255;
    PAImage.RGBtoY = function (r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }; // Y
    PAImage.RGBtoU = function (r, g, b) { return -0.1687 * r - 0.3313 * g + 0.5 * b + 128; }; // Cb
    PAImage.RGBtoV = function (r, g, b) { return 0.5 * r - 0.4187 * g - 0.0813 * b + 128; }; // Cr
    PAImage.YUVtoR = function (Y, U, V) { return (Y + 1.403 * (V - 128)); };
    PAImage.YUVtoG = function (Y, U, V) { return (Y - 0.344 * (U - 128) - 0.714 * (V - 128)); };
    PAImage.YUVtoB = function (Y, U, V) { return (Y + 1.773 * (U - 128)); };
    return PAImage;
}());
// Harris角点
// 2019.08.07
function Harris(input, threshold) {
    threshold = threshold || 1000000;
    var WINDOW_SIZE = 3;
    var width = input.width;
    var height = input.height;
    // 计算xy两个方向的梯度
    var GradX_Kernal = new Matrix(WINDOW_SIZE, 1);
    GradX_Kernal.data = [-1, 0, 1];
    var GradY_Kernal = new Matrix(1, WINDOW_SIZE);
    GradY_Kernal.data = [-1, 0, 1];
    var GradX = Matrix.Convolution(input, GradX_Kernal);
    var GradY = Matrix.Convolution(input, GradY_Kernal);
    // 计算XX、YY、XY
    var X2 = new Matrix(width, height);
    var Y2 = new Matrix(width, height);
    var XY = new Matrix(width, height);
    for (var i = 0; i < input.data.length; i++) {
        X2.data[i] = (GradX.data[i] * GradX.data[i]);
        Y2.data[i] = (GradY.data[i] * GradY.data[i]);
        XY.data[i] = (GradX.data[i] * GradY.data[i]);
    }
    // 高斯滤波
    var GaussKernal = new Matrix(WINDOW_SIZE, WINDOW_SIZE);
    GaussKernal.data = [
        // 1,4,7,4,1,
        // 4,16,26,16,4,
        // 7,26,41,26,7,
        // 4,16,26,16,4,
        // 1,4,7,4,1
        1, 2, 1, 2, 4, 2, 1, 2, 1
    ];
    var FilteredX2 = Matrix.Convolution(X2, GaussKernal);
    var FilteredY2 = Matrix.Convolution(Y2, GaussKernal);
    var FilteredXY = Matrix.Convolution(XY, GaussKernal);
    // 计算角点
    var HarrisScore = new Matrix(width, height);
    for (var y = 0; y < input.height; y++) {
        for (var x = 0; x < input.width; x++) {
            var det = FilteredX2.getElement(x, y) * FilteredY2.getElement(x, y) - FilteredXY.getElement(x, y) * FilteredXY.getElement(x, y);
            var trace = FilteredX2.getElement(x, y) + FilteredY2.getElement(x, y);
            var score = det - 0.05 * trace * trace;
            HarrisScore.setElement(x, y, score);
        }
    }
    // 形态学膨胀（取窗口内最大者为角点）
    var WINDOW_SIZE_2 = 16;
    var results = new Array();
    for (var y = 0; y < input.height - 1; y += WINDOW_SIZE_2) {
        for (var x = 0; x < input.width - 1; x += WINDOW_SIZE_2) {
            var window_1 = HarrisScore.getBlock(x, y, WINDOW_SIZE_2, WINDOW_SIZE_2);
            var maxVal = Number.MIN_VALUE;
            var maxIndex = 0;
            for (var i = 0; i < WINDOW_SIZE_2 * WINDOW_SIZE_2; i++) {
                if (window_1.data[i] > maxVal) {
                    maxVal = window_1.data[i];
                    maxIndex = i;
                }
            }
            if (maxVal >= threshold) {
                var cornerX = x + (maxIndex % WINDOW_SIZE_2);
                var cornerY = y + Math.floor(maxIndex / WINDOW_SIZE_2);
                results.push([cornerX, cornerY]);
            }
        }
    }
    return results;
}
// 大津二值化
// 2019.08.10
function Otsu(input) {
    // 计算灰度直方图
    var dist = new Array(256);
    for (var i = 0; i < 256; i++)
        dist[i] = 0;
    for (var i = 0; i < input.data.length; i++) {
        var value = Math.round(input.data[i]);
        dist[value] = (!(dist[value])) ? 1 : (dist[value] + 1);
    }
    // 遍历所有灰度级，寻找最佳阈值
    var maxVariance = Number.MIN_VALUE;
    var bestThreshold = 0;
    for (var threshold = 1; threshold < 255; threshold++) {
        // 计算明暗两类方差
        var darkCount = 0, lightCount = 0;
        var darkAvr = 0, lightAvr = 0;
        for (var i = 0; i < threshold; i++) {
            darkCount += dist[i];
            darkAvr += (i * dist[i]);
        }
        for (var i = threshold; i < 256; i++) {
            lightCount += dist[i];
            lightAvr += (i * dist[i]);
        }
        darkAvr = darkAvr / darkCount;
        lightAvr = lightAvr / lightCount;
        var variance = (darkAvr - lightAvr) * (darkAvr - lightAvr) * (darkCount / input.data.length) * (lightCount / input.data.length);
        // 寻找最大者
        if (variance > maxVariance) {
            maxVariance = variance;
            bestThreshold = threshold;
        }
    }
    console.log("\u7070\u5EA6\u9608\u503C=" + bestThreshold);
    // 根据最佳阈值，计算二值化图像
    var result = new Matrix(input.width, input.height);
    for (var i = 0; i < input.data.length; i++) {
        result.data[i] = (input.data[i] >= bestThreshold) ? 255 : 0;
    }
    return result;
}
