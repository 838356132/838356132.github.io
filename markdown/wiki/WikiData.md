#!title:    WikiData
#!date:     2018-07-31
#!authors:  Mikukonai
#!cover:    
#!type:     N
#!tags:     

#!content

# 读取WikiData

为了做命名实体识别，首先考虑使用Wikidata作为初始词库。

参阅[Wikidata:Data_access](https://www.wikidata.org/wiki/Wikidata:Data_access)

Wikidata是开放的、通用的结构化知识库。不仅提供URI、SPARQL等多种分实体查询的接口，甚至还提供JSON、XML、RDF等多种格式的全量转储文件，供所有人自由下载。2018年7月30日的转储数据（压缩后的JSON）有36GB之多，考虑到存储空间限制和一些现实因素，暂且不打算处理这个大文件，而是采用HTTPS直接请求JSON，只保留label和alias，保存成比较小的词库。全量转储仅作为备份。

实体的“名称”称为“label”。一般情况下，我需要的当然是中文的label，但是有的时候并没有中文的，所以读取的时候按照中文中国（zh-cn）、中文（zh）、英文（en）的顺序进行读取。个别情况下，某些实体的标签是空的，此种情况下读出的就是空行。

技术上选择Node.js。其实Python貌似更适合干这种事情，但是我不喜欢Python，所以选择Node.js。

Node很让人不爽的一点（或者说是它的特色或者优势）就是它的异步，所以相比于普通方法，用Node写涉及顺序的东西就很麻烦。此外，通过测试，当请求频率过高的时候，服务器会拒绝请求（超时），所以在下面的代码中，每批向队列中加入300个请求，请求间大概延时100ms，15秒后再处理下一批。经测试，按照这个参数，在家里的网络环境下，可以把失败率压制在可以接受的低水平（每100批20次左右失败）。每轮读取（30000个实体）耗时半小时左右。

代码比较简单，写在这里备忘：

```:javascript
var https = require('https');
var fs = require("fs");
var counter = 0;

// 以下两个参数可以动
const batchIndexFrom = 100;  // 从第x批开始
const batchNumber = 100;     // 读取x批

// 以下参数不要动，因涉及请求频率调整。
const batchSize = 300;
const requestDelay = 100;
const batchDelay = 15000;

function requestHTML(QNumber) {
    let path = `/wiki/Special:EntityData/Q${QNumber}.json`;
    let options = {
        hostname: 'www.wikidata.org',
        port: 443,
        path: path,
        method: 'GET'
    };
    let json = '';
    let req = https.request(options, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            json += chunk;
        }).on('end', function () {
            if(res.statusCode !== 200) {
                console.log(`Q${QNumber}: <none>`);
            }
            else {
                let result = JSON.parse(json);

                let entityString = `Q${QNumber}:`;

                if(result === undefined || result.entities === undefined || result.entities['Q'+QNumber] === undefined) {
                    return;
                }

                let labels = result.entities['Q'+QNumber].labels;
                let aliases = result.entities['Q'+QNumber].aliases;

                // 标签
                if(labels['zh-cn'] !== undefined) {
                    entityString += labels['zh-cn'].value;
                }
                else if(labels['zh'] !== undefined) {
                    entityString += labels['zh'].value;
                }
                else if(labels['en'] !== undefined) {
                    entityString += labels['en'].value;
                }
                else {}

                // 别名
                if(aliases['zh-cn'] !== undefined) {
                    for(let i = 0; i < aliases['zh-cn'].length; i++) {
                        entityString += ('|' + aliases['zh-cn'][i].value);
                    }
                }
                else if(aliases['zh'] !== undefined) {
                    for(let i = 0; i < aliases['zh'].length; i++) {
                        entityString += ('|' + aliases['zh'][i].value);
                    }
                }
                else if(aliases['en'] !== undefined) {
                    for(let i = 0; i < aliases['en'].length; i++) {
                        entityString += ('|' + aliases['en'][i].value);
                    }
                }
                else {}

                fs.writeFile(`output-${batchIndexFrom}.txt`, entityString + '\n', {flag:'a'}, function(err) {
                    if (err) {
                        return console.error(err);
                    }
                    console.log(`Q${QNumber}写入成功(${counter})`);
                });

                counter++;
            }
        });
    });

    req.on('error', function (e) {
        console.error(e);
        fs.writeFile(`error-${batchIndexFrom}.log`, `Q${QNumber}: ` + e.toString() + '\n', {flag:'a'}, function(err) {
            if (err) {
                return console.error(err);
            }
        });
    });

    req.end();
}

function requestBatch(batchIndex) {
    for(let i = batchSize * batchIndex; i < batchSize * (batchIndex + 1); i++) {
        setTimeout(function() {
            requestHTML(i);
        }, requestDelay * (i - batchSize * batchIndex));
    }
}

for(let i = batchIndexFrom; i < batchIndexFrom + batchNumber; i++) {
    setTimeout(function() {
        console.log(`\n\n\n\n\n\n\n\n==========\n开始第${i}批（本轮读取还剩${batchIndexFrom + batchNumber - i}批）\n==========\n\n\n\n\n\n\n\n`);
        requestBatch(i);
    }, batchDelay * (i - batchIndexFrom));
}
```

读取出来的个别条目是这样的：

```
Q2004:2008年|MMVIII
Q2003:紐芬蘭-拉布拉多|新發地與拉布拉多|新发地与拉布拉多
Q2159:UTC−10:30|UTC-10:30|西10:30區
Q2001:斯坦利·库布里克
Q2005:JavaScript|爪哇脚本|爪本
Q2008:里昂迪奧公園車站
Q2158:巴伦西亚城|Valencia City
Q2157:1919年
Q2011:Gare de Lyon-Vaise
Q2156:1月3日|一月三日
Q2160:沃洛格達河
Q2010:尾田荣一郎|Eiichirō Oda|Tsuki himizu kikondō
Q2007:西北地区|NWT
Q2012:玛雅历
Q2009:育空|Yukon Territory|the Yukon|YT
Q2162:1921年
Q2163:UTC−10:00|UTC-10|西十區|西10區
```

第一个竖线前的是label，后面诸项是aliases。结构比较简单，便于解析，也照顾到人类阅读。
