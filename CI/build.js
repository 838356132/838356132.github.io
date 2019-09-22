var fs = require('fs');
var ip = require('../js/inspiration-parser.js');

const ARTICLE_PATH = './markdown/-articles.md';
const INSPIRATION_PATH = './markdown/-inspiration.md';
const OUT_PATH = './feed.xml';

const RSS_TEMPLATE = `<?xml version="1.0"?>
<rss version="2.0">
    <channel>
        <title>Project Aurora</title>
        <link>https://mikukonai.com/</link>
        <description>Mikukonai的个人博客</description>
        <language>zh-cn</language>
        <docs>https://mikukonai.com/about.html#RSS</docs>
        <pubDate>(@pubDate@)</pubDate>
        <lastBuildDate>(@lastBuildDate@)</lastBuildDate>
        <generator>PA-RSS</generator>
        <copyright><![CDATA[Copyright &copy; 2016-(@copyrightYear@) Mikukonai]]></copyright>
(@items@)
    </channel>
</rss>
`;

const ITEM_TEMPLATE = `
        <item>
            <title>(@title@)</title>
            <link>(@link@)</link>
            <description><![CDATA[(@description@)]]></description>
            <pubDate>(@itemPubDate@)</pubDate>
            <guid isPermaLink="false">(@guid@)</guid>
        </item>`;

// 将ISO格式的时间日期转换成RSS要求的RFC822格式
// 参考：https://www.w3.org/Protocols/rfc822/#z28
function ISO2RFC(isoDate) {
    return new Date(isoDate).toGMTString();
}

function buildRSS(outPath, kont) {
    fs.readFile(ARTICLE_PATH, {encoding:"utf-8"}, function (err, data) {
        if(err) { throw err; }
        let articlesString = data.toString();

        fs.readFile(INSPIRATION_PATH, {encoding:"utf-8"}, function (err, data) {
            if(err) { throw err; }
            let inspirationString = data.toString();

            // 解析文章列表
            let articles = JSON.parse(articlesString);
            let articleItems = articles.ARTICLES;

            // 解析灵感列表
            let inspirations = ip.InspirationParser(inspirationString).Parser().inspirations;

            // 组装RSS
            let RSS = RSS_TEMPLATE;
            let itemRssArray = new Array();

            for(let i = 0; i < inspirations.length; i++) {
                let item = inspirations[i];
                let itemRSS = new Object();
                itemRSS.date = Date.parse(item.time);
                itemRSS.rss =  ITEM_TEMPLATE.replace('(@title@)',       item.title)
                                            .replace('(@link@)',        "https://mikukonai.com/inspiration.html")
                                            .replace('(@description@)', item.content)
                                            .replace('(@itemPubDate@)', ISO2RFC(item.time))
                                            .replace('(@guid@)',        "https://mikukonai.com/inspiration.html");
                itemRssArray.push(itemRSS);
            }

            for(let i = 0; i < articleItems.length; i++) {
                let item = articleItems[i];
                let itemRSS = new Object();
                itemRSS.date = Date.parse(item.date);
                itemRSS.rss =  ITEM_TEMPLATE.replace('(@title@)',       item.title)
                                            .replace('(@link@)',        `https://mikukonai.com${item.link.substring(1)}`)
                                            .replace('(@description@)', item.title)
                                            .replace('(@itemPubDate@)', ISO2RFC(item.date))
                                            .replace('(@guid@)',        encodeURI(item.title));
                itemRssArray.push(itemRSS);
            }

            // 按时间倒序排序
            itemRssArray.sort((a,b)=>{
                if(isNaN(a.date)) { return -1; }
                else if(isNaN(b.date)) { return 1; }

                if(a.date < b.date) { return 1; }
                else if(a.date > b.date) { return -1; }
                else if(a.date === b.date) { return 0; }
            });

            let itemsRSS = new Array();
            for(let i = 0; i < itemRssArray.length; i++) {
                itemsRSS.push(itemRssArray[i].rss);
            }

            let datetime = new Date().toGMTString();
            RSS =RSS.replace('(@pubDate@)', datetime)
                    .replace('(@lastBuildDate@)', datetime)
                    .replace('(@copyrightYear@)', new Date().getFullYear())
                    .replace('(@items@)', itemsRSS.join('\n'));

            // RSS输出到文件
            fs.writeFile(outPath, RSS, {encoding:"utf-8"}, function (err) {
                if (err) throw err;
                console.log('RSS已生成。');
                kont();
            });

        });


    });
}

// 仅当第一个参数（即提交信息）含有“\[RSS\]”这个模式时，才生成新的feed.xml
((kont)=>{
    let commitMessage = (process.argv)[2];
    if(/\[RSS\]/g.test(commitMessage)) {
        buildRSS(OUT_PATH, kont);
    }
    else {
        kont();
    }
})(()=>{
    console.log("构建完成。");
});
