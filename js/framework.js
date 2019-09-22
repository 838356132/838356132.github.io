// Project Aurora 博客框架
function PA_Init() {
    // 主机名
    const hostname = 'https://mikukonai.coding.me';

    // 获取绝对路径
    const URLExpand = function(url) {
        return (url.replace('%hostname%', hostname));
    };
    // 获取文件名
    const getFileName = function(url) {
        return url.match(/\/[^/]*$/gi)[0].substring(1);
    };

    // 公共元素控制
    // window.onload = function() {
        // 资源
        // let resources = new RESOURCES();
        // 版权年份
        if(document.getElementById('copyright_year') !== null) {
            document.getElementById('copyright_year').innerHTML = new Date().getFullYear();
        }
        let years = document.getElementsByClassName('copyright_year');
        for(let i = 0; i < years.length; i++) {
            years[i].innerHTML = new Date().getFullYear();
        }
        /*
        // 当前文件名
        let filename = getFileName(window.location.href);
        // 控制标题背景图片
        const setTitleBg = function(imgid) {
            document.getElementsByClassName('top_title')[0].style.backgroundImage = `url(${resources.getImageURL(imgid)})`;
        };
        if(filename === 'index.html' || filename === '') {
            setTitleBg(1);
            document.getElementsByTagName('body')[0].style.backgroundImage = `url(${resources.getImageURL(0)})`;
        }
        else if(filename === 'inspiration.html') {
            setTitleBg(2);
        }
        else if(filename === 'category.html') {
            setTitleBg(3);
        }
        else if(filename === 'links.html') {
            setTitleBg(4);
        }
        else if(filename === 'about.html') {
            setTitleBg(5);
        }
        */
    // };
}

// 内容生成后的样式设置
function PA_Rerender() {
/*
    // 为链接添加切换动效
    if($(window).width() >= 650) {
        $('a').each(function(i,e) {
            // 不是所有链接都有切换动效
            if($(e).attr('target') !== '_blank' && /(^(http|ftp|\.))|(\.\/)/gi.test($(e).attr('href'))) {
                $(e).click(function() {
                    $('#mask').fadeIn(300);
                    $('#loading').fadeIn(300);
                    setTimeout(()=>{
                        window.location.href = $(e).attr('href');
                    }, 500);
                    return false;
                });
            }
        });
    }
    // 切换动效点击消失
    $('#mask').click(function() {
        $('#mask').fadeOut(200);
        $('#loading').fadeOut(200);
    });
*/
}
