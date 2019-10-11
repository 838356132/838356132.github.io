// Mikumark V3.0
// Project Aurora - Markdown Parser
// 2019.10 Refactored in TypeScript
// Arch:
// MD → [Parser] → MarkdownDocument object(HTML included) → [Painter] → Web page
var Mikumark = /** @class */ (function () {
    function Mikumark(doc) {
        this.title = "标题";
        this.author = ["作者1", "作者2"];
        this.date = "2019-10-12";
        this.cover = "封面";
        this.type = "原创";
        this.tags = ["标签"];
        this.markdown = doc;
        this.outline = new Array();
        this.inlineStyle = "";
        this.inlineScript = "";
        this.macros = new Map();
        this.titleCount = 0;
        this.HTML = this.ParseDoc(this.markdown);
    }
    // 元字符转义
    Mikumark.EscapeMetachar = function (str) {
        return str
            .replace(/\\\*/g, Mikumark.C_STAR).replace(/\\\~/g, Mikumark.C_WAVE).replace(/\\\`/g, Mikumark.C_REVQ)
            .replace(/\\\[/g, Mikumark.C_LSQB).replace(/\\\]/g, Mikumark.C_RSQB).replace(/\\\(/g, Mikumark.C_LRDB)
            .replace(/\\\)/g, Mikumark.C_RRDB).replace(/\\\$/g, Mikumark.C_DOLR).replace(/\\\|/g, Mikumark.C_VERT)
            .replace(/\\\+/g, Mikumark.C_PLUS).replace(/\\\\/g, Mikumark.C_BSLT).replace(/\\\#/g, Mikumark.C_SHRP)
            .replace(/\\\-/g, Mikumark.C_MNUS).replace(/\\\&/g, Mikumark.C_AMPS).replace(/\\\%/g, Mikumark.C_PCNT);
    };
    // 元字符覆盖
    Mikumark.CoverMetachar = function (str) {
        return str
            .replace(/\*/g, Mikumark.C_STAR).replace(/\~/g, Mikumark.C_WAVE).replace(/\`/g, Mikumark.C_REVQ)
            .replace(/\[/g, Mikumark.C_LSQB).replace(/\]/g, Mikumark.C_RSQB).replace(/\(/g, Mikumark.C_LRDB)
            .replace(/\)/g, Mikumark.C_RRDB).replace(/\$/g, Mikumark.C_DOLR).replace(/\|/g, Mikumark.C_VERT)
            .replace(/\+/g, Mikumark.C_PLUS).replace(/\\/g, Mikumark.C_BSLT).replace(/\#/g, Mikumark.C_SHRP)
            .replace(/\-/g, Mikumark.C_MNUS).replace(/\&/g, Mikumark.C_AMPS).replace(/\%/g, Mikumark.C_PCNT);
    };
    // 元字符换回
    Mikumark.RecoverMetachar = function (str) {
        return str
            .replace(new RegExp(Mikumark.C_STAR, 'g'), '*').replace(new RegExp(Mikumark.C_WAVE, 'g'), '~').replace(new RegExp(Mikumark.C_REVQ, 'g'), '`')
            .replace(new RegExp(Mikumark.C_LSQB, 'g'), '[').replace(new RegExp(Mikumark.C_RSQB, 'g'), ']').replace(new RegExp(Mikumark.C_LRDB, 'g'), '(')
            .replace(new RegExp(Mikumark.C_RRDB, 'g'), ')').replace(new RegExp(Mikumark.C_DOLR, 'g'), '$').replace(new RegExp(Mikumark.C_VERT, 'g'), '|')
            .replace(new RegExp(Mikumark.C_PLUS, 'g'), '+').replace(new RegExp(Mikumark.C_BSLT, 'g'), '\\').replace(new RegExp(Mikumark.C_SHRP, 'g'), '#')
            .replace(new RegExp(Mikumark.C_MNUS, 'g'), '-').replace(new RegExp(Mikumark.C_AMPS, 'g'), '&').replace(new RegExp(Mikumark.C_PCNT, 'g'), '%');
    };
    // 段内样式解析
    Mikumark.prototype.ParseInnerPara = function (md) {
        var RegexInlineCode = /\`(.+?)\`/g;
        var RegexTag = /\#\((.+?)\)\#/g;
        var RegexBold = /\*\*(.+?)\*\*/g;
        var RegexItalic = /%%(.+?)%%/g;
        var RegexDeleted = /~(.+?)~/g;
        var RegexColor = /\[\[(#?[a-zA-Z0-9]+?)\:(.+?)#\]\]/g;
        var RegexLink = /\[(.+?)\]\((.+?)\)/g;
        // 首先处理换行
        var HTML = md.replace(/[\n\r]/g, "<br/>");
        // 处理宏展开（注意：不会递归展开，每个宏只被展开一次）
        for (var macro in this.macros) {
            HTML = HTML.replace(new RegExp(macro, "g"), this.macros[macro]);
        }
        // 行内代码：需要特殊处理，其内的所有元字符都应被转义，防止解析成HTML标签。（不会处理已屏蔽的元字符）
        var inlineCodeSegments = RegexInlineCode.exec(HTML);
        while (inlineCodeSegments !== null) {
            HTML = HTML.replace(inlineCodeSegments[0], "<code>" + Mikumark.CoverMetachar(inlineCodeSegments[1]) + "</code>");
            inlineCodeSegments = RegexInlineCode.exec(HTML);
        }
        // TODO 处理标签
        HTML = HTML.replace(RegexTag, "<span class=\"tag\">$1</span>")
            .replace(RegexBold, "<strong>$1</strong>")
            .replace(RegexItalic, "<i>$1</i>")
            .replace(RegexDeleted, "<del>$1</del>")
            .replace(RegexColor, "<span style=\"color:$1;\">$2</span>")
            .replace(RegexLink, "<a href=\"$2\">$1</a>");
        return Mikumark.RecoverMetachar(HTML);
    };
    // 段落级样式解析
    Mikumark.prototype.ParsePara = function (md) {
        if (md.length <= 0)
            return "";
        var HtmlBuffer = new Array();
        md = md.trim();
        // 标题
        if (/^#+?(?![\!\(]).+/g.test(md) === true) {
            var level = (md.match(/^#+(?=[^#])/i)[0]).length;
            var title = md.replace(/^#+/g, "").trim();
            HtmlBuffer.push("<h" + level + " id=\"Title_" + this.titleCount + "\">" + title + "</h" + level + ">");
            this.titleCount++;
            // TODO 处理目录
        }
        // 分割线（至少3个连续dash的单行段落）
        else if (/^\-{3,}$/g.test(md) === true) {
            HtmlBuffer.push("<hr/>");
        }
        // 有序列表（+号开头的段落）
        else if (/^\++[\s\S]+/g.test(md) === true) {
            // 按行分割列表项
            var lines = md.split("\n");
            // 层级计数器
            var currentLevel = 0;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                // 计算+号数量（列表层级）
                var prefix = line.match(/^\++(?=[^\+])/i);
                if (prefix == null) {
                    HtmlBuffer.push(md);
                    break;
                }
                var level = prefix[0].length;
                // 列表文本
                var item = line.replace(/^\++/g, "").trim();
                // 判断层级是否改变
                if (level > currentLevel) { // 嵌套加深
                    for (var c = 0; c < (level - currentLevel); c++) {
                        HtmlBuffer.push("<ol>");
                    }
                    HtmlBuffer.push("<li>");
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
                else if (level < currentLevel) { // 嵌套退出
                    for (var c = 0; c < (currentLevel - level); c++) {
                        HtmlBuffer.push("</li></ol>");
                    }
                    HtmlBuffer.push("</li><li>");
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
                else { // 保持同级
                    HtmlBuffer.push("</li><li>");
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
            }
            // 闭合列表标签
            for (var c = 0; c < currentLevel; c++) {
                HtmlBuffer.push("</li></ol>");
            }
        }
        // 无序列表（-号开头的段落）
        else if (/^\-+[\s\S]+/g.test(md) === true) {
            // 按行分割列表项
            var lines = md.split("\n");
            // 层级计数器
            var currentLevel = 0;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                // 计算-号数量（列表层级）
                var prefix = line.match(/^\-+(?=[^\-])/i);
                if (prefix == null) {
                    HtmlBuffer.push(md);
                    break;
                }
                var level = prefix[0].length;
                // 列表文本
                var item = line.replace(/^\-+/g, "").trim();
                // 判断层级是否改变
                if (level > currentLevel) { // 嵌套加深
                    for (var c = 0; c < (level - currentLevel); c++) {
                        HtmlBuffer.push("<ul>");
                    }
                    HtmlBuffer.push("<li>");
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
                else if (level < currentLevel) { // 嵌套退出
                    for (var c = 0; c < (currentLevel - level); c++) {
                        HtmlBuffer.push("</li></ul>");
                    }
                    HtmlBuffer.push("</li><li>");
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
                else { // 保持同级
                    HtmlBuffer.push("</li><li>");
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
            }
            // 闭合列表标签
            for (var c = 0; c < currentLevel; c++) {
                HtmlBuffer.push("</li></ul>");
            }
        }
        // 表格
        else if (/^\|[\s\S]+\|$/g.test(md) === true) {
            // 按行分割
            var rows = md.split("\n");
            // 分割线标识
            var hasHeadline = false;
            // 对齐方式：下标为列序号（从1开始）
            var alignType = new Array();
            HtmlBuffer.push('<div class="md-table-container"><table class="md-table">');
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var cols = row.split("|");
                if (cols.length <= 2) {
                    console.log("Syntax error.");
                    return;
                }
                if (cols.length == 3 && /\-{3,}/i.test(cols[1]) == true) {
                    hasHeadline = true;
                }
                else {
                    HtmlBuffer.push('<tr>');
                    if (hasHeadline == true) { // TD表格主体
                        for (var c = 1; c < cols.length - 1; c++) {
                            HtmlBuffer.push("<td" + (alignType[c] ? alignType[c] : '') + ">" + this.ParseInnerPara(cols[c]) + "</td>");
                        }
                    }
                    else { // TH表头
                        for (var c = 1; c < cols.length - 1; c++) {
                            // 记录对齐方式
                            if (/^\:.*\:$/gi.test(cols[c])) {
                                alignType[c] = " style=\"text-align:center;\"";
                            }
                            else if (/\:$/gi.test(cols[c])) {
                                alignType[c] = " style=\"text-align:right;\"";
                            }
                            else if (/^\:/gi.test(cols[c])) {
                                alignType[c] = " style=\"text-align:left;\"";
                            }
                            else {
                                alignType[c] = '';
                            }
                            cols[c] = cols[c].replace(/\:$/gi, '').replace(/^\:/gi, '');
                            HtmlBuffer.push("<th" + (alignType[c] ? alignType[c] : '') + ">" + this.ParseInnerPara(cols[c]) + "</th>");
                        }
                    }
                    HtmlBuffer.push('</tr>');
                }
            }
            HtmlBuffer.push('</table></div>');
        }
        // 图片
        else if (/^\!\[.+?\]\(.+?\)$/g.test(md) === true) {
            var imgTitle = md.match(/^\!\[.+\]\(/g)[0];
            imgTitle = imgTitle.substring(2, imgTitle.length - 2);
            var imgURL = md.match(/\]\([^(\]\()]+\)$/g)[0];
            imgURL = imgURL.substring(2, imgURL.length - 1);
            HtmlBuffer.push("<div class=\"imgbox\">\n            <div class=\"loading\">\n                <div class=\"dot\"></div><div class=\"dot\"></div><div class=\"dot\"></div><div class=\"dot\"></div><div class=\"dot\"></div>\n            </div>\n            <img class=\"md_img\" data-src=\"" + imgURL + "\"><div class=\"imgtitle\">" + this.ParseInnerPara(imgTitle) + "</div></div>");
        }
        // 居中的段落
        else if (/^\:.+/g.test(md) === true) {
            var content = md.substring(1).trim(); // 截取:号后面的内容
            HtmlBuffer.push("<p style=\"text-align:center;\">" + this.ParseInnerPara(content) + "</p>");
        }
        // LaTeX公式段落
        else if (/^\$\$.+?\$\$$/g.test(md) === true) {
            HtmlBuffer.push("<p>" + md + "</p>");
        }
        // 单个HTML元素，直接原样返回
        else if (/^<.+?>[\s\S]>$/g.test(md) === true) {
            HtmlBuffer.push(md);
        }
        // 普通段落
        else {
            HtmlBuffer.push("<p>" + this.ParseInnerPara(md) + "</p>");
        }
        return HtmlBuffer.join("");
    };
    // 跨段落样式解析
    Mikumark.prototype.ParseInterPara = function (md) {
        var HtmlBuffer = new Array();
        // 引用块计数
        var quoteFlag = false;
        var quoteLevel = 0;
        // 代码块标识
        var codeFlag = false;
        // 代码块语言标识
        var codeLanguage = '';
        // 跨自然段的括号层次计数
        var bracketLevel = 0;
        // 自然段落分隔
        var paragraphs = md.split(/\n{2,}/g);
        // 遍历各个段落，判断段落类型
        for (var pcount = 0; pcount < paragraphs.length; pcount++) {
            var paragraph = paragraphs[pcount];
            // 引用框？
            if (/^>.+/g.test(paragraph) === true) {
                quoteFlag = true;
                // 计算>号数量（引用层级）
                var level = (paragraph.match(/^>+(?=[^>])/i)[0]).length;
                // 计算引用文本
                // let quoteFrom = paragraph.search(/\>(?=[^\>])/i) + 1; // 最后一个>号的下一位
                // let quote = paragraph.substring(quoteFrom); // 截取>号后面的内容（含空格）
                // quote = quote.trim(); // 去掉>号和内容之间的空格
                var quote = paragraph.replace(/^>+/, "").trim();
                // 判断层级是否改变
                if (level > quoteLevel) { // 嵌套加深
                    for (var c = 0; c < (level - quoteLevel); c++) {
                        HtmlBuffer.push('<blockquote>');
                    }
                    HtmlBuffer.push(this.ParsePara(quote));
                }
                else if (level < quoteLevel) { // 嵌套退出
                    for (var c = 0; c < (quoteLevel - level); c++) {
                        HtmlBuffer.push('</blockquote>');
                    }
                    HtmlBuffer.push(this.ParsePara(quote));
                }
                else { // 保持同级，不加标签
                    HtmlBuffer.push(this.ParsePara(quote));
                }
                quoteLevel = level;
            }
            // 代码分界符所在的段
            else if (/((```)|(```(\:.*)?))/g.test(paragraph) === true) {
                var codeLanguages = paragraph.match(/\:.*/g);
                if (codeLanguages != null) {
                    codeLanguage = codeLanguages[0].substring(1);
                }
                else {
                    codeLanguage = '.';
                }
                if (codeFlag == false) {
                    codeFlag = true;
                    bracketLevel = 0;
                    HtmlBuffer.push("<pre><code>");
                }
                else {
                    codeFlag = false;
                    HtmlBuffer.pop(); // 删除最后一个空行
                    HtmlBuffer.push("</code></pre>");
                }
            }
            // 除引用和代码之外的段落
            else {
                // 处理代码块
                if (codeFlag == true) {
                    // TODO 代码高亮
                    // let highlighted = this.codeHighlighter(paragraph, codeLanguage, bracketLevel);
                    // bracketLevel = highlighted[1];
                    // HtmlBuffer.push(highlighted[0]);
                    HtmlBuffer.push("\n\n");
                    continue;
                }
                // 闭合引用标签，并退出引用状态
                if (quoteFlag == true) {
                    for (var c = 0; c < quoteLevel; c++) {
                        HtmlBuffer.push('</blockquote>');
                    }
                    quoteLevel = 0;
                }
                quoteFlag = false;
                HtmlBuffer.push(this.ParsePara(paragraph));
            }
        }
        return HtmlBuffer.join("");
    };
    // 文档结构解析
    Mikumark.prototype.ParseDoc = function (doc) {
        // TODO
        return this.ParseInterPara(doc);
    };
    // 元字符常量
    Mikumark.C_STAR = '@STAR@'; // *
    Mikumark.C_WAVE = "@WAVE@"; // ~
    Mikumark.C_REVQ = "@REVQ@"; // `
    Mikumark.C_LSQB = "@LSQB@"; // [
    Mikumark.C_RSQB = "@RSQB@"; // ]
    Mikumark.C_LRDB = "@LRDB@"; // (
    Mikumark.C_RRDB = "@RRDB@"; // )
    Mikumark.C_DOLR = "@DOLR@"; // $
    Mikumark.C_VERT = "@VERT@"; // |
    Mikumark.C_PLUS = "@PLUS@"; // +
    Mikumark.C_MNUS = "@MNUS@"; // -
    Mikumark.C_BSLT = "@BSLT@"; // \
    Mikumark.C_SHRP = "@SHRP@"; // #
    Mikumark.C_AMPS = "@AMPS@"; // &
    Mikumark.C_PCNT = "@PCNT@"; // %
    return Mikumark;
}());
// 测试
var md = "\n\n: <button id=\"origin1\" class=\"md-button\">\u539F\u56FE1</button> <button id=\"origin2\" class=\"md-button\">\u539F\u56FE2</button> <button id=\"origin3\" class=\"md-button\">\u539F\u56FE3</button> <button id=\"origin4\" class=\"md-button\">\u539F\u56FE4</button> <button id=\"origin5\" class=\"md-button\">\u539F\u56FE5</button> <button id=\"origin6\" class=\"md-button\">\u539F\u56FE6</button>\n\n: <button id=\"otsu\" class=\"md-button\" style=\"width: 100%;\">\u4E8C\u503C\u5316</button>\n\n<canvas id=\"cv\" style=\"width:640px;height:360px;\" width=\"640\" height=\"360\"></canvas>\n\n\n# 0 \u57FA\u7EBF\u7EF4\u62A4\u8BB0\u5F55\n\n|\u57FA\u7EBF\u7F16\u53F7|\u5F62\u6210\u65E5\u671F|:\u6570\u636E\u91CF|:\u589E\u91CF|\n|-----------------------|\n|0|2019\u5E745\u6708\u4E0B\u65EC|-|-|\n|1|2019.05.31|-|Delta0: 7.12GB|\n|2|2019.06.30|-|Delta1: 210GB|\n|3|2019.07.31|-|Delta2: 27.5GB|\n|4|2019.08.31|1.05TB|Delta3: 74.3GB|\n|5|2019.09.30|1.05TB|Delta4: 1.2GB|\n\n\n# 1 \u4EFB\u52A1\u4E0E\u76EE\u6807\n\n## 1.1 \u6982\u8FF0\n\n> \u4E2A\u4EBA\u77E5\u8BC6\u7BA1\u7406\u603B\u65B9\u9488\uFF1A\n\u7CBE\u7B80\u76D8\u6D3B\u5B58\u91CF\uFF0C\u4E25\u683C\u63A7\u5236\u589E\u91CF\u3002\u5408\u7406\u9AD8\u6548\u5907\u4EFD\uFF0C\u4FDD\u8BC1\u77E5\u8BC6\u6709\u7528\u3001\u6709\u5E8F\u3001\u5B89\u5168\u3002\n\n\u8FD9\u4EFD\u6587\u6863\u8BD5\u56FE\u5C31**\u4E2A\u4EBA\u77E5\u8BC6\u7BA1\u7406**\u8FD9\u4E00\u96BE\u9898\uFF0C\u7ED9\u51FA**\u660E\u786E**\u3001**\u5408\u7406**\u3001**\u53EF\u884C**\u7684\u89E3\u51B3\u65B9\u6848\uFF0C\u4EE5\u671F\u5728\u4FE1\u606F\u8FC7\u8F7D\u7684\u751F\u6D3B\u4E2D\uFF0C\u5C3D\u53EF\u80FD\u505A\u597D\u77E5\u8BC6\u7684\u8BB0\u5F55\u3001\u5229\u7528\u3001\u5185\u5316\u548C\u4F20\u9012\u3002\n\n\u4EE5\u5F80\uFF0C\u4E2A\u4EBA\u77E5\u8BC6\u7BA1\u7406\u9762\u4E34\u4E24\u65B9\u9762\u6311\u6218\uFF1A\u4E00\u65B9\u9762\u662F\u5B58\u91CF\u6570\u636E\u7684\u7EF4\u62A4\u3002\u591A\u5E74\u6765\uFF0C\u79EF\u7D2F\u4E86\u5927\u91CF\u6570\u636E\uFF0C\u9762\u4E34\u5F88\u5927\u7684\u4E22\u5931\u548C\u635F\u574F\u7684\u98CE\u9669\u3002\u5C3D\u7BA1\u5DF2\u7ECF\u91C7\u53D6\u5907\u4EFD\u7B49\u624B\u6BB5\uFF0C\u4F46\u4ECD\u7136\u53D1\u751F\u8FC7\u4E8B\u6545\uFF0C\u9020\u6210\u4E00\u5B9A\u7A0B\u5EA6\u7684\u6570\u636E\u635F\u5931\u3002\u53E6\u4E00\u65B9\u9762\u662F\u589E\u91CF\u6570\u636E\u7684\u6536\u96C6\u3002\u5E73\u65E5\u6536\u96C6\u4E86\u5927\u91CF\u7684\u4FE1\u606F\uFF0C\u957F\u671F\u4EE5\u6765\uFF0C\u5E76\u6CA1\u6709\u7BA1\u7406\u597D\u3001\u5229\u7528\u597D\uFF0C\u5BFC\u81F4\u660E\u660E\u6536\u96C6\u4E86\u5927\u91CF\u7684\u4FE1\u606F\uFF0C\u5374\u6CA1\u529E\u6CD5\u6709\u6548\u5730\u5229\u7528\uFF0C\u6CA1\u6709\u8FBE\u5230\u5B66\u4E60\u548C\u4F7F\u7528\u7684\u76EE\u7684\u3002\u9274\u4E8E\u6B64\uFF0C\u5982\u4F55\u5728\u4FE1\u606F\u8FC7\u8F7D\u3001\u77E5\u8BC6\u7206\u70B8\u7684\u80CC\u666F\u4E0B\uFF0C\u63D0\u9AD8\u6570\u636E\u548C\u77E5\u8BC6\u7684\u6536\u96C6\u3001\u7B5B\u9009\u3001\u5206\u7C7B\u3001\u7EF4\u62A4\u3001\u5229\u7528\u7684\u6548\u7387\u548C\u8D28\u91CF\uFF0C\u662F\u5FC5\u987B\u89E3\u51B3\u7684\u4E00\u4E2A\u91CD\u5927\u95EE\u9898\u3002\n\n\u5728\u5F88\u957F\u7684\u4E00\u6BB5\u65F6\u95F4\u91CC\uFF0C\u66FE\u5C1D\u8BD5\u8FC7\u591A\u79CD\u7B80\u5355\u7684\u5907\u4EFD\u548C\u5206\u7C7B\u7B56\u7565\uFF0C\u4F46\u662F\u6548\u679C\u90FD\u4E0D\u597D\uFF0C\u751A\u81F3\u6BCF\u6B21\u5C1D\u8BD5\u90FD\u6253\u4E71\u4E86\u5DF2\u7ECF\u5F62\u6210\u7684\u6570\u636E\u548C\u7EF4\u62A4\u4E60\u60EF\u3002\u5728\u603B\u7ED3\u4EE5\u5F80\u7ECF\u9A8C\u6559\u8BAD\u7684\u57FA\u7840\u4E0A\uFF0C\u672C\u6587\u6863\u501F\u9274\u56FE\u4E66\u60C5\u62A5\u5B66\u7684\u77E5\u8BC6\uFF0C\u4EE5\u53CAGit\u7B49\u5DE5\u5177\u7684\u8BBE\u8BA1\u601D\u60F3\uFF0C\u8BD5\u56FE\u63D0\u51FA\u660E\u786E\u3001\u5408\u7406\u3001\u53EF\u884C\u7684\u4E2A\u4EBA\u77E5\u8BC6\u7BA1\u7406\u7B56\u7565\u3002\n\n- \u660E\u786E\uFF1A\u6E05\u695A\u660E\u786E\u4E0D\u542B\u7CCA\u7684\n- \u5408\u7406\uFF1A\u7CFB\u7EDF\u5316\u7684\u3001\u9075\u5FAA\u77E5\u8BC6\u7BA1\u7406\u539F\u7406\u7684\n- \u53EF\u884C\uFF1A\u53EF\u64CD\u4F5C\u3001\u6613\u4E8E\u64CD\u4F5C\u3001\u7B26\u5408\u65E5\u5E38\u76F4\u89C9\u7684\n\n\u672C\u7B56\u7565\u7531\u8F6F\u786C\u4EF6\u8BBE\u65BD\u3001\u7406\u8BBA\u548C\u65B9\u9488\u3001\u89C4\u7A0B\u548C\u5DE5\u5177\u3001\u76D1\u7763\u548C\u63A7\u5236\u7B49\u56DB\u5927\u8981\u7D20\u6784\u6210\u3002\u7B56\u7565\u662F\u52A8\u6001\u7684\u3001\u5F00\u653E\u7684\uFF0C\u4F1A\u968F\u7740\u5B9E\u8DF5\u7ECF\u9A8C\u7684\u79EF\u7D2F\u548C\u4E3B\u5BA2\u89C2\u6761\u4EF6\u7684\u53D8\u5316\uFF0C\u53CD\u590D\u8FED\u4EE3\u4F18\u5316\u3002\u672C\u6587\u6863\u5373\u7528\u6765\u8BB0\u5F55\u8FD9\u4E00\u7B56\u7565\u7684\u66F4\u65B0\u5386\u7A0B\u3002\u76EE\u524D\u7684\u7B56\u7565\u662F2019\u5E745\u6708\u5F62\u6210\u7684\u7A33\u5B9A\u7248\u672C\uFF0C\u6B64\u7248\u672C\u7ECF\u8FC7\u8FD1\u534A\u5E74\u7684\u8BD5\u7528\uFF0C\u5B9E\u8DF5\u8BC1\u660E\u662F\u884C\u4E4B\u6709\u6548\u7684\u3002\u6587\u6863\u66F4\u65B0\u8BB0\u5F55\u5982\u4E0B\uFF1A\n\n|\u7248\u672C|\u65E5\u671F|\u5907\u6CE8|\n|---------------|\n|V0.0|2018.10.21|\u8D77\u8349|\n|V0.1|2018.12.11|\u4FEE\u8BA2|\n|V0.2|2019.04.27|\u4FEE\u8BA2|\n|V1.0|2019.05.30|\u6B63\u5F0F\u7248\u672C|\n|V1.1|2019.09.14|\u4FEE\u8BA2|\n\n## 1.2 \u7528\u8BED\u7EA6\u5B9A\n\n- [[#0000ff:**UPDB**#]]\uFF1A**U**nified **P**ersonal **D**ata**B**ase\uFF0C\u7528\u4E8E\u7EDF\u4E00\u5B58\u50A8\u4E2A\u4EBA\u6570\u636E\u7684\u5B58\u6863\u6570\u636E\u96C6\u5408\u3002\n- [[#0000ff:**\u57FA\u7EBF(Baseline)**#]]\uFF1A\u7ECF\u6574\u7406\u3001\u5F52\u6863\u6240\u5F62\u6210\u7684\u3001\u5E76\u5728\u4E00\u4E2A\u5F52\u6863\u5468\u671F\u5185\u56FA\u5316\u7684UPDB\u6240\u6709\u526F\u672C\u7684\u5168\u90E8\u6570\u636E\u6240\u5F62\u6210\u7684\u7A33\u5B9A\u7684\u3001\u6B63\u786E\u7684\u3001\u53EF\u7528\u7684\u3001\u4E00\u81F4\u7684\u3001\u6709\u5E8F\u7684\u72B6\u6001\u3002UPDB\u6309\u7167\u57FA\u7EBF\u7BA1\u7406\u7684\u65B9\u5F0F\u8FDB\u884C\u66F4\u65B0\u3002\n- [[#0000ff:**\u589E\u91CF(Delta)**#]]\uFF1AUPDB\u4E24\u4E2A\u8FDE\u7EED\u57FA\u7EBF\u4E4B\u95F4\u7684\u6570\u636E\u589E\u91CF\uFF0C\u4E5F\u5373\u5728\u5F52\u6863\u65F6\u6240\u5F62\u6210\u7684\u3001\u7ECF\u8FC7\u68C0\u67E5\u3001\u91CD\u547D\u540D\u548C\u5206\u7C7B\u7684\uFF0C\u878D\u5408\u5230\u73B0\u6709\u57FA\u7EBF\u5373\u53EF\u5F62\u6210\u65B0\u57FA\u7EBF\u7684\u6587\u4EF6\u548C\u5143\u6570\u636E\u96C6\u5408\u3002\u6CE8\u610F\uFF0C\u201C\u589E\u91CF\u201D\u5E76\u4E0D\u4EC5\u4EC5\u6307\u6BCF\u6B21\u5F52\u6863\u65F6\u65B0\u589E\u7684\u6587\u4EF6\uFF0C\u8FD8\u5305\u62EC\u5BF9\u65E7\u57FA\u7EBF\u4F5C\u5220\u9664\u3001\u66F4\u6539\u5206\u7C7B\u3001\u66F4\u6539\u6587\u4EF6\u540D\u3001\u66FF\u6362\u65B0\u7248\u672C\u3001\u4FEE\u590D\u7B49\u5C31\u5730\u64CD\u4F5C\u7684\u65E5\u5FD7\u8BB0\u5F55\uFF08\u5143\u6570\u636E\uFF09\u3002\n- [[#0000ff:**\u7EC8\u7AEF**#]]\uFF1A\u5373**\u4FE1\u606F\u901A\u4FE1\u548C\u5904\u7406\u7EC8\u7AEF**\uFF0C\u6307\u65E5\u5E38\u4F7F\u7528\u7684\uFF0C\u80FD\u591F\u8054\u7F51\u83B7\u53D6/\u521B\u4F5C\u65B0\u6570\u636E\u3001\u5B58\u50A8\u6570\u636E\u3001\u4FEE\u6539\u6570\u636E\u3001\u5220\u9664\u6570\u636E\u3001\u4F20\u8F93\u6570\u636E\u3001\u590D\u5236\u6570\u636E\u7684\u7EC8\u7AEF\u8BBE\u5907\u3002\u6309\u7167\u8FD9\u4E2A\u5B9A\u4E49\uFF0C\u7EC8\u7AEF\u76EE\u524D\u5305\u62EC\u624B\u673A\u548C\u5E73\u677F\u3001PC\u3001\u7167\u76F8\u673A\u3001\u5F55\u97F3\u673A\u3001\u5F00\u53D1\u677F\u7B49\u8BBE\u5907\u3002\u5927\u90E8\u5206\u7684IoT\u8BBE\u5907\uFF0C\u6BD4\u5982\u6444\u50CF\u5934\u3001\u667A\u80FD\u97F3\u7BB1\u3001\u7535\u5B50\u6E29\u5EA6\u8BA1\u3001\u626B\u5730\u673A\u5668\u4EBA\u7B49\u7B49\uFF0C\u8981\u4E48\u6CA1\u6709\u7528\u6237\u5B58\u50A8\u3001\u8981\u4E48\u65E0\u6CD5\u81EA\u7531\u83B7\u53D6\u548C\u4FEE\u6539\u65B0\u6570\u636E\uFF0C\u56E0\u6B64\u4E0D\u5728\u201C\u7EC8\u7AEF\u201D\u4E4B\u5217\u3002\n- [[#0000ff:**\u6682\u5B58\u533A**#]]\uFF1A\u7EC8\u7AEF\u5B58\u50A8\u533A\u5728\u903B\u8F91\u4E0A\u5206\u4E3A**\u5DE5\u4F5C\u533A**\u548C**\u6682\u5B58\u533A**\u4E24\u90E8\u5206\u3002**\u5DE5\u4F5C\u533A**\u5B58\u50A8\u7684\u662F\u4E0EUPDB\u4FDD\u6301\u4E00\u81F4\u7684\u6587\u4EF6\u526F\u672C\uFF0C\u53EF\u4F9B\u65E5\u5E38\u4F7F\u7528\u3002**\u6682\u5B58\u533A**\u5B58\u50A8\u7684\u662F\u65B0\u589E\u7684\u6570\u636E\u4EE5\u53CA\u88AB\u4FEE\u6539\u8FC7\u7684UPDB\u6570\u636E\u3002\n- [[#0000ff:**\u6570\u636E\u5F62\u6210**#]]\uFF1A\u65E5\u5E38\u751F\u6D3B\u4E2D\uFF0C\u6309\u7167\u77E5\u8BC6\u7BA1\u7406\u603B\u65B9\u9488\u548C\u5B66\u4E60\u65B9\u9488\u7684\u539F\u5219\u8981\u6C42\uFF0C\u4E0D\u65AD\u6536\u96C6\u3001\u7B5B\u9009\u3001\u9884\u5904\u7406\u3001\u9884\u5206\u7C7B\u65B0\u77E5\u8BC6\uFF0C\u5E76\u5C06\u5176\u52A0\u5165\u5230\u6682\u5B58\u533A\u7684\u8FC7\u7A0B\uFF1B\u6216\u8005\u5BF9UPDB\u8FDB\u884C\u7EF4\u62A4\u64CD\u4F5C\uFF0C\u5F62\u6210\u64CD\u4F5C\u65E5\u5FD7\u7684\u8FC7\u7A0B\u3002\n- [[#0000ff:**\u6570\u636E\u5F52\u6863**#]]\uFF1A\u5728\u4E00\u4E2A\u5F52\u6863\u5468\u671F\u7ED3\u675F\u524D\uFF0C\u5B9A\u671F\u8FDB\u884C\u7684\u5F52\u6863\u6D3B\u52A8\uFF0C\u5373\uFF0C\u6839\u636EUPDB\u76EE\u5F55\u7ED3\u6784\u6A21\u677F\u548C\u5206\u7C7B\u4F53\u7CFB\uFF0C\u5C06\u6682\u5B58\u533A\u5185\u7684\u6587\u4EF6\u6302\u63A5\u5230\u6A21\u677F\u7684\u76F8\u5E94\u76EE\u5F55\uFF0C\u540C\u65F6\u5BF9\u88AB\u5F52\u6863\u6587\u4EF6\u4F5C\u8D28\u91CF\u68C0\u67E5\u3001IR\u5BFC\u5411\u7684\u91CD\u547D\u540D\u7B49\u5DE5\u4F5C\uFF0C\u786E\u4FDD\u65B0\u589E\u6587\u4EF6\u5408\u7406\u5F52\u7C7B\u3001\u6CA1\u6709\u8D28\u91CF\u95EE\u9898\u3002\u6B64\u5916\uFF0C\u5BF9\u5DF2\u6709\u57FA\u7EBF\u7684\u4FEE\u6539\uFF0C\u8FD8\u5C06\u5728\u5143\u6570\u636E\u7684\u65E5\u5FD7\u4E2D\u4F53\u73B0\u3002\u6302\u63A5\u4E86\u65B0\u6587\u4EF6\u7684\u6A21\u677F\uFF0C\u52A0\u4E0A\u7EF4\u62A4\u65E5\u5FD7\u7B49\u5143\u6570\u636E\uFF0C\u5F62\u6210\u65B0\u7684\u589E\u91CF\u3002\n- [[#0000ff:**\u6570\u636E\u5907\u4EFD**#]]\uFF1A\u9488\u5BF9\u67D0\u4E00**\u57FA\u7EBF**\u7684\u5168\u90E8\u6216\u90E8\u5206\u6570\u636E\u8FDB\u884C\u590D\u5236\u548C\u8F6C\u50A8\u7684\u64CD\u4F5C\u3002\n\n\u4E3A\u4FBF\u4E8E\u7BA1\u7406\uFF0CUPDB\u5C06\u6570\u636E\u5F52\u4E3A\u516D\u5927\u7C7B\uFF0C\u8FD9\u516D\u5927\u7C7B\u53CA\u5176\u5355\u5B57\u6BCD\u7B80\u79F0\u5206\u522B\u662F\uFF1A\n\n|\u97F3\u9891|\u4EE3\u7801|\u6587\u6863|\u56FE\u50CF|\u8F6F\u4EF6|\u89C6\u9891|\n|---------------------------|\n|A|C|D|I|S|V|\n\n";
var mikumark = new Mikumark(md);
console.log(mikumark.HTML);
