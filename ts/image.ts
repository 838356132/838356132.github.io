// 图像处理相关
// 2019.08.02

class PAImage {
    public DPI_H: number;
    public DPI_V: number;

    static MinValue: number = 0;
    static MaxValue: number = 255;

    static clamp(val: number): number {
        if(val >= this.MinValue && val <= this.MaxValue) return Math.round(val);
        else if(val > this.MaxValue) return this.MaxValue;
        else if(val < this.MinValue) return this.MinValue;
        else return val;
    }

    static RGBtoY = (r: number, g: number, b: number)=>{ return 0.299*r + 0.587*g + 0.114*b; };        // Y
    static RGBtoU = (r: number, g: number, b: number)=>{ return -0.1687*r - 0.3313*g + 0.5*b + 128; }; // Cb
    static RGBtoV = (r: number, g: number, b: number)=>{ return 0.5*r - 0.4187*g - 0.0813*b + 128; };  // Cr

    static YUVtoR = (Y: number, U: number, V: number)=>{ return (Y + 1.403*(V-128)); };
    static YUVtoG = (Y: number, U: number, V: number)=>{ return (Y - 0.344*(U-128) - 0.714*(V-128)); };
    static YUVtoB = (Y: number, U: number, V: number)=>{ return (Y + 1.773*(U-128)); };

}

interface RGBImage {
    R: Matrix<number>;
    G: Matrix<number>;
    B: Matrix<number>;
}

interface YUVImage {
    Y: Matrix<number>;
    U: Matrix<number>;
    V: Matrix<number>;
}

// Harris角点
// 2019.08.07
function Harris(input: Matrix<number>, threshold: number): Array<Point> {
    threshold = threshold || 1000000;
    const WINDOW_SIZE = 3;
    let width = input.width;
    let height = input.height;
    // 计算xy两个方向的梯度
    let GradX_Kernal = new Matrix<number>(WINDOW_SIZE, 1); GradX_Kernal.data = [-1, 0, 1];
    let GradY_Kernal = new Matrix<number>(1, WINDOW_SIZE); GradY_Kernal.data = [-1, 0, 1];
    let GradX: Matrix<number> = Matrix.Convolution(input, GradX_Kernal);
    let GradY: Matrix<number> = Matrix.Convolution(input, GradY_Kernal);
    // 计算XX、YY、XY
    let X2 = new Matrix<number>(width, height);
    let Y2 = new Matrix<number>(width, height);
    let XY = new Matrix<number>(width, height);
    for(let i = 0; i < input.data.length; i++) {
        X2.data[i] = (GradX.data[i] * GradX.data[i]);
        Y2.data[i] = (GradY.data[i] * GradY.data[i]);
        XY.data[i] = (GradX.data[i] * GradY.data[i]);
    }
    // 高斯滤波
    let GaussKernal = new Matrix<number>(WINDOW_SIZE, WINDOW_SIZE);
    GaussKernal.data = [
        // 1,4,7,4,1,
        // 4,16,26,16,4,
        // 7,26,41,26,7,
        // 4,16,26,16,4,
        // 1,4,7,4,1
        1,2,1, 2,4,2, 1,2,1
    ];
    let FilteredX2 = Matrix.Convolution(X2, GaussKernal);
    let FilteredY2 = Matrix.Convolution(Y2, GaussKernal);
    let FilteredXY = Matrix.Convolution(XY, GaussKernal);
    // 计算角点
    let HarrisScore = new Matrix<number>(width, height);
    for(let y = 0; y < input.height; y++) {
        for(let x = 0; x < input.width; x++) {
            let det = FilteredX2.getElement(x, y) * FilteredY2.getElement(x, y) - FilteredXY.getElement(x, y) * FilteredXY.getElement(x, y);
            let trace = FilteredX2.getElement(x, y) + FilteredY2.getElement(x, y);
            let score = det - 0.05 * trace * trace;
            HarrisScore.setElement(x, y, score);
        }
    }
    // 形态学膨胀（取窗口内最大者为角点）
    const WINDOW_SIZE_2 = 16;
    let results = new Array<Point>();
    for(let y = 0; y < input.height-1; y += WINDOW_SIZE_2) {
        for(let x = 0; x < input.width-1; x += WINDOW_SIZE_2) {
            let window = HarrisScore.getBlock(x, y, WINDOW_SIZE_2, WINDOW_SIZE_2);
            let maxVal = Number.MIN_VALUE;
            let maxIndex = 0;
            for(let i = 0; i < WINDOW_SIZE_2 * WINDOW_SIZE_2; i++) {
                if(window.data[i] > maxVal) {
                    maxVal = window.data[i];
                    maxIndex = i;
                }
            }
            if(maxVal >= threshold) {
                let cornerX = x + (maxIndex % WINDOW_SIZE_2);
                let cornerY = y + Math.floor(maxIndex / WINDOW_SIZE_2);
                results.push([cornerX, cornerY]);
            }
        }
    }
    return results;
}

// 大津二值化
// 2019.08.10
function Otsu(input: Matrix<number>): Matrix<number> {
    // 计算灰度直方图
    let dist = new Array(256);
    for(let i = 0; i < 256; i++) dist[i] = 0;
    for(let i = 0; i < input.data.length; i++) {
        let value = Math.round(input.data[i]);
        dist[value] = (!(dist[value])) ? 1 : (dist[value] + 1);
    }
    // 遍历所有灰度级，寻找最佳阈值
    let maxVariance = Number.MIN_VALUE;
    let bestThreshold = 0;
    for(let threshold = 1; threshold < 255; threshold++) {
        // 计算明暗两类方差
        let darkCount = 0, lightCount = 0;
        let darkAvr = 0, lightAvr = 0;
        for(let i = 0; i < threshold; i++) {
            darkCount += dist[i];
            darkAvr += (i * dist[i]);
        }
        for(let i = threshold; i < 256; i++) {
            lightCount += dist[i];
            lightAvr += (i * dist[i]);
        }
        darkAvr = darkAvr / darkCount;
        lightAvr = lightAvr / lightCount;
        let variance = (darkAvr - lightAvr) * (darkAvr - lightAvr) * (darkCount / input.data.length) * (lightCount / input.data.length);
        // 寻找最大者
        if(variance > maxVariance) {
            maxVariance = variance;
            bestThreshold = threshold;
        }
    }
    console.log(`灰度阈值=${bestThreshold}`);
    // 根据最佳阈值，计算二值化图像
    let result: Matrix<number> = new Matrix(input.width, input.height);
    for(let i = 0; i < input.data.length; i++) {
        result.data[i] = (input.data[i] >= bestThreshold) ? 255 : 0;
    }
    return result;
}
