function ParseArticleList(articleList) {
    let CATEGORIES = new Array();
    let ARTICLES = new Array();
    let lines = articleList.split(/\n+/gi);
    let currentCategory = -1;
    for(let line of lines) {
        // 跳过空行或者注释行
        if(line.length <= 0 || line[0] === ';') {
            continue;
        }
        // 表示文章分类的行
        else if(/^\#\#\s/.test(line)) {
            CATEGORIES.push(line.substring(3));
            currentCategory = CATEGORIES.length-1;
        }
        // 文章信息行
        else {
            let fields = line.split('|');
            let title     = fields[0] ? fields[0].trim() : "";
            let articleID = fields[1] ? fields[1].trim() : "";
            let date      = fields[2] ? fields[2].trim() : "";
            let type      = fields[3] ? fields[3].trim() : "";
            let flag      = fields[4] ? fields[4].trim() : "";
            ARTICLES.push({
                "title": title,
                "link": `./article.html?id=${articleID}`,
                "date": date,
                "type": type,
                "category": currentCategory,
                "flag": flag
            });
        }
    }
    let contents = {
        "CATEGORIES": CATEGORIES,
        "ARTICLES": ARTICLES
    };
    console.log(contents);
    return contents;
}

function GetTypeColor(type) {
    const TYPE_COLOR = {
        "原创":"#9dd9ff",
        "翻译":"#ffcc6c",
        "转载":"#aadd33",
        "置顶":"pink",
    };
    return (type in TYPE_COLOR) ? TYPE_COLOR[type] : '#cccdcd';
}

function RenderArticleList(CONTENTS, sortOption) {
    const FillZero = (num) => { return ('000000' + num.toString()).substr(-2); };
    // 按类别归类
    if(sortOption === 'category') {
        // 每一类生成一组html，然后拼接起来
        let html = new Array(CONTENTS.CATEGORIES.length);
        for(let i = 0; i < CONTENTS.CATEGORIES.length; i++) { html[i] = ''; }
        for(let i = 0; i < CONTENTS.ARTICLES.length; i++) {
            let item = CONTENTS.ARTICLES[i];
            let flagSpan = (item.flag.length > 0) ? ('<span class="articles_item_flag">' + item.flag + '</span>') : '';
            // 先组装HTML
            let itemNumberBgColor = (item.flag === "置顶") ? GetTypeColor('置顶') : GetTypeColor(item.type);
            let itemTypeTag = item.type;
            let htmlstr = `<div class="articles_item_line enter"><span class="articles_item_number" style="color:${itemNumberBgColor};border-color:${itemNumberBgColor};">${FillZero(i+1)}</span><span style="display:inline-block;max-width:50%;"><a class="article_link" href="${item.link}">${item.title}</a>${flagSpan}</span><span class="articles_item_date"><span style="color:${itemNumberBgColor};">${itemTypeTag}</span> · ${item.date}</span></div>`;

            html[item.category] += htmlstr;
        }
        let listHtml = '';
        for(let i = 0; i < CONTENTS.CATEGORIES.length; i++) {
            let title = CONTENTS.CATEGORIES[i].split('|')[0];
            let subtitle = CONTENTS.CATEGORIES[i].split('|')[1];
            listHtml += `<div class="articles_category_list" id="c${i}"><div class="articles_category_title enter">${title}<span class="articles_category_title_en"> · ${subtitle}</span></div>`;
            listHtml += html[i];
            listHtml += '</div>';
        }
        document.getElementById('list_container').innerHTML = listHtml;
    }
    // 按日期降序
    else if(sortOption === 'date-dec') {
        let html = '<div class="articles_category_list" id="date-dec">';
        let indexArray = SortByDate(CONTENTS, 1);
        for(let i = 0; i < indexArray.length; i++) {
            let item = CONTENTS.ARTICLES[indexArray[i]];
            let flagSpan = (item.flag.length > 0) ? ('<span class="articles_item_flag">' + item.flag + '</span>') : '';
            let itemNumberBgColor = (item.flag === "置顶") ? GetTypeColor('置顶') : GetTypeColor(item.type);
            let itemTypeTag = item.type;
            html += `<div class="articles_item_line enter"><span class="articles_item_number" style="color:${itemNumberBgColor};border-color:${itemNumberBgColor};">${FillZero(i+1)}</span><span style="display:inline-block;max-width:50%;"><a class="article_link" href="${item.link}">${item.title}</a>${flagSpan}</span><span class="articles_item_date"><span style="color:${itemNumberBgColor};">${itemTypeTag}</span> · ${item.date}</span></div>`;
        }
        html += `</div>`;
        document.getElementById('list_container').innerHTML = html;
    }
    // 默认顺序
    else {
        let html = '<div class="articles_category_list" id="date-dec"><table class="category_item_table">';
        for(let i = 0; i < CONTENTS.ARTICLES.length; i++) {
            let item = CONTENTS.ARTICLES[i];
            let flagSpan = (item.flag.length > 0) ? ('<span class="flag">' + item.flag + '</span>') : '';
            html += `<tr class="articles_item_line enter"><td><span class="articles_item_number" style="background-color:${GetTypeColor(item.type)};">${FillZero(i+1)}</span><a class="article_link" href="${item.link}">${item.title}</a>${flagSpan}<span class="article_date"><span style="color:${GetTypeColor(item.type)};">${item.type}</span> | ${item.date}</span></td></tr>`;
        }
        html += `</table></div>`;
        document.getElementById('list_container').innerHTML = html;
    }

    // 文章标题进场动画
    SlideInOneByOne("enter", 5, 500, 30);
}

function CompareDate(a, b) {
    if(/20\d{2}-\d{2}-\d{2}/gi.test(a) !== true && /20\d{2}-\d{2}-\d{2}/gi.test(b) !== true) {
        return 0;
    }
    else if(/20\d{2}-\d{2}-\d{2}/gi.test(a) === true && /20\d{2}-\d{2}-\d{2}/gi.test(b) !== true){
        return -1;
    }
    else if(/20\d{2}-\d{2}-\d{2}/gi.test(a) !== true && /20\d{2}-\d{2}-\d{2}/gi.test(b) === true){
        return 1;
    }
    else {
        let yearA = parseInt(a.substring(0,4));
        let yearB = parseInt(b.substring(0,4));
        let monthA = parseInt(a.substring(5,7));
        let monthB = parseInt(b.substring(5,7));
        let dayA = parseInt(a.substring(8));
        let dayB = parseInt(b.substring(8));
        if(yearA === yearB) {
            if(monthA === monthB) {
                if(dayA === dayB) { return 0; }
                else { return (dayA > dayB) ? (-1) : (1); } }
            else { return (monthA > monthB) ? (-1) : (1); } }
        else { return (yearA > yearB) ? (-1) : (1); }
    }
}

function SortByDate(CONTENTS, order) {
    // 首先扫描一遍CONTENTS.ARTICLES
    let dateArray = new Array();
    for(let i = 0; i < CONTENTS.ARTICLES.length; i++) {
        dateArray.push({
            index: i,
            date: CONTENTS.ARTICLES[i].date,
            isTop: (CONTENTS.ARTICLES[i].flag === "置顶"),
        });
    }
    // 对日期进行排序
    dateArray.sort(function(a, b) {
        if(a.isTop) {
            return -1;
        }
        else if(b.isTop) {
            return 1;
        }
        else {
            return order * CompareDate(a.date, b.date);
        }
    });
    // 取出index
    let indexArray = new Array();
    for(let i = 0; i < dateArray.length; i++) {
        indexArray.push(dateArray[i].index);
    }
    return indexArray;
}

(() => {

    $('.articles_content_ending').html('正在读取，请稍等…');

    let xhr = new XMLHttpRequest();
    xhr.open("GET", `./markdown/-articles.md`);
    xhr.onreadystatechange = () => {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            $("#progressbar").animate({width: `100%`});
            $("#progressbar").fadeOut();
            let CONTENTS = ParseArticleList(xhr.responseText);

            //////////////////////////////////////////////////
            //
            // 默认排序规则（ date-dec category ）
            //
            let defaultRule = 'category';
            //
            //////////////////////////////////////////////////

            RenderArticleList(CONTENTS, defaultRule);
            document.getElementById(defaultRule).classList.add('articles_sort_option_button_selected');
            // 排序按钮动作
            document.getElementById('date-dec').addEventListener('click', ()=>{
                document.getElementById('date-dec').classList.add('articles_sort_option_button_selected');
                document.getElementById('category').classList.remove('articles_sort_option_button_selected');
                RenderArticleList(CONTENTS, 'date-dec');
            });
            document.getElementById('category').addEventListener('click', ()=>{
                document.getElementById('category').classList.add('articles_sort_option_button_selected');
                document.getElementById('date-dec').classList.remove('articles_sort_option_button_selected');
                RenderArticleList(CONTENTS, 'category');
            });

            $('.articles_content_ending').html('题图作者：silverwing (PixivID:24281303)');
        }
        else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200){
            $("#progressbar").animate({width: `100%`});
            $("#progressbar").fadeOut();
            $('.articles_content_ending').html('文章列表获取失败 >_<');
            return;
        }
    };
    xhr.onprogress = (event) => {
        const MAX_ARTICLE_LENGTH = 20000; // 最大字节数，用于近似计算加载进度
        let percentage = parseInt((event.loaded / MAX_ARTICLE_LENGTH) * 100);
        $("#Progressbar").animate({width: `${((percentage > 100) ? 100 : percentage)}%`});
    };
    xhr.send();

})();
