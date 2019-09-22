#!metadata
{
    "title":"JPEG图像压缩算法",
    "titleImage":"",
    "type":"原创",
    "date":"2019-07-07",
    "author":["Mikukonai"],
    "tags":[]
}

#!content

请尽量使用PC以获得最佳演示效果。

: <button id="loadLena" class="md-button">①Lena原图</button> <button id="loadMenhera" class="md-button">②Menhera原图</button>

: <button id="qualityLena" class="md-button">压缩①</button> <button id="qualityMenhera" class="md-button">压缩②</button>

<canvas id="cv" style="width:256px;height:256px;" width="256" height="256"></canvas>

**说明**：演示了JPEG有损压缩算法的基本原理。熵编码部分尚未完成。DCT和IDCT采用Makhoul提出的快速算法[[1]](#参考资料)进行计算，其中FFT使用C-T算法实现。

# 参考资料

+ Makhoul J . A Fast Cosine Transform in One and Two Dimensions[J]. IEEE Transactions on Acoustics Speech and Signal Processing, 1980, 28(1):27-34.
+ [Fast cosine transform via FFT](https://dsp.stackexchange.com/questions/2807/fast-cosine-transform-via-fft)
+ [Fast discrete cosine transform algorithms](https://www.nayuki.io/page/fast-discrete-cosine-transform-algorithms)
+ [ITU T.81](https://www.w3.org/Graphics/JPEG/itu-t81.pdf)

#!css

canvas {
    display: block;
    border: none;
    box-shadow: 0 2px 5px 0 rgba(0,0,0,0.2);
    margin: 10px auto 10px auto;
}

#!js

#script:./ts/signal.js
#script:./ts/image.js
#script:./ts/jpeg.js
#script:./ts/canvas.js



$(function() {
    let cv = new Canvas('cv', [0,0], [255,255]);

    let timer = 0;

    function loadImage(src, cb) {
        let lena = document.createElement('img');
        lena.src = src;
        lena.addEventListener("load", function() {
            cv.context.drawImage(lena, 0, 0);
            cb();
        });
    }

    function Compress(cv, quality) {
        let YUV = cv.ReadYUV420();
        let jpegImage = new JPEG_Image(YUV.Y, YUV.U, YUV.V);
        jpegImage.quality = quality;
        jpegImage.Encode();
        jpegImage.Decode();

        cv.DrawYUV420(jpegImage.GetYUV());

        let compressedSize = jpegImage.GetStreamLength();
        let originSize = jpegImage.width * jpegImage.height * 3;

        return {
            compressedSize: compressedSize,
            originSize: originSize
        };
    }

    setTimeout(()=>{loadImage("./image/misc/Lena.png", ()=>{});}, 0);

    document.getElementById('loadLena').addEventListener('click', ()=>{
        clearInterval(timer);
        loadImage("./image/misc/Lena.png", ()=>{});
    });
    document.getElementById('loadMenhera').addEventListener('click', ()=>{
        clearInterval(timer);
        loadImage("./image/misc/menhera.png", ()=>{});
    });

    function qualityAnimate(path) {
        clearInterval(timer);
        let quality = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 6, 7, 8];
        let index = 0;
        timer = setInterval(()=>{
            loadImage(path, ()=>{
                let size = Compress(cv, quality[index]);
                cv.context.font = "14px consolas";
                cv.context.fillStyle = "#fff";
                cv.context.shadowColor = 'rgba(0, 0, 0, 0.9)';
                cv.context.shadowOffsetX = 1;
                cv.context.shadowOffsetY = 1;
                cv.context.shadowBlur = 1;
                cv.Text(`质量因子 = ${quality[index]}`, [10, 10]);
                cv.Text(`压缩率 = ${(size.compressedSize / size.originSize).toFixed(3)}`, [10, 30]);
            });
            index++;
            if(index >= quality.length) index = 0;
        }, 200);
    }
    document.getElementById('qualityLena').addEventListener('click', ()=>{
        qualityAnimate("./image/misc/Lena.png");
    });
    document.getElementById('qualityMenhera').addEventListener('click', ()=>{
        qualityAnimate("./image/misc/menhera.png");
    });
});