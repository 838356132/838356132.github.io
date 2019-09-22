var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var JPEG_Image = /** @class */ (function (_super) {
    __extends(JPEG_Image, _super);
    function JPEG_Image(MatY, MatU, MatV) {
        var _this = _super.call(this) || this;
        _this.quality = 1;
        _this.Channel_Y = MatY;
        _this.Channel_U = MatU;
        _this.Channel_V = MatV;
        _this.width = MatY.width;
        _this.height = MatY.height;
        return _this;
    }
    JPEG_Image.prototype.GetYUV = function () {
        return {
            Y: this.Channel_Y,
            U: this.Channel_U,
            V: this.Channel_V
        };
    };
    JPEG_Image.prototype.GetStreamLength = function () {
        return this.Stream_Y.length + this.Stream_U.length + this.Stream_V.length;
    };
    // RLE/Huffman/DPCM（部分实现）
    JPEG_Image.prototype.CompressBlock = function (blockdata) {
        // 第1步：ZigZag编码
        var zigzag = new Array(JPEG_Image.BLOCK_SIZE * JPEG_Image.BLOCK_SIZE);
        for (var i = 0; i < blockdata.data.length; i++) {
            zigzag[i] = blockdata.data[JPEG_Image.ZigZagIndex[i]];
        }
        // 第2步：游程编码
        var zeroRunLength = 0;
        var RLE = new Array();
        for (var i = 0; i < zigzag.length; i++) {
            if (zigzag[i] === 0 && i < zigzag.length - 1) {
                zeroRunLength++;
            }
            else if (zigzag[i] === 0 && i === zigzag.length - 1) {
                RLE.push("EOB");
                zeroRunLength = 0;
            }
            else {
                RLE.push([zeroRunLength, zigzag[i]]);
                zeroRunLength = 0;
            }
        }
        // 将连续0的长度限制为16以内
        var RLE2 = new Array();
        for (var i = 0; i < RLE.length; i++) {
            var segment = RLE[i];
            if (segment === "EOB") {
                RLE2.push("EOB");
            }
            else if (segment[0] <= 15) {
                RLE2.push(segment);
            }
            else {
                var count = segment[0];
                while (count > 16) {
                    RLE2.push([15, 0]);
                    count -= 16;
                }
                RLE2.push([count, segment[1]]);
            }
        }
        // 第3步：Huffman编码（暂未实现）
        // 第4步：输出一块的字节序列，格式暂且自定义为[块长度（不含此字节，值必是偶数）, (0游程, 值)+, (255, 255)代表EOB]
        var blockSeq = new Array(RLE2.length * 2 + 1);
        blockSeq[0] = RLE2.length * 2;
        var byteCount = 1;
        for (var i = 0; i < RLE2.length; i++) {
            if (RLE2[i] === "EOB") {
                blockSeq[byteCount] = 255;
                byteCount++;
                blockSeq[byteCount] = 255;
                byteCount++;
            }
            else {
                blockSeq[byteCount] = RLE2[i][0];
                byteCount++;
                blockSeq[byteCount] = RLE2[i][1];
                byteCount++;
            }
        }
        return blockSeq;
    };
    // 块解压缩
    JPEG_Image.prototype.DecompressBlock = function (seq) {
        // 第一步：解析RLE
        var len = seq[0];
        var zigzag = new Array();
        for (var i = 1; i < len + 1; i += 2) {
            var runlen = seq[i];
            var value = seq[i + 1];
            if (runlen !== 255) {
                for (var j = 0; j < runlen; j++) {
                    zigzag.push(0);
                }
                zigzag.push(value);
            }
            else {
                for (var j = zigzag.length; j < 64; j++) {
                    zigzag.push(0);
                }
            }
        }
        // 第二步：ZigZag反变换
        var block = new Matrix(JPEG_Image.BLOCK_SIZE, JPEG_Image.BLOCK_SIZE);
        for (var i = 0; i < zigzag.length; i++) {
            block.data[JPEG_Image.ZigZagIndex[i]] = zigzag[i];
        }
        return block;
    };
    // 将原图分成8x8的块，编码为字节流，格式为
    // (width height (块长度 (0游程 值)+ (255 255)?)+)
    JPEG_Image.prototype.EncodeMatrix = function (inputMatrix, QTable, Quality) {
        // 原图像素值移位-128
        inputMatrix.map(function (v) { return (v - 128); });
        // 分块作DCT
        var DCTSpectrum = DCT2d(inputMatrix, JPEG_Image.BLOCK_SIZE);
        // 每一块量化，并编码为字节流
        var byteStream = new Array();
        byteStream.push(inputMatrix.width);
        byteStream.push(inputMatrix.height);
        for (var i = 0; i < DCTSpectrum.matrix.height; i += JPEG_Image.BLOCK_SIZE) {
            for (var j = 0; j < DCTSpectrum.matrix.width; j += JPEG_Image.BLOCK_SIZE) {
                // 取块
                var dctBlock = DCTSpectrum.matrix.getBlock(j, i, JPEG_Image.BLOCK_SIZE, JPEG_Image.BLOCK_SIZE);
                // 量化
                dctBlock.map(function (v, i) { return Math.round(v / (QTable[i] * Quality)); });
                // 编码
                byteStream = byteStream.concat(this.CompressBlock(dctBlock));
            }
        }
        return byteStream;
    };
    JPEG_Image.prototype.DecodeMatrix = function (byteStream, QTable, Quality) {
        // 原图的尺寸
        var width = byteStream[0];
        var height = byteStream[1];
        // 将原图的宽高补足为8的倍数
        var newWidth = Math.ceil(width / JPEG_Image.BLOCK_SIZE) * JPEG_Image.BLOCK_SIZE;
        var newHeight = Math.ceil(height / JPEG_Image.BLOCK_SIZE) * JPEG_Image.BLOCK_SIZE;
        ;
        var origin = new Matrix(newWidth, newHeight);
        // 恢复
        var currentPosition = 2;
        var blockCount = 0;
        do {
            var blockX = JPEG_Image.BLOCK_SIZE * (blockCount % (width / JPEG_Image.BLOCK_SIZE));
            var blockY = JPEG_Image.BLOCK_SIZE * (Math.floor(blockCount / (width / JPEG_Image.BLOCK_SIZE)));
            var blockSeqLen = byteStream[currentPosition];
            var blockSeq = byteStream.slice(currentPosition, currentPosition + blockSeqLen + 1);
            var block = this.DecompressBlock(blockSeq);
            // 反量化
            block.map(function (v, i) { return v * (QTable[i] * Quality); });
            // 对块作IDCT
            var blockIDCT = IDCT2dSquare(block);
            // 嵌入到原图图像中
            origin.setBlock(blockX, blockY, blockIDCT);
            currentPosition += (blockSeqLen + 1);
            blockCount++;
        } while (currentPosition < byteStream.length);
        // 移位+128并clamp到[0,255]
        origin.map(function (v, i) { return JPEG_Image.clamp(v + 128); });
        // 裁剪到原图尺寸
        return origin.getBlock(0, 0, width, height);
    };
    // 图像编码为字节流
    JPEG_Image.prototype.Encode = function () {
        this.Stream_Y = this.EncodeMatrix(this.Channel_Y, JPEG_Image.LuminanceQuantizationTable, this.quality);
        this.Stream_U = this.EncodeMatrix(this.Channel_U, JPEG_Image.ChrominanceQuantizationTable, this.quality);
        this.Stream_V = this.EncodeMatrix(this.Channel_V, JPEG_Image.ChrominanceQuantizationTable, this.quality);
    };
    // 字节流解码为图像矩阵
    JPEG_Image.prototype.Decode = function () {
        this.Channel_Y = this.DecodeMatrix(this.Stream_Y, JPEG_Image.LuminanceQuantizationTable, this.quality);
        this.Channel_U = this.DecodeMatrix(this.Stream_U, JPEG_Image.ChrominanceQuantizationTable, this.quality);
        this.Channel_V = this.DecodeMatrix(this.Stream_V, JPEG_Image.ChrominanceQuantizationTable, this.quality);
    };
    JPEG_Image.BLOCK_SIZE = 8;
    // 亮度量化表
    JPEG_Image.LuminanceQuantizationTable = [
        16, 11, 10, 16, 24, 40, 51, 61,
        12, 12, 14, 19, 26, 58, 60, 55,
        14, 13, 16, 24, 40, 57, 69, 56,
        14, 17, 22, 29, 51, 87, 80, 62,
        18, 22, 37, 56, 68, 109, 103, 77,
        24, 35, 55, 64, 81, 104, 113, 92,
        49, 64, 78, 87, 103, 121, 120, 101,
        72, 92, 95, 98, 112, 100, 103, 99
    ];
    // 色度量化表
    JPEG_Image.ChrominanceQuantizationTable = [
        17, 18, 24, 47, 99, 99, 99, 99,
        18, 21, 26, 66, 99, 99, 99, 99,
        24, 26, 56, 99, 99, 99, 99, 99,
        47, 66, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99,
        99, 99, 99, 99, 99, 99, 99, 99
    ];
    // ZigZag编码的下标映射
    JPEG_Image.ZigZagIndex = [
        0, 1, 8, 16, 9, 2, 3, 10,
        17, 24, 32, 25, 18, 11, 4, 5,
        12, 19, 26, 33, 40, 48, 41, 34,
        27, 20, 13, 6, 7, 14, 21, 28,
        35, 42, 49, 56, 57, 50, 43, 36,
        29, 22, 15, 23, 30, 37, 44, 51,
        58, 59, 52, 45, 38, 31, 39, 46,
        53, 60, 61, 54, 47, 55, 62, 63
    ];
    return JPEG_Image;
}(PAImage));
