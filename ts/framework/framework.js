
//////////////////////////////////////////////////////
//
//  事件：Onready
//
//  使用方法：(() => { ...  ActionsOnReady();  ... })();
//
//////////////////////////////////////////////////////

function ActionsOnReady() {
    SetCopyrightYear();
}

//////////////////////////////////////////////////////
//
//  事件：Onresize
//
//  使用方法：window.onresize = () => { ...  ActionsOnResize();  ... }
//
//////////////////////////////////////////////////////

function ActionsOnResize() {
    
}

//////////////////////////////////////////////////////
//
//  事件：Onscroll
//
//  使用方法：window.onscroll = () => { ...  ActionsOnScroll();  ... }
//
//////////////////////////////////////////////////////

function ActionsOnScroll() {
    
}

//////////////////////////////////////////////////////
//
//  通 用 样 式 和 动 效
//
//////////////////////////////////////////////////////

// 设置版权年份
function SetCopyrightYear() {
    $(".CopyrightYear").each((i, e) => {
        $(e).html(String(new Date().getFullYear()));
    });
}

// 同类元素逐个滑落进入的效果
function SlideInOneByOne(
    className, // CSS类名（不带点）
    offsetTop, // 从顶部多高的位置滑落下来
    slideTime, // 滑落延时（默认800ms）
    delayTime, // 每个元素之间的等待延时（默认50ms）
    callback  // 结束后的回调函数
) {
    slideTime = slideTime || 800;
    delayTime = delayTime || 50;
    callback = callback || (() => {});
    let showTime = 0;
    $(`.${className}`).each((i,e) => {
        let originMarginTop = $(e).css("margin-top");
        $(e).css({"opacity": 0, "margin-top": `-${offsetTop}px`});
        setTimeout(() => {
            $(e).animate({"opacity": 1.0, "margin-top": originMarginTop}, slideTime);
        }, showTime);
        showTime += delayTime;
    });
    setTimeout(callback, showTime);
}

//////////////////////////////////////////////////////
//
//  SPA 相 关 逻 辑
//
//////////////////////////////////////////////////////

function SPA_RegisterButtons() {
    $('.SPA_BUTTON').off('click'); // 避免重复绑定
    $('.SPA_BUTTON').each(function(i,e) {
        $(e).click(()=>{
            let targetid = $(e).attr('data-target');
            history.pushState({PageID: targetid}, '', `#/${targetid}`);
            SPA_Render(targetid);
        });
    });
}

//////////////////////////////////////////////////////
//
//  工 具 函 数
//
//////////////////////////////////////////////////////

// 终端类型判断："Desktop" or "Mobile"
function GetMediaType() {
    return ($(window).width() >= 650) ? "Desktop" : "Mobile";
}

// 解析请求参数，并返回字典
function GetRequestArgs() {
    let reqArg = new Object();
    let reqArgStr = window.document.location.href.match(/\?.*$/gi);
    if(reqArgStr !== null) {
        let fields = reqArgStr[0].substring(1).split('&');
        for(let field of fields) {
            field = field.replace(/\#.*$/i, ''); // 忽略井号后面的任何字符
            let pair = field.split('=');
            reqArg[decodeURI(pair[0])] = pair[1] ? decodeURI(pair[1]): null;
        }
    }
    return reqArg;
}
