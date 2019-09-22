let http = require('http');
let fs = require('fs');
let url = require('url');
let config = {
    'portNumber': 8088,
    'MIME':{
        'css':'text/css',
        'jpg':'image/jpeg',
        'jpeg':'image/jpeg',
        'png':'image/png',
        'gif':'image/gif',
        'bmp':'image/bmp',
        'js':'text/javascript',
        'ico':'image/vnd.microsoft.icon',
        'mp3':'audio/mpeg',
        'woff':'application/x-font-woff',
        'woff2':'font/woff2',
        'ttf':'application/x-font-truetype',
        'otf':'application/x-font-opentype',
    },
};

// 工具函数：用于判断某字符串是否以另一个字符串结尾
String.prototype.endWith = function(str){
    let reg = new RegExp(str + '$', 'i');
    return reg.test(this);
}

// 创建服务器
http.createServer( function (request, response) {
    // 请求数据
    let incomeData = '';
    // 解析请求，包括文件名
    let reqPath = url.parse(request.url).pathname.substr(1);

    request.on('data', function (chunk) {
        incomeData += chunk;
    });

    request.on('end', function () {
        let now = new Date();
        console.log(`${now.toLocaleDateString()} ${now.toLocaleTimeString()} 收到请求：${reqPath}`);
        // 默认主页
        if(reqPath === '') {
            readFileSystem('index.html');
        }
        else {
            readFileSystem(decodeURI(reqPath));
        }

        // 从文件系统读取相应的数据，向客户端返回
        function readFileSystem(reqPath) {
            fs.readFile(reqPath, function (err, data) {
                // 处理404，返回预先设置好的404页
                if(err) {
                    console.log("404 ERROR");
                    fs.readFile('404.html', function (err, data) {
                        // 如果连404页都找不到
                        if(err) {
                            response.writeHead(404, {'Content-Type': 'text/html'});
                            response.write('<head><meta charset="utf-8"/></head><h1>真·404</h1>');
                        }
                        else{
                            response.writeHead(404, {'Content-Type': 'text/html'});
                            response.write(data.toString());
                        }
                        response.end(); // 响应
                    });
                    return;
                }
                else{
                    // 读取文件信息
                    // fs.stat(reqPath, function(err, stats) {
                    //     if(err) {
                    //         throw err;
                    //     }
                    //     else {
                    //         console.log(`文件‘${reqPath}’大小：${(stats.size/1024).toFixed(2)}KiB`);
                    //     }
                    // });
                    // 默认MIME标记
                    let defaultFlag = true;
                    // 根据后缀，检查所有的已有的MIME类型（如果可以硬编码是不是好一点？可能要用到所谓的元编程了）
                    for(let suffix in config.MIME) {
                        if(reqPath.endWith('.' + suffix)) {
                            defaultFlag = false;
                            let mimeType = config.MIME[suffix];
                            response.writeHead(200, {'Content-Type': mimeType});
                            if((mimeType.split('/'))[0] === 'text') {
                                response.write(data.toString());
                            }
                            else {
                                response.write(data);
                            }
                        }
                    }
                    // 默认MIME类型：text
                    if(defaultFlag === true) {
                        response.writeHead(200, {'Content-Type': 'text/html'});
                        response.write(data.toString());
                    }
                }
                response.end(); // 响应
            });
        }
    });

}).listen(config.portNumber);

console.log(`服务器已启动，正在监听端口：${config.portNumber}`);