
///////////////////////////////////////////////////////
//
//  全 局 状 态 和 常 量
//
///////////////////////////////////////////////////////

// 淡入淡出动效持续时间
const DURATION = 500;
// 默认封面图片
const DEFAULT_COVER = `http://wx4.sinaimg.cn/large/450be1f5gy1g5zjkmhigoj20vy0ht76f.jpg`;

// 滚动状态 NOTE 设置此状态位的目的是为了防止图片懒加载在滚动时被触发，导致滚动目标的位置计算错误。
let IS_SCROLLING = false;

///////////////////////////////////////////////////////
//
//  Scroll 触 发 事 件
//
///////////////////////////////////////////////////////

// 图片懒加载
function ImageLazyLoading() {
    let top = document.documentElement.scrollTop || document.body.scrollTop;
    let clientHeight = document.documentElement.clientHeight;
    $('.MikumarkImage').each(function(i,e) {
        let offsetTop = $(e).offset().top;
        if($(e).attr('src') === undefined) {
            if(offsetTop >= top && offsetTop <= top + clientHeight) {
                console.log(`[PA-SPA] 图片懒加载：${$(e).attr('data-src')}`);
                $(e).attr('src', $(e).attr('data-src'));
                e.onload = ()=>{
                    $(e).parent().children('.loading').fadeOut(500);
                };
            }
        }
    });
}

// 追踪当前标题
function TraceCurrentTitle() {
    // 遍历所有Title，根据当前滚动位置，计算当前所在的章节标题
    function GetVisibleTitle() {
        let titleDOMs = $(".MikumarkTitle");
        let currentTop = window.pageYOffset + 42;
        for(let i = 0; i < titleDOMs.length - 1; i++) {
            let currentTitleTop = window.pageYOffset + titleDOMs[i].getBoundingClientRect().top;
            let nextTitleTop = window.pageYOffset + titleDOMs[i+1].getBoundingClientRect().top;
            if(currentTop > currentTitleTop && currentTop < nextTitleTop) {
                return titleDOMs[i].id;
            }
        }
        return "ContentsItem_0";
    }
    let visibleTitleId = GetVisibleTitle().split("_")[1];;
    $(`.ContentsItem`).removeClass("ContentsItemActive");
    $(`#ContentsItem_${visibleTitleId}`).addClass("ContentsItemActive");
}

// 仅移动端：控制StickyTitle和GoTop按钮的显示
function ShowTopTitleOnThreshold() {
    let top = document.documentElement.scrollTop || document.body.scrollTop;
    if(GetMediaType() === "Desktop") {
        $('.StickyTitleContainer').hide();
        $('#GoTopButton').show();
    }
    else if(GetMediaType() === "Mobile") {
        $('#GoTopButton').hide();
        if(top > 280) {
            $('.StickyTitleContainer').fadeIn(300);
        }
        else {
            $('.StickyTitleContainer').fadeOut(300);
        }
    }
}

///////////////////////////////////////////////////////
//
//  Resize 触 发 事 件
//
///////////////////////////////////////////////////////


///////////////////////////////////////////////////////
//
//  其 他 触 发 事 件
//
///////////////////////////////////////////////////////

// 菜单折叠状态切换
function MenuToggle() {
    let state = $("#MenuButton").attr("data-state");
    if(state === "on") {
        $("#MenuButton").attr("data-state", "off");
        $("#MenuButton").html("menu");
        if(GetMediaType() === "Desktop") {
            $("#MenuContainer").animate({width: "40px", height: "40px"}, 200, "easeOutExpo");
        }
        else if(GetMediaType() === "Mobile") {
            $("#MenuContainer").animate({width: "40px", height: "40px"}, 200, "easeOutExpo", ()=> {
                $("#MenuContainer").css("background", "transparent");
            });
        }
    }
    else if(state === "off") {
        $("#MenuButton").attr("data-state", "on");
        $("#MenuButton").html("close");
        if(GetMediaType() === "Desktop") {
            $("#MenuContainer").css("border-radius", "20px");
            $("#MenuContainer").animate({width: "400px", height: "600px"}, 200, "easeOutExpo");
        }
        else if(GetMediaType() === "Mobile") {
            $("#MenuContainer").css("background-color", "#ffffff");
            $("#MenuContainer").animate({width: $(window).width(), height: "100%"}, 200, "easeOutExpo");
        }
    }
}

///////////////////////////////////////////////////////
//
//  文 章 渲 染 前 后 执 行 的 操 作
//
///////////////////////////////////////////////////////

// 在文章渲染之前执行的操作
function BeforeRendering() {
    $('#MenuButton').off('click'); // 避免重复绑定
    $("#MenuButton").click(() => { MenuToggle(); }); // 菜单按钮的点击事件
    ArrangeSideButtonLayout(); // 设置按钮布局
    ShowTopTitleOnThreshold(); // 设置顶部标题栏状态

    // 删除所有已有的MikumarkScript和MikumarkStyle节点
    $(".MikumarkScript").remove();
    $(".MikumarkStyle").remove();

    ActionsOnResize();
    ActionsOnScroll();
}

// 在文章渲染完成之后执行的操作
function AfterRendering() {
    // 为每张图片注册单击事件
    $('.MikumarkImage').each(function(i,e) {
        $(e).click(function() {
            window.open($(e).attr('src'), "_blank");
        });
    });

    window.onresize = () => {
        ArrangeSideButtonLayout();
        ActionsOnResize();
    };

    window.onscroll = () => {
        if(IS_SCROLLING !== true) { // 见IS_SCROLLING定义处注释
            ImageLazyLoading();
            TraceCurrentTitle();
        }
        ShowTopTitleOnThreshold();
        ActionsOnScroll();
    };

    // MathJax刷新
    MathJax.Hub.Configured();
    MathJax.Hub.Queue(["Typeset", MathJax.Hub]);

    // 各触发一次以刷新布局
    setTimeout(() => {
        $(window).scroll();
        $(window).resize();
    }, 10);
}

///////////////////////////////////////////////////////
//
//  文 章 和 目 录 渲 染
//
///////////////////////////////////////////////////////

// 渲染文章正文
function Render(mikumark) {
    // 标题
    document.getElementsByTagName("title")[0].innerHTML = `${mikumark.title} / Project Aurora`;
    $('#StickyTitle').html(mikumark.title);
    $('#Title').css('opacity', '0');
    $('#Title').html(mikumark.title);
    $('#Title').animate({'opacity':1.0}, DURATION);

    // 封面
    if(mikumark.cover.length > 0) {
        $('.Header').css('background-image', `url('${mikumark.cover}')`);
    }
    else {
        $('.Header').css('background-image', `url('${DEFAULT_COVER}')`);
    }

    // 日期
    $('#MikumarkMetadataDate').css('opacity', '0');
    $('#MikumarkMetadataDate').html(mikumark.date.replace(/\-/,"年").replace(/\-/,"月") + '日');
    $('#MikumarkMetadataDate').animate({'opacity':1.0}, DURATION);

    // 作者
    $('#MikumarkMetadataAuthors').css('opacity', '0');
    $('#MikumarkMetadataAuthors').html(`作者：${mikumark.authors}`);
    $('#MikumarkMetadataAuthors').animate({'opacity':1.0}, DURATION);

    // 文章正文
    $("#MikumarkContainer").html(mikumark.HTML);


    // 脚本节点
    for(let scriptSrc of mikumark.linkedScripts) {
        let scriptNode = document.createElement("script");
        scriptNode.src = scriptSrc;
        scriptNode.setAttribute("class", "MikumarkScript");
        scriptNode.async = "async";
        $('head').append(scriptNode);
    }

    let scriptNode = document.createElement("script");
    scriptNode.innerHTML = mikumark.script;
    scriptNode.setAttribute("class", "MikumarkScript");
    scriptNode.defer = "defer";
    $('body').append(scriptNode);


    // 样式节点
    let styleNode = document.createElement("style");
    styleNode.setAttribute("class", "MikumarkStyle");
    styleNode.innerHTML = mikumark.style;
    $('head').append(styleNode);

    for(let styleSrc of mikumark.linkedStyles) {
        let linkStyleNode = document.createElement("link");
        linkStyleNode.setAttribute("rel", "stylesheet");
        linkStyleNode.setAttribute("type", "text/css");
        linkStyleNode.setAttribute("charset", "utf-8");
        linkStyleNode.setAttribute("href", styleSrc);
        linkStyleNode.setAttribute("class", "MikumarkStyle");
        $('head').append(linkStyleNode);
    }

    // 绘制目录
    RenderTOC(mikumark);

    // 使用highlight.js处理代码高亮
    document.querySelectorAll('pre code').forEach((block) => { hljs.highlightBlock(block); });

}

// 渲染文章目录，并为每个按钮注册点击跳转事件
function RenderTOC(mikumark) {
    let outline = mikumark.outline;
    let HtmlBuffer = new Array();
    HtmlBuffer.push(`<ul class="ContentsList">`);

    // 保证标签匹配的栈
    let stack = new Array();
    stack.push('{'); // 已经有一个ul了

    for(let i = 0; i < outline.length; i++) {
        let thisLevel = outline[i].level + 1;
        let nextLevel = (outline[i+1] === undefined) ? 2 : (outline[i+1].level + 1)
        let thisTitle = outline[i].title;
        // 缩进
        if(thisLevel < nextLevel) {
            HtmlBuffer.push(`<li><span data-title-id="${i}" id="ContentsItem_${i}" class="ContentsItem">${thisTitle}</span>`);
            stack.push('(');
            for(let c = 0; c < nextLevel - thisLevel; c++) {
                HtmlBuffer.push(`<ul class="ContentsListItem">`);
                stack.push('{');
            }
        }
        // 退出缩进
        else if(thisLevel > nextLevel) {
            HtmlBuffer.push(`<li><span data-title-id="${i}" id="ContentsItem_${i}" class="ContentsItem">${thisTitle}</span>`);
            stack.push('(');
            let count = thisLevel - nextLevel;
            while(count >= 0) {
                if(stack[stack.length-1] === '(') {
                    stack.pop();
                    HtmlBuffer.push(`</li>`);
                }
                else if(stack[stack.length-1] === '{') {
                    if(count > 0) {
                        stack.pop();
                        HtmlBuffer.push(`</ul>`);
                    }
                    count--;
                }
            }
        }
        // 平级
        else {
            HtmlBuffer.push(`<li><span data-title-id="${i}" id="ContentsItem_${i}" class="ContentsItem">${thisTitle}</span></li>`);
        }
    }
    HtmlBuffer.push('</ul>');

    $("#ContentsContainer").html(HtmlBuffer.join(""));

    // 注册目录标题的点击跳转事件
    // 跳转到某个标题
    function TurnTo(titleID) {
        let targetTop = window.pageYOffset + $(`#Title_${titleID}`)[0].getBoundingClientRect().top;
        $('html, body').animate({ scrollTop: targetTop-40 }, 200, 'easeOutExpo', () => {
            IS_SCROLLING = false;
            $(window).scroll(); // 保证触发目录刷新
        }); // 照顾顶部sticky导航栏的40px高度
    }
    $(".ContentsItem").each((i, e) => {
        $(e).click((event) => {
            let posterId = $(e).attr("data-title-id");
            IS_SCROLLING = true;
            TurnTo(posterId);
            MenuToggle();
            event.stopPropagation(); // 阻止冒泡
        });
    });
}

///////////////////////////////////////////////////////
//
//  解 析 请 求 参 数， 请 求 文 章 内 容
//
///////////////////////////////////////////////////////

// 根据文章ID载入文章并完成渲染工作
function LoadArticle(id) {
    BeforeRendering();
    let xhr = new XMLHttpRequest();
    xhr.open("GET", `./markdown/blog/${id}.md`);
    xhr.onreadystatechange = () => {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            let text = xhr.responseText;
            // 进度条读满
            $("#Progressbar").animate({width: `100%`});
            $("#Progressbar").fadeOut();

            // Markdown解析并渲染
            let mikumark = new Mikumark(text);
            console.log(`[PA-SPA] Mikumark：文档解析完毕`);
            Render(mikumark);
        }
        else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200){
            $("#Progressbar").animate({width: `100%`});
            $("#Progressbar").fadeOut();
            alert(`文章载入失败。HTTP状态：${xhr.status} ${xhr.statusText}`);
            return;
        }
    };
    xhr.onprogress = (event) => {
        const MAX_ARTICLE_LENGTH = 64000; // 最大的文章字节数，用于近似计算加载进度
        let percentage = parseInt((event.loaded / MAX_ARTICLE_LENGTH) * 100);
        $("#Progressbar").animate({width: `${((percentage > 100) ? 100 : percentage)}%`});
    };
    xhr.send();
}
