// Project Aurora
// “灵感”脚本解析和渲染
// 2018.01.28 第一版
// 2019.10.07 以TS重构
// script → [Parser] → structure → [Renderer] → HTML { → [Painter] → 呈现在页面上 }
var DefaultAvatarURL = "./image/haruhi-avatar.jpg";
var Poster = /** @class */ (function () {
    function Poster() {
        this.id = 0;
        this.title = "";
        this.date = "2016-11-24";
        this.imageURL = "";
        this.content = "";
        this.tags = new Array();
    }
    return Poster;
}());
function ParsePosters(script) {
    var posters = new Array();
    // 转义字符替换
    script = Escape(script);
    // 分节
    var sections = script.split(/\n+={5,}\n+/);
    for (var i = 0; i < sections.length; i++) {
        var section = sections[i].trim();
        var poster = new Poster();
        poster.id = i;
        var contentBuffer = new Array();
        // 分行
        var lines = section.split(/[\n\r]/gi);
        for (var j = 0; j < lines.length; j++) {
            var line = lines[j].trim();
            if (/^\@title\:/gi.test(line) === true) {
                var title = line.substring("@title:".length).trim();
                poster.title = title;
            }
            else if (/^\@date\:/gi.test(line) === true) {
                var date = line.substring("@date:".length).trim();
                poster.date = date;
            }
            else if (/^\@imageURL\:/gi.test(line) === true) {
                var imageURL = line.substring("@imageURL:".length).trim();
                poster.imageURL = imageURL;
            }
            else {
                contentBuffer.push(line);
            }
        }
        var contentScript = contentBuffer.join('\n');
        // 将contentScript解析为HTML
        var contentObject = ParseContent(contentScript);
        poster.content = contentObject.HTML;
        poster.tags = contentObject.tags;
        posters.push(poster);
    }
    return posters;
}
function RenderPosters(posters) {
    var AllHtmlBuffer = new Array();
    for (var index = 0; index < posters.length; index++) {
        var poster = posters[index];
        var HtmlBuffer = new Array();
        // 头像
        HtmlBuffer.push("<img src=\"" + DefaultAvatarURL + "\" class=\"poster-avatar\">");
        // 标题
        HtmlBuffer.push("<div class=\"poster-title\">" + poster.title + "</div>");
        // 日期（或者副标题）
        HtmlBuffer.push("<div class=\"poster-subtitle\">" + poster.date + "</div>");
        // 正文(超过400字符即折叠，避免时间线过长)
        var content = poster.content;
        if (content.length > 400) {
            HtmlBuffer.push("<div id=\"pst_" + poster.id + "\" style=\"height:100px;overflow: hidden; margin-top: -8px;\">" + content + "</div><div id=\"mask_" + poster.id + "\" style=\"margin-top: -120px; padding: 120px 0 10px 0; position: relative; height:20px; background: linear-gradient(0deg, rgba(255,255,255,1.0),rgba(255,255,255,0.0)); text-align: center; line-height: 20px; font-weight: bold; color: #b395f0; font-size: 15px;\" onclick=\"$('#pst_" + poster.id + "').css('height', '100%');$('#mask_" + poster.id + "').hide();\">\u25BC \u5C55 \u5F00 \u5168 \u6587</div>");
        }
        else {
            HtmlBuffer.push(content);
        }
        // 图片
        if (poster.imageURL.length > 0) {
            HtmlBuffer.push("<p class=\"poster-p\"><a href=\"" + poster.imageURL + "\"><img id=\"IMG_" + poster.id + "\" src=\"" + poster.imageURL + "\" style=\"max-width:80%;max-height:300px;\" class=\"poster-attachment\"></a></p>");
        }
        AllHtmlBuffer.push("<div id=\"Poster_" + poster.id + "\" class=\"poster\">" + HtmlBuffer.join("") + "</div>");
    }
    var HTML = Unescape(AllHtmlBuffer.join(""));
    return HTML;
}
function ParseContent(contentScript) {
    var tags = new Array();
    var HtmlBuffer = new Array();
    // 分段
    contentScript.trim().split(/\n{2,}/).forEach(function (paragraph, index) {
        HtmlBuffer.push("<p class=\"poster-p\">");
        // 分行
        paragraph.split(/\n{1}/).forEach(function (line, index, lines) {
            // 处理话题标签
            line.split(/#{1}/).forEach(function (slice, index, slices) {
                // 偶数段为标签外文本
                if (index % 2 == 0 || slices.length - 1 == index) {
                    // 处理超链接
                    slice.split(/\[/).forEach(function (link_remain, index, remains) {
                        // 取首次（当然不支持嵌套括号）出现的右括号位置下标
                        var right_bracket = link_remain.search(/\]/);
                        // 没有左括号，视为没有链接
                        if (remains.length == 1) {
                            HtmlBuffer.push(link_remain);
                        }
                        // 如果没有发现右括号，说明是链接前的部分，原样输出
                        else if (right_bracket < 0) {
                            HtmlBuffer.push(link_remain);
                        }
                        else {
                            var urlstr = '';
                            var hasurl = false;
                            // 检查是否有链接字段
                            if (/\]\(.*\)/.test(link_remain)) {
                                hasurl = true;
                                urlstr = link_remain.match(/\]\(.*\)/g)[0]; // 最大匹配范围，因而不可嵌套或并列
                                urlstr = urlstr.substring(2, urlstr.length - 1);
                            }
                            var link = link_remain.substring(0, right_bracket);
                            if (urlstr != '') {
                                HtmlBuffer.push("<a href=\"" + urlstr + "\">" + link + "</a>");
                            }
                            else {
                                HtmlBuffer.push("<a href=\"" + link + "\">" + link + "</a>");
                            }
                            var remnent = link_remain.substring(right_bracket + 1);
                            if (hasurl == true) {
                                var r_index = remnent.search(/\)[^\)]*$/);
                                remnent = remnent.substring(r_index + 1);
                            }
                            HtmlBuffer.push(remnent);
                        }
                    });
                }
                // 标签内文本套上a输出
                else {
                    HtmlBuffer.push(" <a class=\"poster-tag\" href=\"javascript:topic('" + slice + "');\" data-tag=\"" + slice + "\">#" + slice + "#</a> ");
                    tags.push(slice);
                }
            });
            if (!(lines.length == 1 || index == lines.length - 1)) {
                HtmlBuffer.push("<br/>");
            }
        });
        HtmlBuffer.push("</p>");
    });
    return {
        HTML: HtmlBuffer.join(""),
        tags: tags
    };
}
function Escape(input) {
    return input.replace(/\\(?!\\)[#]/g, '@S^').replace(/\\(?!\\)[\[]/g, '@L^')
        .replace(/\\(?!\\)[\]]/g, '@R^').replace(/\\(?!\\)[\(]/g, '@A^')
        .replace(/\\(?!\\)[\)]/g, '@B^').replace(/\\(?!\\)[;]/g, '@C^');
}
function Unescape(input) {
    return input.replace(/@S\^/g, '#').replace(/@L\^/g, '[')
        .replace(/@R\^/g, ']').replace(/@A\^/g, '(')
        .replace(/@B\^/g, ')').replace(/@C\^/g, ';');
}
