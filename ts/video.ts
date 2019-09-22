
// 计算两帧图像的均方误差
function MSE(Frame1: Matrix<number>, Frame2: Matrix<number>): number {
    if(Frame1.width !== Frame2.width || Frame1.height !== Frame2.height) return Number.NEGATIVE_INFINITY;
    let sum = 0;
    for(let i = 0; i < Frame1.data.length; i++) {
        sum += ((Frame1.data[i] - Frame2.data[i]) * (Frame1.data[i] - Frame2.data[i]));
    }
    return sum / Frame1.data.length;
}

// 计算两个向量的相似度
function VectorSimilarity(v1: Point, v2: Point): number {
    if((!v1) || (!v2)) return Number.NEGATIVE_INFINITY;
    function Len(v: Point): number {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    }
    let len1 = Len(v1);
    let len2 = Len(v2);
    function CosineSimilarity(v1: Point, v2: Point): number {
        let a = v1[0] * v2[0] + v1[1] * v2[1];
        let b = Math.sqrt(len1 * len2);
        return a / b;
    }
    return CosineSimilarity(v1,v2) / ((Math.abs(len1 - len2) / Math.min(len1, len2)) + 0.001);
}

// 运动矢量计算：基于全搜索

function MV(Frame1: Matrix<number>, Frame2: Matrix<number>, BLOCK_SIZE: number, WINDOW_SIZE: number): Matrix<Point> {
    let BlockRow = 0;
    let BlockCol = 0;
    let MVmatrix = new Matrix<Point>(
        Math.floor((Frame2.width-1) / BLOCK_SIZE),
        Math.floor((Frame2.height-1) / BLOCK_SIZE));

    // 对当前帧分块计算MV
    for(let y = 0; y < Frame2.height - BLOCK_SIZE; y += BLOCK_SIZE) {
        BlockCol = 0;
        for(let x = 0; x < Frame2.width - BLOCK_SIZE; x += BLOCK_SIZE) {
            // 当前帧的当前块
            let block = Frame2.getBlock(x, y, BLOCK_SIZE, BLOCK_SIZE);
            // 首先跟上一帧的相同位置比较，如果MSE小于某一阈值，则认定为静止块
            let prevBlock = Frame1.getBlock(x, y, BLOCK_SIZE, BLOCK_SIZE);
            if(MSE(prevBlock, block) < 50) { // TODO：此参数可以用来控制静止块比例，以动态控制码率
                MVmatrix.setElement(BlockCol, BlockRow, [0, 0]);
            }
            // 在上一帧的邻域中搜索最相似的位置
            else {
                // 自适应步长的三步搜索
                let bestMSE = Number.MAX_VALUE;
                let bestStep = 0;
                let bestMV;
                for(let step = 4; step < 17; step++) {
                    let x0 = x, y0 = y;
                    let minMSE = Number.MAX_VALUE, STEP = step;
                    for(let level = 0; level < 3; level++) {
                        let neighbour: Array<Point> = new Array<Point>();
                        let mse: Array<number> = new Array();
                        // 1  2  3
                        // 8  0  4
                        // 7  6  5
                        neighbour[0] = [x0, y0];
                        neighbour[1] = [x0 - STEP, y0 - STEP];
                        neighbour[2] = [x0, y0 - STEP];
                        neighbour[3] = [x0 + STEP, y0 - STEP];
                        neighbour[4] = [x0 + STEP, y0];
                        neighbour[5] = [x0 + STEP, y0 + STEP];
                        neighbour[6] = [x0, y0 + STEP];
                        neighbour[7] = [x0 - STEP, y0 + STEP];
                        neighbour[8] = [x0 - STEP, y0];
                        // 计算采样点处的MSE
                        for(let i = 0; i < neighbour.length; i++) {
                            let RefBlock = Frame1.getBlock(neighbour[i][0], neighbour[i][1], BLOCK_SIZE, BLOCK_SIZE);
                            mse[i] = MSE(RefBlock, block);
                        }
                        // 寻找MSE最小的采样点
                        for(let i = 0; i < neighbour.length; i++) {
                            if(mse[i] < minMSE) {
                                minMSE = mse[i];
                                x0 = neighbour[i][0];
                                y0 = neighbour[i][1];
                            }
                        }
                        // 步长减半
                        STEP = (STEP >> 1);
                    }
                    if(minMSE < bestMSE) {
                        bestMSE = minMSE;
                        bestStep = step;
                        bestMV = [x0-x, y0-y];
                    }
                }
                MVmatrix.setElement(BlockCol, BlockRow, bestMV);
/*
                // 全搜索
                let MSEmatrix = new Matrix<number>(WINDOW_SIZE, WINDOW_SIZE);
                for(let j = y - (WINDOW_SIZE >> 1); j < y + (WINDOW_SIZE >> 1); j++) {
                    for(let i = x - (WINDOW_SIZE >> 1); i < x + (WINDOW_SIZE >> 1); i++) {
                        let RefBlock = Frame1.getBlock(i, j, BLOCK_SIZE, BLOCK_SIZE);
                        MSEmatrix.setElement(i + (WINDOW_SIZE >> 1) - x, j + (WINDOW_SIZE >> 1) - y, MSE(RefBlock, block));
                    }
                }
                // 寻找均方误差最小的相对位置，即为MV
                let minVal = Number.MAX_VALUE;
                let MV: Point = [0, 0];
                for(let j = 0; j < WINDOW_SIZE; j++) {
                    for(let i = 0; i < WINDOW_SIZE; i++) {
                        let cval = MSEmatrix.getElement(i, j);
                        if(cval < minVal) {
                            minVal = cval;
                            MV = [(i-(WINDOW_SIZE >> 1)), (j-(WINDOW_SIZE >> 1))];
                        }
                    }
                }
                // 记录MV
                MVmatrix.setElement(BlockCol, BlockRow, MV);
*/
            }
            BlockCol++;
        }
        // console.log(`${BlockRow}行完成`);
        BlockRow++;
    }

    // 基于MV连续的假设，对MV场作平滑处理
    let newMVmatrix = new Matrix<Point>(
        Math.floor((Frame2.width-1) / BLOCK_SIZE),
        Math.floor((Frame2.height-1) / BLOCK_SIZE));
    for(let y = 0; y < MVmatrix.height; y++) {
        for(let x = 0; x < MVmatrix.width; x++) {
            let current = MVmatrix.getElement(x,y);
            let up   = MVmatrix.getElement(x, y-1);
            let down = MVmatrix.getElement(x, y+1);
            let left = MVmatrix.getElement(x-1, y);
            let right= MVmatrix.getElement(x+1, y);
            up   = (up === undefined) ? [0, 0] : up;
            down = (down === undefined) ? [0, 0] : down;
            left = (left === undefined) ? [0, 0] : left;
            right= (right === undefined) ? [0, 0] : right;
            let avr: Point = [
                ((up[0] + down[0] + left[0] + right[0]) >> 2),
                ((up[1] + down[1] + left[1] + right[1]) >> 2)
            ];
            if(VectorSimilarity(avr, current) < 500) { // TODO：参数
                newMVmatrix.setElement(x, y, avr);
            }
            else {
                newMVmatrix.setElement(x, y, current);
            }
        }
    }

    // 结束，返回
    return newMVmatrix;
}
