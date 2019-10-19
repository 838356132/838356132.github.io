// 依赖的全局变量：SORTING_OPTION

function ParseArticleList(articleList) {
    // 标题→文件名
    function TitleToFilename(title) {
        return title.replace(/\s+/gi, "-");
    }
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
            let title = fields[0] ? fields[0].trim() : "";
            let date  = fields[1] ? fields[1].trim() : "";
            let type  = fields[2] ? fields[2].trim() : "";
            let tag  = fields[3] ? fields[3].trim() : "";
            ARTICLES.push({
                "title": title,
                "link": `blog/${TitleToFilename(title)}`,
                "date": date,
                "type": type,
                "category": currentCategory,
                "tag": tag
            });
        }
    }
    let contents = {
        "CATEGORIES": CATEGORIES,
        "ARTICLES": ARTICLES
    };

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
    sortOption = sortOption || "category";
    const FillZero = (num) => { return ('000000' + num.toString()).substr(-2); };
    // 按类别归类
    if(sortOption === 'category') {
        // 每一类生成一组html，然后拼接起来
        let html = new Array(CONTENTS.CATEGORIES.length);
        for(let i = 0; i < CONTENTS.CATEGORIES.length; i++) { html[i] = ''; }
        for(let i = 0; i < CONTENTS.ARTICLES.length; i++) {
            let item = CONTENTS.ARTICLES[i];
            let tagSpan = (item.tag.length > 0) ? ('<span class="ListItemTag">' + item.tag + '</span>') : '';
            // 先组装HTML
            let itemNumberBgColor = (item.tag === "置顶") ? GetTypeColor('置顶') : GetTypeColor(item.type);
            let itemTypeTag = item.type;
            let htmlstr = `<div class="ListItem enter"><span class="ListItemNumber" style="color:${itemNumberBgColor};border-color:${itemNumberBgColor};">${FillZero(i+1)}</span><span style="display:inline-block;max-width:50%;"><a class="ListItemLink SPA_TRIGGER" data-target="${item.link}">${item.title}</a>${tagSpan}</span><span class="ListItemDate"><span style="color:${itemNumberBgColor};">${itemTypeTag}</span> · ${item.date}</span></div>`;

            html[item.category] += htmlstr;
        }
        let listHtml = '';
        for(let i = 0; i < CONTENTS.CATEGORIES.length; i++) {
            let title = CONTENTS.CATEGORIES[i].split('|')[0];
            let subtitle = CONTENTS.CATEGORIES[i].split('|')[1];
            listHtml += `<div class="ListCategoryBlock" id="c${i}"><div class="ListCategoryBlockTitle enter">${title}<span class="ListCategoryBlockTitle_en"> · ${subtitle}</span></div>`;
            listHtml += html[i];
            listHtml += '</div>';
        }
        document.getElementById('ListContainer').innerHTML = listHtml;
    }
    // 按日期降序
    else if(sortOption === 'date-dec') {
        let html = '<div class="ListCategoryBlock" id="date-dec">';
        let indexArray = SortByDate(CONTENTS, 1);
        for(let i = 0; i < indexArray.length; i++) {
            let item = CONTENTS.ARTICLES[indexArray[i]];
            let tagSpan = (item.tag.length > 0) ? ('<span class="ListItemTag">' + item.tag + '</span>') : '';
            let itemNumberBgColor = (item.tag === "置顶") ? GetTypeColor('置顶') : GetTypeColor(item.type);
            let itemTypeTag = item.type;
            html += `<div class="ListItem enter"><span class="ListItemNumber" style="color:${itemNumberBgColor};border-color:${itemNumberBgColor};">${FillZero(i+1)}</span><span style="display:inline-block;max-width:50%;"><a class="ListItemLink SPA_TRIGGER" data-target="${item.link}">${item.title}</a>${tagSpan}</span><span class="ListItemDate"><span style="color:${itemNumberBgColor};">${itemTypeTag}</span> · ${item.date}</span></div>`;
        }
        html += `</div>`;
        document.getElementById('ListContainer').innerHTML = html;
    }
    // 默认顺序
    else {
        let html = '<div class="ListCategoryBlock" id="date-dec"><table class="category_item_table">';
        for(let i = 0; i < CONTENTS.ARTICLES.length; i++) {
            let item = CONTENTS.ARTICLES[i];
            let tagSpan = (item.tag.length > 0) ? ('<span class="tag">' + item.tag + '</span>') : '';
            html += `<tr class="ListItem enter"><td><span class="ListItemNumber" style="background-color:${GetTypeColor(item.type)};">${FillZero(i+1)}</span><a class="ListItemLink SPA_TRIGGER" data-target="${item.link}">${item.title}</a>${tagSpan}<span class="article_date"><span style="color:${GetTypeColor(item.type)};">${item.type}</span> | ${item.date}</span></td></tr>`;
        }
        html += `</table></div>`;
        document.getElementById('ListContainer').innerHTML = html;
    }

    // 淡入动画
    SlideInOneByOne("enter", 0, 700, 1);
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
            isTop: (CONTENTS.ARTICLES[i].tag === "置顶"),
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
    // 初始化文章列表监听器
    BLOG_LIST_OBSERVER = new MutationObserver((mutations, observer) => {
        console.log(`[PA-SPA] 监听器：博客文章列表已更新`);
        SPA_RegisterTriggers();
    });
    BLOG_LIST_OBSERVER.observe(document.getElementById('ListContainer'), {characterData: true, childList: true, subtree: true});

    $('.articles_content_ending').html('正在读取，请稍等…');

    let xhr = new XMLHttpRequest();
    xhr.open("GET", `./markdown/blog/-articles.md`);
    xhr.onreadystatechange = () => {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            $("#Progressbar").animate({width: `100%`});
            $("#Progressbar").fadeOut();
            let CONTENTS = ParseArticleList(xhr.responseText);

            RenderArticleList(CONTENTS, SORTING_OPTION);

            // 排序选项按钮
            $(`.ListSortingOption[data-sorting-option=${SORTING_OPTION}]`).addClass('ListSortingOptionSelected');
            $(`.ListSortingOption`).each((i, e) => {
                $(e).click(() => {
                    let sortingOption = $(e).attr("data-sorting-option");
                    $(".ListSortingOption").removeClass("ListSortingOptionSelected");
                    $(e).addClass("ListSortingOptionSelected");
                    RenderArticleList(CONTENTS, sortingOption);
                    SORTING_OPTION = sortingOption;
                });
            });
        }
        else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200){
            $("#Progressbar").animate({width: `100%`});
            $("#Progressbar").fadeOut();
            $('.ListEnding').html('文章列表获取失败 >_<');
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
