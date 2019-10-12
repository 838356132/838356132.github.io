// Mikumark V3.0
// Project Aurora - Markdown Parser
// 2019.10 Refactored in TypeScript
// Arch:
// MD → [Parser] → MarkdownDocument object(HTML included) → [Painter] → Web page
// Document:
/*
#!title: 标题
#!authors: 作者1, 作者2, ...
#!date: 2019-10-11
#!cover: 封面图片链接
#!type: 类型
#!tags: 标签1, 标签2, ...
#!{macro1}: 单行Markdown脚本
#!content
此处为正文
#!style
此处为CSS
#!script: 外部脚本路径
#!script
此处为JS代码
#!metadata
此处为元数据（JSON）
*/
class Mikumark {
    constructor(doc) {
        this.authors = new Array();
        this.tags = new Array();
        this.outline = new Array();
        this.linkedScripts = new Array();
        this.linkedStyles = new Array();
        this.macros = new Map();
        this.titleCount = 0;
        this.Parse(doc);
    }
    // 元字符转义
    static EscapeMetachar(str) {
        return str
            .replace(/\\\*/g, Mikumark.C_STAR).replace(/\\\~/g, Mikumark.C_WAVE).replace(/\\\`/g, Mikumark.C_REVQ)
            .replace(/\\\[/g, Mikumark.C_LSQB).replace(/\\\]/g, Mikumark.C_RSQB).replace(/\\\(/g, Mikumark.C_LRDB)
            .replace(/\\\)/g, Mikumark.C_RRDB).replace(/\\\$/g, Mikumark.C_DOLR).replace(/\\\|/g, Mikumark.C_VERT)
            .replace(/\\\+/g, Mikumark.C_PLUS).replace(/\\\\/g, Mikumark.C_BSLT).replace(/\\\#/g, Mikumark.C_SHRP)
            .replace(/\\\-/g, Mikumark.C_MNUS).replace(/\\\&/g, Mikumark.C_AMPS).replace(/\\\%/g, Mikumark.C_PCNT);
    }
    // 元字符覆盖
    static CoverMetachar(str) {
        return str
            .replace(/\*/g, Mikumark.C_STAR).replace(/\~/g, Mikumark.C_WAVE).replace(/\`/g, Mikumark.C_REVQ)
            .replace(/\[/g, Mikumark.C_LSQB).replace(/\]/g, Mikumark.C_RSQB).replace(/\(/g, Mikumark.C_LRDB)
            .replace(/\)/g, Mikumark.C_RRDB).replace(/\$/g, Mikumark.C_DOLR).replace(/\|/g, Mikumark.C_VERT)
            .replace(/\+/g, Mikumark.C_PLUS).replace(/\\/g, Mikumark.C_BSLT).replace(/\#/g, Mikumark.C_SHRP)
            .replace(/\-/g, Mikumark.C_MNUS).replace(/\&/g, Mikumark.C_AMPS).replace(/\%/g, Mikumark.C_PCNT);
    }
    // 元字符换回
    static RecoverMetachar(str) {
        return str
            .replace(new RegExp(Mikumark.C_STAR, 'g'), '*').replace(new RegExp(Mikumark.C_WAVE, 'g'), '~').replace(new RegExp(Mikumark.C_REVQ, 'g'), '`')
            .replace(new RegExp(Mikumark.C_LSQB, 'g'), '[').replace(new RegExp(Mikumark.C_RSQB, 'g'), ']').replace(new RegExp(Mikumark.C_LRDB, 'g'), '(')
            .replace(new RegExp(Mikumark.C_RRDB, 'g'), ')').replace(new RegExp(Mikumark.C_DOLR, 'g'), '$').replace(new RegExp(Mikumark.C_VERT, 'g'), '|')
            .replace(new RegExp(Mikumark.C_PLUS, 'g'), '+').replace(new RegExp(Mikumark.C_BSLT, 'g'), '\\').replace(new RegExp(Mikumark.C_SHRP, 'g'), '#')
            .replace(new RegExp(Mikumark.C_MNUS, 'g'), '-').replace(new RegExp(Mikumark.C_AMPS, 'g'), '&').replace(new RegExp(Mikumark.C_PCNT, 'g'), '%');
    }
    // 覆盖HTML元字符
    static CoverHTMLchar(str) {
        return str.replace(/>/gi, "&gt;").replace(/</gi, "&lt;").replace(/&/gi, "&amp;");
    }
    // 换回HTML元字符
    static RecoverHTMLchar(str) {
        return str.replace(/&gt;>/gi, ">").replace(/&lt;</gi, "<").replace(/&amp;/gi, "&");
    }
    // 段内样式解析
    ParseInnerPara(md) {
        let RegexInlineCode = /\`(.+?)\`/g;
        let RegexTag = /\#\((.+?)\)\#/g;
        let RegexBold = /\*\*(.+?)\*\*/g;
        let RegexItalic = /%%(.+?)%%/g;
        let RegexDeleted = /~(.+?)~/g;
        let RegexColor = /\[\[(#?[a-zA-Z0-9]+?)\:(.+?)#\]\]/g;
        let RegexLink = /\[(.+?)\]\((.+?)\)/g;
        // 首先处理换行
        let HTML = md.replace(/[\n\r]/g, "<br/>");
        // 处理宏展开（注意：不会递归展开，每个宏只被展开一次）
        for (let macro in this.macros) {
            HTML = HTML.replace(new RegExp(macro, "g"), this.macros[macro]);
        }
        // 行内代码：需要特殊处理，其内的所有元字符都应被转义，防止解析成HTML标签。（不会处理已屏蔽的元字符）
        let inlineCodeSegments = RegexInlineCode.exec(HTML);
        while (inlineCodeSegments !== null) {
            HTML = HTML.replace(inlineCodeSegments[0], `<code>${Mikumark.CoverHTMLchar(Mikumark.CoverMetachar(inlineCodeSegments[1]))}</code>`);
            inlineCodeSegments = RegexInlineCode.exec(HTML);
        }
        // TODO 处理标签
        HTML = HTML.replace(RegexTag, `<span class="tag">$1</span>`)
            .replace(RegexBold, `<strong>$1</strong>`)
            .replace(RegexItalic, `<i>$1</i>`)
            .replace(RegexDeleted, `<del>$1</del>`)
            .replace(RegexColor, `<span style="color:$1;">$2</span>`)
            .replace(RegexLink, `<a href="$2">$1</a>`);
        return Mikumark.RecoverHTMLchar(Mikumark.RecoverMetachar(HTML));
    }
    // 段落级样式解析
    ParsePara(md) {
        if (md.length <= 0)
            return "";
        let HtmlBuffer = new Array();
        md = md.trim();
        // 标题
        if (/^#+?(?![\!\(]).+/g.test(md) === true) {
            let level = (md.match(/^#+(?=[^#])/i)[0]).length;
            let title = md.replace(/^#+/g, "").trim();
            HtmlBuffer.push(`<h${level} id="Title_${this.titleCount}">${title}</h${level}>`);
            this.titleCount++;
            // TODO 处理目录
        }
        // 分割线（至少3个连续dash的单行段落）
        else if (/^\-{3,}$/g.test(md) === true) {
            HtmlBuffer.push(`<hr/>`);
        }
        // 有序列表（+号开头的段落）
        else if (/^\++[\s\S]+/g.test(md) === true) {
            // 按行分割列表项
            let lines = md.split("\n");
            // 层级计数器
            let currentLevel = 0;
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                // 计算+号数量（列表层级）
                let prefix = line.match(/^\++(?=[^\+])/i);
                if (prefix == null) {
                    HtmlBuffer.push(md);
                    break;
                }
                let level = prefix[0].length;
                // 列表文本
                let item = line.replace(/^\++/g, "").trim();
                // 判断层级是否改变
                if (level > currentLevel) { // 嵌套加深
                    for (let c = 0; c < (level - currentLevel); c++) {
                        HtmlBuffer.push(`<ol>`);
                    }
                    HtmlBuffer.push(`<li>`);
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
                else if (level < currentLevel) { // 嵌套退出
                    for (let c = 0; c < (currentLevel - level); c++) {
                        HtmlBuffer.push(`</li></ol>`);
                    }
                    HtmlBuffer.push(`</li><li>`);
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
                else { // 保持同级
                    HtmlBuffer.push(`</li><li>`);
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
            }
            // 闭合列表标签
            for (let c = 0; c < currentLevel; c++) {
                HtmlBuffer.push(`</li></ol>`);
            }
        }
        // 无序列表（-号开头的段落）
        else if (/^\-+[\s\S]+/g.test(md) === true) {
            // 按行分割列表项
            let lines = md.split("\n");
            // 层级计数器
            let currentLevel = 0;
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                // 计算-号数量（列表层级）
                let prefix = line.match(/^\-+(?=[^\-])/i);
                if (prefix == null) {
                    HtmlBuffer.push(md);
                    break;
                }
                let level = prefix[0].length;
                // 列表文本
                let item = line.replace(/^\-+/g, "").trim();
                // 判断层级是否改变
                if (level > currentLevel) { // 嵌套加深
                    for (let c = 0; c < (level - currentLevel); c++) {
                        HtmlBuffer.push(`<ul>`);
                    }
                    HtmlBuffer.push(`<li>`);
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
                else if (level < currentLevel) { // 嵌套退出
                    for (let c = 0; c < (currentLevel - level); c++) {
                        HtmlBuffer.push(`</li></ul>`);
                    }
                    HtmlBuffer.push(`</li><li>`);
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
                else { // 保持同级
                    HtmlBuffer.push(`</li><li>`);
                    HtmlBuffer.push(this.ParseInnerPara(item));
                    currentLevel = level;
                }
            }
            // 闭合列表标签
            for (let c = 0; c < currentLevel; c++) {
                HtmlBuffer.push(`</li></ul>`);
            }
        }
        // 表格
        else if (/^\|[\s\S]+\|$/g.test(md) === true) {
            // 按行分割
            let rows = md.split("\n");
            // 分割线标识
            let hasHeadline = false;
            // 对齐方式：下标为列序号（从1开始）
            let alignType = new Array();
            HtmlBuffer.push('<div class="md-table-container"><table class="md-table">');
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                let cols = row.split("|");
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
                        for (let c = 1; c < cols.length - 1; c++) {
                            HtmlBuffer.push(`<td${(alignType[c] ? alignType[c] : '')}>${this.ParseInnerPara(cols[c])}</td>`);
                        }
                    }
                    else { // TH表头
                        for (let c = 1; c < cols.length - 1; c++) {
                            // 记录对齐方式
                            if (/^\:.*\:$/gi.test(cols[c])) {
                                alignType[c] = ` style="text-align:center;"`;
                            }
                            else if (/\:$/gi.test(cols[c])) {
                                alignType[c] = ` style="text-align:right;"`;
                            }
                            else if (/^\:/gi.test(cols[c])) {
                                alignType[c] = ` style="text-align:left;"`;
                            }
                            else {
                                alignType[c] = '';
                            }
                            cols[c] = cols[c].replace(/\:$/gi, '').replace(/^\:/gi, '');
                            HtmlBuffer.push(`<th${(alignType[c] ? alignType[c] : '')}>${this.ParseInnerPara(cols[c])}</th>`);
                        }
                    }
                    HtmlBuffer.push('</tr>');
                }
            }
            HtmlBuffer.push('</table></div>');
        }
        // 图片
        else if (/^\!\[.+?\]\(.+?\)$/g.test(md) === true) {
            let imgTitle = md.match(/^\!\[.+\]\(/g)[0];
            imgTitle = imgTitle.substring(2, imgTitle.length - 2);
            let imgURL = md.match(/\]\([^(\]\()]+\)$/g)[0];
            imgURL = imgURL.substring(2, imgURL.length - 1);
            HtmlBuffer.push(`<div class="imgbox">
            <div class="loading">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
            <img class="md_img" data-src="${imgURL}"><div class="imgtitle">${this.ParseInnerPara(imgTitle)}</div></div>`);
        }
        // 居中的段落
        else if (/^\:.+/g.test(md) === true) {
            let content = md.substring(1).trim(); // 截取:号后面的内容
            HtmlBuffer.push(`<p style="text-align:center;">${this.ParseInnerPara(content)}</p>`);
        }
        // LaTeX公式段落
        else if (/^\$\$.+?\$\$$/g.test(md) === true) {
            HtmlBuffer.push(`<p>${md}</p>`);
        }
        // 单个HTML元素，直接原样返回
        else if (/^<.+?>[\s\S]>$/g.test(md) === true) {
            HtmlBuffer.push(md);
        }
        // 普通段落
        else {
            HtmlBuffer.push(`<p>${this.ParseInnerPara(md)}</p>`);
        }
        return HtmlBuffer.join("");
    }
    // 跨段落样式解析
    ParseInterPara(md) {
        let HtmlBuffer = new Array();
        // 首先处理代码块
        let codeBlocks = new Array();
        let mdBuffer = new Array();
        let codeIndex = 0;
        let codeLanguage = "";
        let codeBlockBuffer = new Array();
        let lines = md.split("\n");
        let isInCodeBlock = false;
        let codeBlockQuoteLevel = 0;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (/^(>*)\s*```/g.test(line) === true) { // 支持在块引用中的代码块
                // 进入代码块
                if (isInCodeBlock === false) {
                    codeBlockQuoteLevel = (line.match(/^>*(?=[^>])/i)[0]).length;
                    codeLanguage = line.replace(/^(>*)\s*```:?/gi, "").toLowerCase();
                    isInCodeBlock = true;
                }
                // 退出代码块
                else {
                    isInCodeBlock = false;
                    mdBuffer.push(`${">>>>>>>>>>".substring(0, codeBlockQuoteLevel)}\`\`\`${codeIndex}`);
                    codeBlocks[codeIndex] = {
                        language: codeLanguage,
                        code: Mikumark.CoverHTMLchar(codeBlockBuffer.join(""))
                    };
                    codeIndex++;
                    codeLanguage = "";
                    codeBlockBuffer = new Array();
                    codeBlockQuoteLevel = 0;
                }
            }
            else {
                // 处于代码块内部
                if (isInCodeBlock === true) {
                    codeBlockBuffer.push(line + "\n");
                }
                else {
                    mdBuffer.push(line);
                }
            }
        }
        md = mdBuffer.join("\n"); // 重新组合起来
        // 自然段落分隔
        let paragraphs = md.split(/\n{2,}/g);
        // 遍历各个段落，判断段落类型
        // 引用块计数
        let quoteFlag = false;
        let quoteLevel = 0;
        for (let pcount = 0; pcount < paragraphs.length; pcount++) {
            let paragraph = paragraphs[pcount];
            // 引用框？
            if (/^>.+/g.test(paragraph) === true) {
                quoteFlag = true;
                // >号数量（引用层级）
                let level = (paragraph.match(/^>+(?=[^>])/i)[0]).length;
                // 引用文本
                let quote = paragraph.replace(/^>+/, "").trim();
                // 判断层级是否改变
                if (level > quoteLevel) { // 嵌套加深
                    for (let c = 0; c < (level - quoteLevel); c++) {
                        HtmlBuffer.push(`<blockquote>`);
                    }
                }
                else if (level < quoteLevel) { // 嵌套退出
                    for (let c = 0; c < (quoteLevel - level); c++) {
                        HtmlBuffer.push(`</blockquote>`);
                    }
                }
                else { } // 保持同级，不加标签
                // 处理代码块
                if (/^(>*)\s*```\d+/g.test(quote) === true) {
                    HtmlBuffer.push(quote);
                }
                else {
                    HtmlBuffer.push(this.ParsePara(quote));
                }
                quoteLevel = level;
            }
            // 无前缀的段落
            else {
                // 闭合引用标签，并退出引用状态
                if (quoteFlag == true) {
                    for (let c = 0; c < quoteLevel; c++) {
                        HtmlBuffer.push(`</blockquote>`);
                    }
                    quoteLevel = 0;
                }
                quoteFlag = false;
                if (/^```\d+/g.test(paragraph) === true) {
                    HtmlBuffer.push(paragraph);
                }
                else {
                    HtmlBuffer.push(this.ParsePara(paragraph));
                }
            }
        }
        // 代码写回并高亮
        for (let i = 0; i < HtmlBuffer.length; i++) {
            let para = HtmlBuffer[i];
            if (/^(>*)\s*```/g.test(para) === true) {
                let index = parseInt(para.trim().replace(/^(>*)\s*```/g, ""));
                let codeBlock = codeBlocks[index];
                let codeLanguage = codeBlock.language;
                // TODO 此处高亮
                let code = Mikumark.RecoverHTMLchar(codeBlock.code);
                HtmlBuffer[i] = `<pre><code>${code}</code></pre>`;
            }
        }
        return HtmlBuffer.join("");
    }
    // 文档结构解析
    Parse(doc) {
        let contentBuffer = new Array();
        let styleBuffer = new Array();
        let scriptBuffer = new Array();
        let metadataBuffer = new Array();
        let state = "content"; // content | style | script | metadata
        let lines = doc.split("\n");
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if (/^#!title:/g.test(line) === true) {
                let title = line.split(":")[1].trim();
                this.title = title;
            }
            else if (/^#!date:/g.test(line) === true) {
                let date = line.split(":")[1].trim();
                this.date = date;
            }
            else if (/^#!cover:/g.test(line) === true) {
                let cover = line.split(":")[1].trim();
                this.cover = cover;
            }
            else if (/^#!type:/g.test(line) === true) {
                let type = line.split(":")[1].trim();
                this.type = type;
            }
            else if (/^#!authors:/g.test(line) === true) {
                let authors = line.split(":")[1].trim().split(",").map((e) => { return e.trim(); });
                this.authors = authors;
            }
            else if (/^#!tags:/g.test(line) === true) {
                let tags = line.split(":")[1].trim().split(",").map((e) => { return e.trim(); });
                this.tags = tags;
            }
            // 宏定义
            else if (/^#!{(.+?)}:/g.test(line) === true) {
                let macroContent = line.split(":")[1].trim();
                let macroName = line.split(":")[0].replace(/^#!/g, ""); // 包括大括号
                this.macros[macroName] = macroContent;
            }
            // 外部CSS
            else if (/^#!style:/g.test(line) === true) {
                let cssPath = line.split(":")[1].trim();
                this.linkedStyles.push(cssPath);
            }
            // 外部脚本
            else if (/^#!script:/g.test(line) === true) {
                let scriptPath = line.split(":")[1].trim();
                this.linkedScripts.push(scriptPath);
            }
            else if (/^#!content$/.test(line) === true) {
                state = "content";
            }
            else if (/^#!style$/.test(line) === true) {
                state = "style";
            }
            else if (/^#!script$/.test(line) === true) {
                state = "script";
            }
            else if (/^#!metadata$/.test(line) === true) {
                state = "metadata";
            }
            else {
                if (state === "content") {
                    contentBuffer.push(line);
                }
                else if (state === "style") {
                    styleBuffer.push(line);
                }
                else if (state === "script") {
                    scriptBuffer.push(line);
                }
                else if (state === "metadata") {
                    metadataBuffer.push(line);
                }
            }
        }
        this.content = contentBuffer.join("\n");
        this.style = styleBuffer.join("\n");
        this.script = scriptBuffer.join("\n");
        try {
            this.metadata = JSON.parse(metadataBuffer.join("\n"));
        }
        catch (e) { }
        this.HTML = this.ParseInterPara(this.content);
    }
}
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
// 测试
/*
const md = `

# 0 基线维护记录

|基线编号|形成日期|:数据量|:增量|
|-----------------------|
|0|2019年5月下旬|-|-|
|1|2019.05.31|-|Delta0: 7.12GB|
|2|2019.06.30|-|Delta1: 210GB|
|3|2019.07.31|-|Delta2: 27.5GB|
|4|2019.08.31|1.05TB|Delta3: 74.3GB|
|5|2019.09.30|1.05TB|Delta4: 1.2GB|


# 1 任务与目标

## 1.1 概述

\`\`\`
<figure role="img" aria-labelledby="cow-caption">
  <pre>
  ___________________________
< I'm an expert in my field. >
  ---------------------------
         \\   ^__^
          \\  (oo)\\_______
             (__)\\       )\\/\\
                 ||----w |
                 ||     ||
  </pre>
  <figcaption id="cow-caption">
    A cow saying, "I'm an expert in my field." The cow is illustrated using preformatted text characters.
  </figcaption>
</figure>
\`\`\`

> 个人知识管理总方针：
精简盘活\`<p>456**123**789</p>\`存量，严格控制增量。合理高效备份，保证知识有用、有序、安全。

这份文档试图就**个人知识管理**这一难题，给出**明确**、**合理**、**可行**的解决方案，以期在信息过载的生活中，尽可能做好知识的记录、利用、内化和传递。

以往，个人知识管理面临两方面挑战：一方面是存量数据的维护。多年来，积累了大量数据，面临很大的丢失和损坏的风险。尽管已经采取备份等手段，但仍然发生过事故，造成一定程度的数据损失。另一方面是增量数据的收集。平日收集了大量的信息，长期以来，并没有管理好、利用好，导致明明收集了大量的信息，却没办法有效地利用，没有达到学习和使用的目的。鉴于此，如何在信息过载、知识爆炸的背景下，提高数据和知识的收集、筛选、分类、维护、利用的效率和质量，是必须解决的一个重大问题。

在很长的一段时间里，曾尝试过多种简单的备份和分类策略，但是效果都不好，甚至每次尝试都打乱了已经形成的数据和维护习惯。在总结以往经验教训的基础上，本文档借鉴图书情报学的知识，以及Git等工具的设计思想，试图提出明确、合理、可行的个人知识管理策略。

- 明确：清楚明确不含糊的
- 合理：系统化的、遵循知识管理原理的
- 可行：可操作、易于操作、符合日常直觉的

本策略由软硬件设施、理论和方针、规程和工具、监督和控制等四大要素构成。策略是动态的、开放的，会随着实践经验的积累和主客观条件的变化，反复迭代优化。本文档即用来记录这一策略的更新历程。目前的策略是2019年5月形成的稳定版本，此版本经过近半年的试用，实践证明是行之有效的。文档更新记录如下：

|版本|日期|备注|
|---------------|
|V0.0|2018.10.21|起草|
|V0.1|2018.12.11|修订|
|V0.2|2019.04.27|修订|
|V1.0|2019.05.30|正式版本|
|V1.1|2019.09.14|修订|

## 1.2 用语约定

- [[#0000ff:**UPDB**#]]：**U**nified **P**ersonal **D**ata**B**ase，用于统一存储个人数据的存档数据集合。
- [[#0000ff:**基线(Baseline)**#]]：经整理、归档所形成的、并在一个归档周期内固化的UPDB所有副本的全部数据所形成的稳定的、正确的、可用的、一致的、有序的状态。UPDB按照基线管理的方式进行更新。
- [[#0000ff:**增量(Delta)**#]]：UPDB两个连续基线之间的数据增量，也即在归档时所形成的、经过检查、重命名和分类的，融合到现有基线即可形成新基线的文件和元数据集合。注意，“增量”并不仅仅指每次归档时新增的文件，还包括对旧基线作删除、更改分类、更改文件名、替换新版本、修复等就地操作的日志记录（元数据）。
- [[#0000ff:**终端**#]]：即**信息通信和处理终端**，指日常使用的，能够联网获取/创作新数据、存储数据、修改数据、删除数据、传输数据、复制数据的终端设备。按照这个定义，终端目前包括手机和平板、PC、照相机、录音机、开发板等设备。大部分的IoT设备，比如摄像头、智能音箱、电子温度计、扫地机器人等等，要么没有用户存储、要么无法自由获取和修改新数据，因此不在“终端”之列。
- [[#0000ff:**暂存区**#]]：终端存储区在逻辑上分为**工作区**和**暂存区**两部分。**工作区**存储的是与UPDB保持一致的文件副本，可供日常使用。**暂存区**存储的是新增的数据以及被修改过的UPDB数据。
- [[#0000ff:**数据形成**#]]：日常生活中，按照知识管理总方针和学习方针的原则要求，不断收集、筛选、预处理、预分类新知识，并将其加入到暂存区的过程；或者对UPDB进行维护操作，形成操作日志的过程。
- [[#0000ff:**数据归档**#]]：在一个归档周期结束前，定期进行的归档活动，即，根据UPDB目录结构模板和分类体系，将暂存区内的文件挂接到模板的相应目录，同时对被归档文件作质量检查、IR导向的重命名等工作，确保新增文件合理归类、没有质量问题。此外，对已有基线的修改，还将在元数据的日志中体现。挂接了新文件的模板，加上维护日志等元数据，形成新的增量。
- [[#0000ff:**数据备份**#]]：针对某一**基线**的全部或部分数据进行复制和转储的操作。

为便于管理，UPDB将数据归为六大类，这六大类及其单字母简称分别是：

|音频|代码|文档|图像|软件|视频|
|---------------------------|
|A|C|D|I|S|V|

`;*/
// let mikumark = new Mikumark(md);
// const fs = require("fs");
// console.log(mikumark.HTML);
// fs.writeFileSync("./test.html", mikumark.HTML);
