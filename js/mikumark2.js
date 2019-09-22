;
// Mikumark V2.0
// 2019.01
// mikukonai@GitHub

const DEFAULT_COVER = `http://wx4.sinaimg.cn/large/450be1f5gy1g5zjkmhigoj20vy0ht76f.jpg`;

function Mikumark(mikumarkDocString) {
    // 全局输入输出
    this.mikumarkDocString = mikumarkDocString || ``;
    this.mikumarkDocObject = new Object();

    // 元字符的屏蔽用字符串
    const C_STAR = '@STAR@'; // *
    const C_WAVE = "@WAVE@"; // ~
    const C_REVQ = "@REVQ@"; // `
    const C_LSQB = "@LSQB@"; // [
    const C_RSQB = "@RSQB@"; // ]
    const C_LRDB = "@LRDB@"; // (
    const C_RRDB = "@RRDB@"; // )
    const C_DOLR = "@DOLR@"; // $
    const C_VERT = "@VERT@"; // |
    const C_PLUS = "@PLUS@"; // +
    const C_MNUS = "@MNUS@"; // -
    const C_BSLT = "@BSLT@"; // \
    const C_SHRP = "@SHRP@"; // #
    const C_AMPS = "@AMPS@"; // &
    const C_PCNT = "@PCNT@"; // %

    // 元字符屏蔽
    function coverMetaChar(src) {
        return src
        .replace(/\*/g, C_STAR).replace(/\~/g, C_WAVE).replace(/\`/g, C_REVQ)
        .replace(/\[/g, C_LSQB).replace(/\]/g, C_RSQB).replace(/\(/g, C_LRDB)
        .replace(/\)/g, C_RRDB).replace(/\$/g, C_DOLR).replace(/\|/g, C_VERT)
        .replace(/\+/g, C_PLUS).replace(/\\/g, C_BSLT).replace(/\#/g, C_SHRP)
        .replace(/\-/g, C_MNUS).replace(/\&/g, C_AMPS).replace(/\&/g, C_PCNT);
    }

    // 最大段落长度
    const MAX_PARAGRAPH_LENGTH = 999999;

    // 各个样式的标签
    const TAG_INPARA_CODE   = `<code>$</code>`;
    const TAG_INPARA_BOLD   = `<strong>$</strong>`;
    const TAG_INPARA_ITALIC = `<i>$</i>`;
    const TAG_INPARA_DEL    = `<del>$</del>`;

    // 将内容填充入样式标签
    function fillTagWithContent(content, tag) {
        return `${tag.split('$')[0]}${content}${tag.split('$')[1]}`;
    }

    // 各个标题
    var bookmarkTitle = new Array();
    // 各个<hx>的offsetTop
    var titleOffsetTop = new Array();
    // 全局标题计数
    var titleCount = 0;

    this.codeHighlighter = function (code, lang, blevel) {
        // 辅助函数：寻找某位置开始的匹配右括号位置
        var findPairedBraket = function(str, leftIndex) {
            var level = 0;
            var braketFlag = false;
            for(var i = leftIndex; i < str.length; i++) {
                if(str[i] === '(') {level++; braketFlag = true;}
                else if(str[i] === ')') {level--;}
                if(braketFlag == true && level == 0) {
                    return i;
                }
            }
            return str.length;
        };
    
        // 转义字符换回
        code = code
        .replace(new RegExp(C_STAR,'g'), '*').replace(new RegExp(C_WAVE,'g'), '~').replace(new RegExp(C_REVQ,'g'), '`')
        .replace(new RegExp(C_LSQB,'g'), '[').replace(new RegExp(C_RSQB,'g'), ']').replace(new RegExp(C_LRDB,'g'), '(')
        .replace(new RegExp(C_RRDB,'g'), ')').replace(new RegExp(C_DOLR,'g'), '$').replace(new RegExp(C_VERT,'g'), '|')
        .replace(new RegExp(C_PLUS,'g'), '+').replace(new RegExp(C_BSLT,'g'), '\\').replace(new RegExp(C_SHRP,'g'), '#')
        .replace(new RegExp(C_MNUS,'g'), '-').replace(new RegExp(C_AMPS,'g'), '&');
    
        // 屏蔽标签
        code = code.replace(new RegExp(/\>/g), '&gt;').replace(new RegExp(/\</g), '&lt;');
    
        var html = '';
        var state = '';
    
        // var blevel = 0;
        var bcolor = ['#222222','#FF0000', '#FF8C00', '#32CD32', '#20B2AA', '#6A5ACD', 'purple'];
    
        // HTML尖括号应特别处理（主要用于Lisp这种没有中置运算符的语言）
        var regexTagBracket = new RegExp(/(\&lt\;)|(\&gt\;)/g);
    
        // 空格正则（词法分割单元之一）
        var regexSpace = new RegExp(/\s/g);
        // 字符串正则
        var regexString = new RegExp(/\".*?\"/g);
        // 直接数正则
        var regexNumber = new RegExp(/((0x[0-9A-Fa-f]+)|([0-9]*\.[0-9]+[Ff]?)|([0-9]+[Ll]?))\b/g);
        // 预处理正则
        var regexPrecompile = new RegExp(/\#([^(t\b)(f\b)\\]).+(?=(\n|$))/g);
    
        // Lisp标识符正则
        var regexIdentifierLisp = new RegExp(/[A-Za-z\/\_\-\+\=\.\,\:\!\@\#\$\^\*\&\?][0-9A-Za-z\/\_\-\+\=\.\,\:\!\@\#\$\^\*\&\;\?]*(?=( |\)|\n|$))/g);
        // Lisp关键字正则
        var regexKeywordLisp = new RegExp(/((access)|(and)|(begin)|(bkpt)|(case)|(cond)|(cons-stream)|(default-object\?)|(define)|(define-integrable)|(define-macro)|(define-structure)|(define-syntax)|(delay)|(do)|(fluid-let)|(if)|(in-package)|(lambda)|(let)|(let\*)|(let-syntax)|(letrec)|(local-declare)|(macro)|(make-environment)|(named-lambda)|(or)|(quasiquote)|(quote)|(scode-quote)|(sequence)|(set!)|(the-environment)|(unassigned\?)|(using-syntax)|(cons)|(car)|(cdr)|(caar)|(cddr)|(list)|(display)|(newline)|(printf))(?=( |\)|\n|$))/g);
        // Lisp布尔量正则
        var regexBooleanLisp = new RegExp(/^\#([tf]|(\\[^ \)\n]+))(?=( |\)|\n|$))/g);
        // Lisp注释正则
        var regexCommentLisp = new RegExp(/\;.*(?=(\n|$))/g);
        
        
        // C关键字正则
        var regexKeywordC = new RegExp(/((if)|(else)|(while)|(switch)|(case)|(default)|(volatile)|(continue)|(break)|(goto)|(do)|(static)|(const)|(struct)|(union)|(enum)|(class)|(return)|(sizeof)|(asm)|(auto)|(bool)|(catch)|(const_cast)|(delete)|(dynamic_cast)|(explicit)|(export)|(extern)|(false)|(for)|(friend)|(inline)|(mutable)|(namespace)|(new)|(operator)|(private)|(protected)|(public)|(register)|(reinterpret_cast)|(signed)|(static_cast)|(template)|(this)|(throw)|(true)|(try)|(typedef)|(typeid)|(typename)|(using)|(virtual)|(wchar_t)|(alignas)|(alignof)|(char16_t)|(char32_t)|(constexpr)|(decltype)|(noexcept)|(nullptr)|(static_assert)|(thread_local))\b/g);
        // C类型正则
        var regexTypeC = new RegExp(/((int)|(char)|(float)|(double)|(long)|(boolean)|(String)|(unsigned)|(void)|(short)|(Integer)|(Object))[\*]?\b/g);
        // C注释正则
        var regexCommentC = new RegExp(/(\/\/.+(?=(\n|$)))|(\/\*[\s\S]*\*\/)/g);
        // C标识符正则
        var regexIdentifierC = new RegExp(/[A-Za-z\_][0-9A-Za-z\_]*\b/g);
        // C宏名（全大写标识符）正则
        var regexMacroC = new RegExp(/[A-Z\_][0-9A-Z\_]*\b/g);
        // C运算符正则
        var regexOperatorC = new RegExp(/(\+)|(\-)|(\*)|(\/)|(\\)|(\~)|(\!)|(\%)|(\&(?!([gl]t\;)))|(\+\+)|(\-\-)|(\=)|(\&gt\;)|(\&lt\;)|(\&gt\;\=)|(\&lt\;\=)|(\=\=)|(\:\:)|(\:)|(\?)|(\[)|(\])/g);
        // C函数调用或声明正则（2018.7.28）
        var functionRefC = new RegExp(/[A-Za-z\_][0-9A-Za-z\_]*(?=\()/gi);
    
        // JS字符串正则
        let regexStringJS = new RegExp(/(\".*?\")|(\'.*?\')|(\`.*?\`)/g);
        // JS关键字正则
        let regexKeywordJS = new RegExp(/((break)|(case)|(catch)|(continue)|(default)|(delete)|(do)|(else)|(finally)|(for)|(function)|(if)|(in)|(instanceof)|(new)|(return)|(switch)|(this)|(throw)|(try)|(typeof)|(var)|(void)|(while)|(with)|(abstract)|(boolean)|(byte)|(char)|(class)|(const)|(debugger)|(double)|(enum)|(export)|(extends)|(final)|(float)|(goto)|(implements)|(import)|(int)|(interface)|(long)|(native)|(package)|(private)|(protected)|(public)|(short)|(static)|(super)|(synchronized)|(throws)|(transient)|(volatile)|(let)|(yield))\b/g);
        // JS特殊量正则
        let regexConstJS = new RegExp(/((undefined)|(null)|(Infinity)|(NaN))\b/g);
        // JS注释正则
        let regexCommentJS = new RegExp(/(\/\/.+(?=(\n|$)))|(\/\*[\s\S]*\*\/)/g);
        // JS标识符正则
        let regexIdentifierJS = new RegExp(/[\$A-Za-z\_][\$0-9A-Za-z\_]*\b/g);
        // JS运算符正则
        let regexOperatorJS = new RegExp(/(\+)|(\-)|(\*)|(\/)|(\\)|(\~)|(\!)|(\%)|(\&(?!([gl]t\;)))|(\+\+)|(\-\-)|(\=)|(\&gt\;)|(\&lt\;)|(\&gt\;\=)|(\&lt\;\=)|(\=\=)|(\:\:)|(\:)|(\?)|(\[)|(\])/g);
        // JS函数调用或声明正则（2018.7.28）
        var functionRefJS = new RegExp(/[\$A-Za-z\_][\$0-9A-Za-z\_]*(?=\()/gi);

        // 从左到右扫描源代码，进行词法分析
        for(var i = 0; i < code.length; i++) {
            var current = code[i]; // 当前字符
            var suffix = code.substring(i); // 当前字符往后的字符串

            /////////////////////////////////////
            // C C++ Java
            /////////////////////////////////////
            if(lang.toLowerCase() === 'c' || lang.toLowerCase() === 'c++' || lang.toLowerCase() === 'java') {
    
                // 当前字符是空白字符：一般而言只有一个空白字符，所以直接向前跳
                if(suffix.search(regexSpace) == 0) {
                    html += current;
                    continue;
                }
                // 直接数
                else if(suffix.search(regexNumber) == 0) {
                    var number = suffix.match(regexNumber)[0];
                    html += ('<span class="code-number">' + number + '</span>');
                    i = i + number.length - 1;
                }
                // 字符串
                else if(suffix.search(regexString) == 0) {
                    var str = suffix.match(regexString)[0];
                    html += ('<span class="code-string">' + str + '</span>');
                    i = i + str.length - 1;
                }
                // 预处理
                else if(suffix.search(regexPrecompile) == 0) {
                    var precompile = suffix.match(regexPrecompile)[0];
                    html += ('<span class="code-precompile">' + precompile + '</span>');
                    i = i + precompile.length - 1;
                }

                // C注释
                else if(suffix.search(regexCommentC) == 0) {
                    var commentc = suffix.match(regexCommentC)[0];
                    html += ('<span class="code-comment">' + commentc + '</span>');
                    i = i + commentc.length - 1;
                }
                // C关键字
                else if(suffix.search(regexKeywordC) == 0) {
                    var kwc = suffix.match(regexKeywordC)[0];
                    html += ('<span class="code-keyword">' + kwc + '</span>');
                    i = i + kwc.length - 1;
                }
                // C宏名
                else if(suffix.search(regexMacroC) == 0) {
                    var macro = suffix.match(regexMacroC)[0];
                    html += ('<span class="code-macro">' + macro + '</span>');
                    i = i + macro.length - 1;
                }
                // C运算符
                else if(suffix.search(regexOperatorC) == 0) {
                    var optr = suffix.match(regexOperatorC)[0];
                    html += ('<span class="code-operator">' + optr + '</span>');
                    i = i + optr.length - 1;
                }
                // 类型
                else if(suffix.search(regexTypeC) == 0) {
                    var typename = suffix.match(regexTypeC)[0];
                    html += ('<span class="code-type">' + typename + '</span>');
                    i = i + typename.length - 1;
                }
                // 函数
                else if(suffix.search(functionRefC) == 0) {
                    var fnref = suffix.match(functionRefC)[0];
                    html += ('<span class="code-function">' + fnref + '</span>');
                    i = i + fnref.length - 1;
                }
                // 标识符
                else if(suffix.search(regexIdentifierC) == 0) {
                    var idt = suffix.match(regexIdentifierC)[0];
                    html += ('<span class="code-identifier">' + idt + '</span>');
                    i = i + idt.length - 1;
                }
                else {
                    html += current;
                }
            }
    
            /////////////////////////////////////
            // JavaScript
            /////////////////////////////////////
            else if(lang.toLowerCase() === 'javascript' || lang.toLowerCase() === 'js') {
                // 当前字符是空白字符：一般而言只有一个空白字符，所以直接向前跳
                if(suffix.search(regexSpace) == 0) {
                    html += current;
                    continue;
                }
                // 直接数
                else if(suffix.search(regexNumber) == 0) {
                    var number = suffix.match(regexNumber)[0];
                    html += ('<span class="code-number">' + number + '</span>');
                    i = i + number.length - 1;
                }
                // 字符串
                else if(suffix.search(regexStringJS) == 0) {
                    var str = suffix.match(regexStringJS)[0];
                    html += ('<span class="code-string">' + str + '</span>');
                    i = i + str.length - 1;
                }

                // JS注释
                else if(suffix.search(regexCommentJS) == 0) {
                    var commentc = suffix.match(regexCommentJS)[0];
                    html += ('<span class="code-comment">' + commentc + '</span>');
                    i = i + commentc.length - 1;
                }
                // JS关键字
                else if(suffix.search(regexKeywordJS) == 0) {
                    var kwc = suffix.match(regexKeywordJS)[0];
                    html += ('<span class="code-keyword">' + kwc + '</span>');
                    i = i + kwc.length - 1;
                }
                // JS宏名
                else if(suffix.search(regexConstJS) == 0) {
                    var macro = suffix.match(regexConstJS)[0];
                    html += ('<span class="code-macro">' + macro + '</span>');
                    i = i + macro.length - 1;
                }
                // JS运算符
                else if(suffix.search(regexOperatorJS) == 0) {
                    var optr = suffix.match(regexOperatorJS)[0];
                    html += ('<span class="code-operator">' + optr + '</span>');
                    i = i + optr.length - 1;
                }
                // 函数
                else if(suffix.search(functionRefJS) == 0) {
                    var fnref = suffix.match(functionRefJS)[0];
                    html += ('<span class="code-function">' + fnref + '</span>');
                    i = i + fnref.length - 1;
                }
                // 标识符
                else if(suffix.search(regexIdentifierJS) == 0) {
                    var idt = suffix.match(regexIdentifierJS)[0];
                    html += ('<span class="code-identifier">' + idt + '</span>');
                    i = i + idt.length - 1;
                }
                else {
                    html += current;
                }
                
            }
    
            /////////////////////////////////////
            // Lisp / Scheme
            /////////////////////////////////////
            else if(lang.toLowerCase() === 'lisp' || lang.toLowerCase() === 'scheme') {
                // // 尖括号必须首先处理，以免被当成注释
                // if(suffix.search(regexTagBracket) == 0) {
                //     html += suffix.match(regexTagBracket)[0];
                //     i = i + 3; // &lt;的长度-1
                // }
                // 当前字符是空白字符：一般而言只有一个空白字符，所以直接向前跳
                if(suffix.search(regexSpace) == 0) {
                    html += current;
                    continue;
                }
                // 直接数
                else if(suffix.search(regexNumber) == 0) {
                    var number = suffix.match(regexNumber)[0];
                    html += ('<span class="code-number">' + number + '</span>');
                    i = i + number.length - 1;
                }
                // 字符串
                else if(suffix.search(regexString) == 0) {
                    var str = suffix.match(regexString)[0];
                    html += ('<span class="code-string">' + str + '</span>');
                    i = i + str.length - 1;
                }
                // 预处理
                else if(suffix.search(regexPrecompile) == 0) {
                    var precompile = suffix.match(regexPrecompile)[0];
                    html += ('<span class="code-precompile">' + precompile + '</span>');
                    i = i + precompile.length - 1;
                }
                // 关键字
                else if(suffix.search(regexKeywordLisp) == 0) {
                    var keyword = suffix.match(regexKeywordLisp)[0];
                    html += ('<span class="code-keyword">' + keyword + '</span>');
                    i = i + keyword.length - 1;
                }
                // 布尔
                else if(suffix.search(regexBooleanLisp) == 0) {
                    var bool = suffix.match(regexBooleanLisp)[0];
                    html += ('<span class="code-boolean">' + bool + '</span>');
                    i = i + bool.length - 1;
                }
                // 标识符
                else if(suffix.search(regexIdentifierLisp) == 0) {
                    var idt = suffix.match(regexIdentifierLisp)[0];
                    html += ('<span class="code-identifier">' + idt + '</span>');
                    i = i + idt.length - 1;
                }
                // 注释
                else if(suffix.search(regexCommentLisp) == 0) {
                    var comment = suffix.match(regexCommentLisp)[0];
                    html += ('<span class="code-comment">' + comment + '</span>');
                    i = i + comment.length - 1;
                }
                // 左括号
                else if(current === '(') {
                    html += ('<span style="color:' + bcolor[blevel % 7] + ';">' + current + '</span>');
                    blevel++;
                }
                // 右括号
                else if(current === ')') {
                    blevel--;
                    html += ('<span style="color:' + bcolor[blevel % 7] + ';">' + current + '</span>');
                }
                // quote
                else if(current === '\'') {
                    // quoteFlag = true;
                    // 判断其后是symbol还是list
                    if(code[i+1] === '(') {
                        var rightIndex = findPairedBraket(code, i);
                        var quoted = code.substring(i, rightIndex + 1);
                        html += ('<span class="code-quote">' + quoted + '</span>');
                        i = rightIndex;
                    }
                    else {
                        var quoted = code.substring(i + 1).match(regexIdentifierLisp)[0];
                        if(quoted != null) {
                            html += ('<span class="code-quote">\'' + quoted + '</span>');
                        }
                        i = i + quoted.length;
                    }
                }
                else {
                    html += current;
                }
            }

            /////////////////////////////////////
            // Python
            /////////////////////////////////////
            else if(lang.toLowerCase() === 'python') {

            }

            else {
                html += current;
            }
        }
        return [html, blevel];
    };

    // 段内样式解析器
    this.inparaStyleParser = function(paragraph) {
        // 太长不看
        if(paragraph.length > MAX_PARAGRAPH_LENGTH) { return paragraph; }

        // 首先将所有换行符解释为<br>
        paragraph = paragraph.replace(/\n{1}/g, '<br>');
    
        // 第1趟扫描：行内代码
        let segments = paragraph.split("`");
        let temp = new Array();
        for(let i = 0; i < segments.length; i++) {
            if(i === segments.length-1 && i % 2 === 1) { // 处理悬挂部分
                temp.push('`' + segments[i]);
            }
            else if(i !== segments.length-1 && i % 2 === 1) { // 对奇数且非最后一个分节加样式
                temp.push(fillTagWithContent(coverMetaChar(segments[i]), TAG_INPARA_CODE));
            }
            else {
                temp.push(segments[i]);
            }
        }
        paragraph = temp.join('');

        // 第2趟扫描：颜色标记（允许嵌套）
        temp = new Array();
        let currentIndex = 0;
        let lastSeparator = 'N';
        let lastColor = '';
        while(currentIndex >= 0 && currentIndex < paragraph.length) {
            // 分别计算左右括号的index paragraph.length
            let leftOffset = paragraph.substring(currentIndex).search(/\[\[\#[0-9A-Fa-f]{6}\:/g);
            let leftIndex = currentIndex + leftOffset;
            let rightOffset = paragraph.substring(currentIndex).search(/\#\]\]/g);
            let rightIndex = currentIndex + rightOffset;

            let content = '';
            if(leftOffset < 0 && rightOffset < 0) { break; }

            function fillColorTag() {
                if(lastSeparator === 'L') {
                    temp.push('<span style="color:' + lastColor + ';">' + content);
                }
                else if(lastSeparator === 'R') {
                    temp.push('</span>' + content);
                }
                else if(lastSeparator === 'N') {
                    temp.push(content);
                }
            }

            // 判断哪个在前
            if(leftOffset >= 0 && rightOffset >= 0 && leftOffset < rightOffset) {
                content = paragraph.substring(currentIndex, leftIndex);
                fillColorTag();
                lastColor = paragraph.substring(leftIndex + 2, leftIndex + 9);
                currentIndex = leftIndex + 10;
                lastSeparator = 'L';
            }
            else if(leftOffset >= 0 && rightOffset >= 0 && leftOffset > rightOffset){
                content = paragraph.substring(currentIndex, rightIndex);
                fillColorTag();
                currentIndex = rightIndex + 3;
                lastSeparator = 'R';
            }
            else if(leftOffset < 0 && rightOffset >= 0) {
                content = paragraph.substring(currentIndex, rightIndex);
                fillColorTag();
                currentIndex = rightIndex + 3;
                lastSeparator = 'R';
            }
            else { break; }
        }
        let tail = paragraph.substring(currentIndex);
        if(lastSeparator === 'L' || lastSeparator === 'N') {
            temp.push(tail);
        }
        else if(lastSeparator === 'R') {
            temp.push('</span>' + tail);
        }
    
        paragraph = temp.join('');
    
        // 第3趟扫描：粗体文本
        segments = paragraph.split("**");
        temp = new Array();
        for(let i = 0; i < segments.length; i++) {
            if(i === segments.length-1 && i % 2 === 1) { // 处理悬挂部分
                temp.push('**' + segments[i]);
            }
            else if(i !== segments.length-1 && i % 2 === 1) { // 对奇数且非最后一个分节加样式
                temp.push(fillTagWithContent(segments[i], TAG_INPARA_BOLD));
            }
            else {
                temp.push(segments[i]);
            }
        }
        paragraph = temp.join('');

        // 第4趟扫描：斜体文本
        segments = paragraph.split("%%");
        temp = new Array();
        for(let i = 0; i < segments.length; i++) {
            if(i === segments.length-1 && i % 2 === 1) { // 处理悬挂部分
                temp.push('%%' + segments[i]);
            }
            else if(i !== segments.length-1 && i % 2 === 1) { // 对奇数且非最后一个分节加样式
                temp.push(fillTagWithContent(segments[i], TAG_INPARA_ITALIC));
            }
            else {
                temp.push(segments[i]);
            }
        }
        paragraph = temp.join('');

        // 第5趟扫描：删除线文本
        segments = paragraph.split("~");
        temp = new Array();
        for(let i = 0; i < segments.length; i++) {
            if(i === segments.length-1 && i % 2 === 1) { // 处理悬挂部分
                temp.push('~' + segments[i]);
            }
            else if(i !== segments.length-1 && i % 2 === 1) { // 对奇数且非最后一个分节加样式
                temp.push(fillTagWithContent(segments[i], TAG_INPARA_DEL));
            }
            else {
                temp.push(segments[i]);
            }
        }
        paragraph = temp.join('');
    
        // 第6趟扫描：超链接[]()
        // 超链接是不允许嵌套的
        temp = new Array();
        currentIndex = 0;
        while(currentIndex >= 0 && currentIndex < paragraph.length) {
            // 分别计算[、](、]的位置(?!\[)
            let leftSBOffset = paragraph.substring(currentIndex).search(/\[/g);
            let leftSBIndex = currentIndex + leftSBOffset;
            let middleOffset = paragraph.substring(currentIndex).search(/\]\(/g);
            let middleIndex = currentIndex + middleOffset;
            let rightRBOffset = paragraph.substring(currentIndex).search(/\)/g);
            let rightRBIndex = currentIndex + rightRBOffset;

            // 判断超链接是否存在
            if(!(leftSBOffset < middleOffset && middleOffset < rightRBOffset)) {
                break;
            }

            // 计算链接文本和URL。若URL为空，则以文本为URL。圆括号不可省略
            let text = paragraph.substring(leftSBIndex + 1, middleIndex);
            let urlstr = paragraph.substring(middleIndex + 2, rightRBIndex);
            if(urlstr === '') {urlstr = text;}
            let before = paragraph.substring(currentIndex, leftSBIndex);

            temp.push(before);
            temp.push('<a href="' + urlstr + '">' + text + '</a>');

            currentIndex = rightRBIndex + 1;
        }
        // 尾部
        let after = paragraph.substring(currentIndex);
        temp.push(after);
        paragraph = temp.join('');

        return paragraph;
    };

    // 段落级样式处理器
    this.paragraphParser = function(paragraph) {
        let HTML = new Array();

        // 跳过空段落
        if(paragraph.length <= 0) { return paragraph; }

        // 20180113 修复：自然段落前后去掉空白符号，避免解析出错
        paragraph = paragraph.trim();

        // 针对各种段落样式进行解析
        // 标题（井号开头的单行段落）
        if(/^#.+/.test(paragraph) === true) {
            // 计算井号数量（标题层级）
            let level = (paragraph.match(/^#+(?=[^#])/i)[0]).length;
            // 计算标题文本
            let titleFrom = paragraph.search(/#(?=[^#])/i) + 1; // 最后一个井号的下一位
            let title = paragraph.substring(titleFrom).trim(); // 截取井号后面的内容（以及空格）
            // 组装HTML
            HTML.push(`<h1 id="${title}" class="target-fix">${title}</h1>`);
            HTML.push(`<h${level} id="title${titleCount}">${title}</h${level}>`);
            // 2级及以下标题，标题名称加#，二级加一个，三级加两个，以此类推
            for(let c = level; c > 1; c--) {
                title = '#' + title;
            }
            bookmarkTitle.push(title);
            titleCount++;
        }
        // 水平分隔线（至少三个dash的单行段落）
        else if(/^\-{3,}$/.test(paragraph) === true) {
            HTML.push('<hr>');
        }
        // 有序列表（+号开头的段落）
        else if(/^\++[\s\S]+/.test(paragraph) === true) {
            // 按行分割列表项
            let lines = paragraph.split("\n");
            // 层级计数器
            let currentLevel = 0;
            for(let i = 0; i < lines.length; i++) {
                let line = lines[i];
                // 计算+号数量（列表层级）
                let plus = line.match(/^\++(?=[^\+])/i);
                if(plus == null) {
                    HTML.push(paragraph);
                    break;
                }
                let level = plus[0].length;
                // 计算列表文本
                let itemFrom = line.search(/\+(?=[^\+])/i) + 1; // 最后一个+号的下一位
                let item = line.substring(itemFrom); // 截取+号后面的内容（含空格）
                item = item.trim(); // 去掉+号和内容之间的空格
                // 判断层级是否改变
                if(level > currentLevel) { // 嵌套加深，则按照差值在内容后输出<ol>
                    for(let c = 0; c < (level - currentLevel); c++) {
                        HTML.push('<ol>');
                    }
                    HTML.push('<li>');
                    HTML.push(inparaStyleParser(item));
                    currentLevel = level;
                }
                else if(level < currentLevel){ // 嵌套退出，则按照差值增加闭合标签
                    for(let c = 0; c < (currentLevel - level); c++) {
                        HTML.push('</li></ol>');
                    }
                    HTML.push('</li><li>');
                    HTML.push(inparaStyleParser(item));
                    currentLevel = level;
                }
                else { // 保持同级
                    HTML.push('</li><li>');
                    HTML.push(inparaStyleParser(item));
                    currentLevel = level;
                }
            }
            // 闭合列表标签
            for(let c = 0; c < currentLevel; c++) {
                HTML.push('</li></ol>');
            }
        }
        // 无序列表（-号开头的段落）
        else if(/^\-+[\s\S]+/.test(paragraph) == true) {
            // 按行分割列表项
            let lines = paragraph.split("\n");
            // 层级计数器
            let currentLevel = 0;
            lines.forEach(function(line, index, lines) {
                // 计算-号数量（列表层级）
                let minus = line.match(/^\-+(?=[^\-])/i);
                if(minus == null) {
                    HTML.push(paragraph); return;
                }
                let level = minus[0].length;
                // 计算列表文本
                let itemFrom = line.search(/\-(?=[^\-])/i) + 1; // 最后一个-号的下一位
                let item = line.substring(itemFrom); // 截取-号后面的内容（含空格）
                item = item.trim(); // 去掉-号和内容之间的空格
                // 判断层级是否改变
                if(level > currentLevel) { // 嵌套加深，则按照差值在内容后输出<ol>
                    for(let c = 0; c < (level - currentLevel); c++) {
                        HTML.push('<ul>');
                    }
                    HTML.push('<li>');
                    HTML.push(inparaStyleParser(item));
                }
                else if(level < currentLevel){ // 嵌套退出，则按照差值增加闭合标签
                    for(let c = 0; c < (currentLevel - level); c++) {
                        HTML.push('</li></ul>');
                    }
                    HTML.push('</li><li>');
                    HTML.push(inparaStyleParser(item));
                }
                else { // 保持同级
                    HTML.push('</li><li>');
                    HTML.push(inparaStyleParser(item));
                }
                currentLevel = level;
            });
            // 闭合列表标签
            for(let c = 0; c < currentLevel; c++) {
                HTML.push('</li></ul>');
            }
        }
        // 网易云音乐插件（|||链接|||）
        else if(/^\|{3}.+\|{3}$/.test(paragraph) === true) {
            console.log('网易云音乐插件\n' + paragraph);
            let musicURL = paragraph.substring(3, paragraph.length - 3);
            let musicid = musicURL.match(/\&id\=\d+\&/gi)[0].match(/\d+/gi)[0];
            HTML.push(`<div id="ncm_${musicid}" style="text-align: center;"><iframe frameborder="no" border="0" marginwidth="0" marginheight="0" width=330 height=86 src="${musicURL}"></iframe></div>`);
            //eg. https://music.163.com/outchain/player?type=2&id=527425519&auto=0&height=66
        }
        // 表格（以竖线开始结尾的段落，除网易云音乐插件）
        else if(/^\|[\s\S]+\|$/g.test(paragraph) === true) {
            // 按行分割
            let rows = paragraph.split("\n");
            // 分割线标识
            let hasHeadline = false;
            // 对齐方式：下标为列序号（从1开始）
            let alignType = new Array();
            HTML.push('<div class="md-table-container"><table class="md-table">');
            rows.forEach(function(row, index, rows) {
                let cols = row.split("|");
                if(cols.length <= 2) {
                    console.log("Syntax error."); return;
                }
                if(cols.length == 3 && /\-{3,}/i.test(cols[1])==true) {
                    hasHeadline = true;
                }
                else {
                    HTML.push('<tr>');
                    if(hasHeadline == true) { // TD表格主体
                        for(let c = 1; c < cols.length - 1; c++) {
                            HTML.push(`<td${( alignType[c] ? alignType[c] : '' )}>${inparaStyleParser(cols[c])}</td>`);
                        }
                    }
                    else { // TH表头
                        for(let c = 1; c < cols.length - 1; c++) {
                            // 记录对齐方式
                            if(/^\:.*\:$/gi.test(cols[c])) {
                                alignType[c] = ` style="text-align:center;"`;
                            }
                            else if(/\:$/gi.test(cols[c])) {
                                alignType[c] = ` style="text-align:right;"`;
                            }
                            else if(/^\:/gi.test(cols[c])) {
                                alignType[c] = ` style="text-align:left;"`;
                            }
                            else {
                                alignType[c] = '';
                            }
                            cols[c] = cols[c].replace(/\:$/gi, '').replace(/^\:/gi, '');
                            HTML.push(`<th${( alignType[c] ? alignType[c] : '' )}>${inparaStyleParser(cols[c])}</th>`);
                        }
                    }
                    HTML.push('</tr>');
                }
            });
            HTML.push('</table></div>');
        }
        // 图片
        else if(/^\!\[.+\]\(.+\)$/g.test(paragraph) === true) {
            let imgTitle = paragraph.match(/^\!\[.+\]\(/g)[0];
            imgTitle = imgTitle.substring(2, imgTitle.length - 2);
            let imgURL = paragraph.match(/\]\([^(\]\()]+\)$/g)[0];
            imgURL = imgURL.substring(2, imgURL.length - 1);
            HTML.push(`<div class="imgbox">
            <div class="loading">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
            <img class="md_img" data-src="${imgURL}"><div class="imgtitle">${inparaStyleParser(imgTitle)}</div></div>`);
        }
        // 居中的段落
        else if(/^\:.+/g.test(paragraph) === true) {
            let center = paragraph.substring(1).trim(); // 截取:号后面的内容（以及空格）
            HTML.push(`<p style="text-align:center;text-indent:0;">${inparaStyleParser(center)}</p>`);
        }
        // 带有自定义CSS样式的段落（$css{...}...）
        else if(/^\$css\{[\s\S]*\}[\s\S]+$/gi.test(paragraph) === true) {
            
        }
        // LaTeX公式段落
        else if(/^\$\$.+\$\$$/g.test(paragraph) === true) {
            HTML.push(`<p>${paragraph}</p>`);
        }
        // 只有一个button标签的段落
        else if(/^\<button[\s\S]+\/button\>$/g.test(paragraph) === true) {
            HTML.push(`<p>${inparaStyleParser(paragraph)}</p>`);
        }
        // 带有其他HTML标签的段落
        else if(/^\<[\s\S]+\>$/g.test(paragraph) === true) {
            HTML.push(inparaStyleParser(paragraph));
        }
        // 普通段落（除上述种类的段落和引用、代码块两种）
        else {
            HTML.push(`<p>${inparaStyleParser(paragraph)}</p>`);
        }
        return HTML.join('');
    };

    // 跨段落元素分析
    this.contextParser = function(text){
        let HTML = new Array();

        // 引用块计数
        let quoteFlag = false;
        let quoteLevel = 0;
        // 代码块标识
        let codeFlag = false;
        // 代码块语言标识
        let codeLanguage = '';
        // 跨自然段的括号层次计数
        let bracketLevel = 0;

        // 自然段落分隔
        let paragraphs = text.split(/\n{2,}/g);

        // 遍历各个段落，判断段落类型
        for(let pcount = 0; pcount < paragraphs.length; pcount++) {
            let paragraph = paragraphs[pcount];

            // 引用框？
            if(/^>.+/g.test(paragraph) === true) {
                quoteFlag = true;
                // 计算>号数量（引用层级）
                let level = (paragraph.match(/^>+(?=[^>])/i)[0]).length;

                // 计算引用文本
                let quoteFrom = paragraph.search(/\>(?=[^\>])/i) + 1; // 最后一个>号的下一位
                let quote = paragraph.substring(quoteFrom); // 截取>号后面的内容（含空格）
                // quote = quote.replace(/^( )+(?!( ))/i, ""); // 去掉>号和内容之间的空格
                quote = quote.trim(); // 去掉>号和内容之间的空格

                // 判断层级是否改变
                if(level > quoteLevel) { // 嵌套加深
                    for(let c = 0; c < (level - quoteLevel); c++) {
                        HTML.push('<blockquote>');
                    }
                    HTML.push(paragraphParser(quote));
                }
                else if(level < quoteLevel){ // 嵌套退出
                    for(let c = 0; c < (quoteLevel - level); c++) {
                        HTML.push('</blockquote>');
                    }
                    HTML.push(paragraphParser(quote));
                }
                else { // 保持同级，不加标签
                    HTML.push(paragraphParser(quote));
                }
                quoteLevel = level;
            }

            // 代码分界符所在的段
            else if(/((```)|(```(\:.*)?))/g.test(paragraph) === true) {
                let codeLanguages = paragraph.match(/\:.*/g);
                if(codeLanguages != null) {
                    codeLanguage = codeLanguages[0].substring(1);
                }
                else {
                    codeLanguage = '.';
                }
                if(codeFlag == false) {
                    codeFlag = true;
                    bracketLevel = 0;
                    HTML.push(`<pre><code>`);
                }
                else {
                    codeFlag = false;
                    HTML.pop(); // 删除最后一个空行
                    HTML.push(`</code></pre>`);
                }
            }

            // 除引用和代码之外的段落
            else {
                // 处理代码块
                if(codeFlag == true) {
                    let highlighted = codeHighlighter(paragraph, codeLanguage, bracketLevel);
                    bracketLevel = highlighted[1];
                    HTML.push(highlighted[0]);
                    HTML.push("\n\n");
                    continue;
                }
                // 闭合引用标签，并退出引用状态
                if(quoteFlag == true) {
                    for(let c = 0; c < quoteLevel; c++) {
                        HTML.push('</blockquote>');
                    }
                    quoteLevel = 0;
                }
                quoteFlag = false;
                HTML.push(paragraphParser(paragraph));
            }
        }
        return HTML.join('');
    };

    // 解析 Mikumark Markdown 文档
    this.Parse = function(document) {
        document = document || mikumarkDocString;
        let documentObject = new Object();

        // 首先提取 metadata、css、js、content四部分
        let lines = document.split('\n');
        let state = 0;
        let metadataArray = new Array();
        let jsArray = new Array();
        let cssArray = new Array();
        let markdownArray = new Array();
        for(let i = 0; i < lines.length; i++) {
            let line = lines[i];
            if(line === '#!metadata') {
                state = 'metadata'; continue;
            }
            else if(line === '#!css'){
                state = 'css'; continue;
            }
            else if(line === '#!js'){
                state = 'js'; continue;
            }
            else if(line === '#!content'){
                state = 'content'; continue;
            }
            else {
                if(state === 'metadata') {
                    metadataArray.push(line);
                }
                else if(state === 'css'){
                    cssArray.push(line);
                }
                else if(state === 'js'){
                    jsArray.push(line);
                }
                else if(state === 'content'){
                    markdownArray.push(line);
                }
            }
        }

        // 处理元数据
        let metadataStr = metadataArray.join('');
        documentObject.metadata = JSON.parse(metadataStr);

        // 处理CSS
        let cssStr = cssArray.join('\n');
        documentObject.css = cssStr;

        // 处理JS
        let jsStr = jsArray.join('\n');
        documentObject.js = jsStr;

        // 组装markdown
        let markdown = markdownArray.join('\n');
        // 预处理：转义字符替换，去掉开头的空格
        markdown = markdown
        .replace(/\\(?!\\)[\*]/g, C_STAR).replace(/\\(?!\\)[\~]/g, C_WAVE).replace(/\\(?!\\)[\`]/g, C_REVQ)
        .replace(/\\(?!\\)[\[]/g, C_LSQB).replace(/\\(?!\\)[\]]/g, C_RSQB).replace(/\\(?!\\)[\(]/g, C_LRDB)
        .replace(/\\(?!\\)[\)]/g, C_RRDB).replace(/\\(?!\\)[\$]/g, C_DOLR).replace(/\\(?!\\)[\|]/g, C_VERT)
        .replace(/\\(?!\\)[\+]/g, C_PLUS).replace(/\\(?!\\)[\\]/g, C_BSLT).replace(/\\(?!\\)[\#]/g, C_SHRP)
        .replace(/\\(?!\\)[\-]/g, C_MNUS).replace(/\\(?!\\)[\&]/g, C_AMPS).replace(/\\(?!\\)[\%]/g, C_PCNT)
        .replace(/^\s+(?=[\S])/i, "");
    
        // 预处理之二：适应遗留文本，在每个```前后强行加两个换行符(```)|
        let codeDelim = markdown.match(/\n((```)|(```(\:.*)?))\n/g);
        if(codeDelim != null) {
            for(let i = 0; i < codeDelim.length; i++) {
                let delim = codeDelim[i];
                markdown = markdown.replace(new RegExp(delim,'g'), ('\n\n' + delim + '\n\n'));
            }
        }
        markdown = markdown.replace(/\n```\n/g, '\n\n```\n\n');

        let html = contextParser(markdown);

        // 元字符换回
        html = html
        .replace(new RegExp(C_STAR,'g'), '*').replace(new RegExp(C_WAVE,'g'), '~').replace(new RegExp(C_REVQ,'g'), '`')
        .replace(new RegExp(C_LSQB,'g'), '[').replace(new RegExp(C_RSQB,'g'), ']').replace(new RegExp(C_LRDB,'g'), '(')
        .replace(new RegExp(C_RRDB,'g'), ')').replace(new RegExp(C_DOLR,'g'), '$').replace(new RegExp(C_VERT,'g'), '|')
        .replace(new RegExp(C_PLUS,'g'), '+').replace(new RegExp(C_BSLT,'g'), '\\').replace(new RegExp(C_SHRP,'g'), '#')
        .replace(new RegExp(C_MNUS,'g'), '-').replace(new RegExp(C_AMPS,'g'), '&').replace(new RegExp(C_PCNT,'g'), '%');

        documentObject.html = html;

        mikumarkDocObject = documentObject;
        return documentObject;
    };


    var menuState = 0;
    // 页面渲染动作
    this.RenderProcedure = {
        // 版权日期
        copyrightYear: function() {
            if(document.getElementById('copyright_year') !== null) {
                document.getElementById('copyright_year').innerHTML = new Date().getFullYear();
            }
            let years = document.getElementsByClassName('copyright_year');
            for(let i = 0; i < years.length; i++) {
                years[i].innerHTML = new Date().getFullYear();
            }
        },
        // 控制top按钮和菜单按钮的水平位置
        buttonLayout: function() {
            if($(window).width() >= 650) {
                let rightMargin = $(".main-container").css("margin-right").match(/^\d+/gi);
                let leftMargin = $(".main-container").css("margin-left").match(/^\d+/gi);
    
                let buttonWidth = $(".goTop").css("width").match(/^\d+/gi);
                $(".goTop").css("right", (rightMargin - buttonWidth - 30).toString() + 'px');
                let menuButtonWidth = $("#contents_container").css("width").match(/^\d+/gi);
                $("#contents_container").css("right", (rightMargin - menuButtonWidth - 30).toString() + 'px');
    
                let backbuttonWidth = $('.title_button_left').css("width").match(/^\d+/gi);
                $(".title_button_left").css("left", (leftMargin - backbuttonWidth - 50).toString() + 'px');
            }
            else {
                $(".goTop").css("right", '20px');
                $(".title_button_left").css("left", '0px');
            }
        },
        // 生成目录
        loadContents: function() {
            let topBookmark = '<ul class="topBookmark">';
            bookmarkTitle.push('');

            const sharpCount = function(title) {
                let count = 0;
                for(let i = 0; i < title.length; i++) {
                    if(title[i] === '#') { count++; }
                    else { break; }
                }
                return (count+1);
            };

            const getRealTitle = function(title) {
                return title.replace(/^\#+/gi, '');
            };

            // 保证标签匹配的栈
            let stack = new Array();
            stack.push('{'); // 刚才已经有一个ul了

            for(var i = 0; i < (bookmarkTitle.length - 1); i++) {
                let thisLevel = sharpCount(bookmarkTitle[i]);
                let nextLevel = sharpCount(bookmarkTitle[i+1]);
                // 缩进
                if(thisLevel < nextLevel) {
                    topBookmark += `<li><a class="topBookmarkLink" id="link${i}" href="#${getRealTitle(bookmarkTitle[i])}">${getRealTitle(bookmarkTitle[i])}</a>`;
                    stack.push('(');
                    
                    for(let c = 0; c < nextLevel - thisLevel; c++) {
                        // bmHtml += '<ul class="topBookmarkItem">';
                        topBookmark += '<ul class="topBookmarkItem">';
                        stack.push('{');
                    }
                }
                // 退出缩进
                else if(thisLevel > nextLevel) {
                    topBookmark += `<li><a class="topBookmarkLink" id="link${i}" href="#${getRealTitle(bookmarkTitle[i])}">${getRealTitle(bookmarkTitle[i])}</a>`;
                    stack.push('(');
                    let count = thisLevel - nextLevel;
                    while(count >= 0) {
                        if(stack[stack.length-1] === '(') {
                            stack.pop();
                            // bmHtml += `</li>`;
                            topBookmark += `</li>`;
                        }
                        else if(stack[stack.length-1] === '{') {
                            if(count > 0) {
                                stack.pop();
                                // bmHtml += `</ul>`;
                                topBookmark += `</ul>`;
                            }
                            count--;
                        }
                    }
                }
                // 平级
                else {
                    topBookmark += `<li><a class="topBookmarkLink" id="link${i}" href="#${getRealTitle(bookmarkTitle[i])}">${getRealTitle(bookmarkTitle[i])}</a></li>`;
                }
            }
            topBookmark += '</ul>';
            // 向顶部可折叠目录插入目录列表
            $('#contents_list').html(topBookmark);
        },
        // body淡入
        bodyFadeIn: function() {
            $("body").animate({'opacity':1.0}, 1000);
        },
        // 延时1秒，等待DOM加载完毕
        refreshOffsetTop: function() {
            setTimeout(()=>{
                let titleDOM = $('h1,h2,h3,h4,h5,h6').not('.target-fix');
                for(let i in titleDOM) {
                    let DOM = titleDOM[i];
                    let offsetTop = DOM.offsetTop;
                    let id = DOM.id;
                    if(id === null || id === undefined) { continue; }
                    id = parseInt(id.match(/\d+/gi)[0]);
                    titleOffsetTop[id] = offsetTop;
                }
                titleOffsetTop[bookmarkTitle.length] = Number.MAX_SAFE_INTEGER;
            }, 1000);
        },
        // 通过滚动位置控制文章标题显示
        scrollControl: function() {
            $(document).scroll(function() {
                function getTop() {
                    if (document.documentElement && document.documentElement.scrollTop) {
                        return document.documentElement.scrollTop;
                    } else if (document.body) {
                        return document.body.scrollTop;
                    }
                }
                let top = getTop();
                if($(window).width() >= 650) {
                    $('.top_title').hide();
                    $('.goTop').fadeIn(300);
                }
                else {
                    if(top > 280) {
                        $('.top_title').fadeIn(300);
                        $('.goTop').fadeIn(300);
                    }
                    else {
                        $('.top_title').fadeOut(300);
                        $('.goTop').fadeOut(300);
                    }
                }
                // 控制目录标题高亮
                for(let i = 0; i < bookmarkTitle.length - 1; i++) {
                    if(titleOffsetTop[i] <= top && titleOffsetTop[i+1] >= top) {
                        $('#link' + i).addClass('selected');
                    }
                    else {
                        $('#link' + i).removeClass('selected');
                    }
                }
            });
        },
        maskAction: function() {
            $("#shadow_mask").click(function(){
                $("#shadow_mask").toggle();
                if($("#contents").css('display') === 'block') {
                    if($(window).width() >= 650) {
                        $('#contents').animate({width:'toggle'},150);
                    }
                    else {
                        $('#contents').slideToggle(150);
                    }
                }
                if($("#image_menu").css('display') === 'block'){
                    $('#image_menu').slideToggle(100);
                }
            });
        },

        contentsButtonAction: function() {
            function toggleContents() {
                if(menuState === 0) {
                    menuState = 1;
                    $("#menu_toggle_bar_1").removeClass();
                    $("#menu_toggle_bar_1").addClass("menu-toggle-bar-1-rot");
                    $("#menu_toggle_bar_2").removeClass();
                    $("#menu_toggle_bar_2").addClass("menu-toggle-bar-2-rot");
                    $("#menu_toggle_bar_3").removeClass();
                    $("#menu_toggle_bar_3").addClass("menu-toggle-bar-3-rot");
    
                    if($(window).width() >= 650) {
                        $("#contents_container").css("border-radius", "20px");
                        $("#contents_container").animate({width: "400px", height: "600px"}, 200, "easeOutExpo");
                    }
                    else {
                        $("#contents_container").css("background-color", "#ffffff");
                        $("#contents_container").animate({width: "100%", height: "100%"}, 200, "easeOutExpo");
                    }
                }
                else {
                    menuState = 0;
                    $("#menu_toggle_bar_1").removeClass();
                    $("#menu_toggle_bar_1").addClass("menu-toggle-bar-1-hor");
                    $("#menu_toggle_bar_2").removeClass();
                    $("#menu_toggle_bar_2").addClass("menu-toggle-bar-2-hor");
                    $("#menu_toggle_bar_3").removeClass();
                    $("#menu_toggle_bar_3").addClass("menu-toggle-bar-3-hor");
    
                    if($(window).width() >= 650) {
                        $("#contents_container").animate({width: "40px", height: "40px"}, 200, "easeOutExpo");
                    }
                    else {
                        $("#contents_container").animate({width: "40px", height: "40px"}, 200, "easeOutExpo", ()=> {
                            $("#contents_container").css("background", "none");
                        });
                    }
                }
            }
            $('.topBookmarkLink').click(toggleContents);
            $('#contents_button').click(toggleContents);
        },

        // 为每张图片注册单击事件
        imageOnclick: function() {
            $('.md_img').each(function(i,e) {
                $(e).click(function() {
                    window.open($(e).attr('src'), "_blank");
                });
            });
        },


        // 图片懒加载（20190217）
        imageLazyLoading: function() {
            $(document).scroll(function() {
                let top = document.documentElement.scrollTop || document.body.scrollTop;
                let clientHeight = document.documentElement.clientHeight;
                $('.md_img').each(function(i,e) {
                    let offsetTop = $(e).offset().top;
                    if($(e).attr('src') === undefined) {
                        if(offsetTop >= top && offsetTop <= top + clientHeight) {
                            console.log(`开始加载当前视口内未加载的图片：${$(e).attr('data-src')}`);
                            $(e).attr('src', $(e).attr('data-src'));
                            e.onload = ()=>{
                                $(e).parent().children('.loading').fadeOut(500);
                            };
                        }
                    }
                });
            });
        },

    };

    // 加载正文前就应该完成的
    this.Init = function() {
        // 立即执行
        (function() {
            RenderProcedure.copyrightYear();
            RenderProcedure.buttonLayout();
            RenderProcedure.bodyFadeIn();
            RenderProcedure.maskAction();
            RenderProcedure.imageLazyLoading();
            //...
        })();
        window.onresize = function() {
            RenderProcedure.buttonLayout();
            //...
        };
    };

    // 页面渲染控制主流程
    this.Render = function(docObject) {
        var docObject = docObject || mikumarkDocObject;

        const duration = 500;

        ////////////////////////
        // 修改网页上的元数据
        ////////////////////////
        $('title').html(docObject.metadata.title + ' / Project Aurora');

        let titleBgUrl = (typeof(docObject.metadata.titleImage) === 'undefined' || docObject.metadata.titleImage.length <= 0) ? DEFAULT_COVER : docObject.metadata.titleImage;
        $('#metadata-title-bg').css('background-image', `url('${titleBgUrl}')`);

        if(typeof(docObject.metadata.title) != 'undefined') {
            $('#metadata-title').css('opacity', '0');
            $('#metadata-title').html(docObject.metadata.title);
            $('#metadata-title').animate({'opacity':1.0}, duration);
        }
        if(typeof(docObject.metadata.date) != 'undefined' && /\d\d\d\d\-\d\d-\d\d/.test(docObject.metadata.date) == true) {
            let date = (docObject.metadata.date.replace(/\-/,"年").replace(/\-/,"月") + '日');
            $('#metadata-date').css('opacity', '0');
            $('#metadata-date').html(date);
            $('#metadata-date').animate({'opacity':1.0}, duration);
        }
        if(typeof(docObject.metadata.author) != 'undefined') {
            let author = docObject.metadata.author[0].toString();
            $('#metadata-author').css('opacity', '0');
            $('#metadata-author').html(`作者：${author}`);
            $('#metadata-author').animate({'opacity':1.0}, duration);
        }

        $('#top_title').html(docObject.metadata.title);

        /////////////
        // 插入CSS
        /////////////

        let freeCSSCode = new Array();
        let linkCSSTag =  new Array();
        let cssLines = docObject.css.split('\n');
        for(let i = 0; i < cssLines.length; i++) {
            let line = cssLines[i];
            if(/^\#css\:/i.test(line.trim())) { // 引用的外部CSS：#css:...
                linkCSSTag.push((line.trim()).substring(5));
            }
            else { // 普通的JS代码行
                freeCSSCode.push(line);
            }
        }
        for(let i = 0; i < linkCSSTag.length; i++) {
            let linkNode = document.createElement('link');
            linkNode.rel = "stylesheet";
            linkNode.type = "text/css";
            linkNode.href = linkCSSTag[i];
            linkNode.charset = "utf-8";
            $('head').append(linkNode);
        }
        let freeStyleNode = document.createElement('style');
        freeStyleNode.innerHTML = freeCSSCode.join('\n');
        $('head').append(freeStyleNode);



        /////////////
        // 插入JS
        // 注意：分为两部分，分别在文档正文前后
        /////////////
        let freeJsCode = new Array();
        let scriptTag =  new Array();
        let jsLines = docObject.js.split('\n');
        for(let i = 0; i < jsLines.length; i++) {
            let line = jsLines[i];
            if(/^\#script\:/i.test(line.trim())) { // 引用的外部JS：#script:...
                scriptTag.push((line.trim()).substring(8));
            }
            else { // 普通的JS代码行
                freeJsCode.push(line);
            }
        }
        for(let i = 0; i < scriptTag.length; i++) {
            let scriptNode = document.createElement('script');
            scriptNode.src = scriptTag[i];
            scriptNode.async = 'async';
            $('head').append(scriptNode);
        }

        /////////////
        // 插入正文
        /////////////
        $('#md-mainblock').css('opacity', '0');
        $('#md-mainblock').html(docObject.html);
        $("#md-mainblock").animate({'opacity':1.0}, duration);


        /////////////
        // 插入JS（第二部分）
        /////////////
        let freeScriptNode = document.createElement('script');
        freeScriptNode.defer = 'defer';
        freeScriptNode.innerHTML = freeJsCode.join('\n');
        $('body').append(freeScriptNode);




        // 立即执行
        RenderProcedure.loadContents();
        RenderProcedure.refreshOffsetTop();
        RenderProcedure.scrollControl();
        RenderProcedure.imageOnclick();
        RenderProcedure.contentsButtonAction();
        //...

        // 执行一次滚动事件，以触发第一视口的图片懒加载
        $(document).scroll();
    };

    return this;
}

// window.Mikumark = Mikumark;

