
function LoadInspirations() {

    let posters, html;

    // 跳转到某个Poster
    function TurnTo(elementId) {
        let targetTop = window.pageYOffset + $(`#${elementId}`)[0].getBoundingClientRect().top;
        $('html, body').animate({ scrollTop: targetTop-40 }, 200, 'easeOutExpo'); // 照顾顶部sticky导航栏的40px高度
    }

    // 遍历所有Poster，根据当前滚动位置，计算当前显示的Poster是哪个
    function GetVisiblePoster() {
        let posterDOMs = $(".poster");
        let currentTop = window.pageYOffset + 42;
        for(let i = 0; i < posterDOMs.length - 1; i++) {
            let currentPosterTop = window.pageYOffset + posterDOMs[i].getBoundingClientRect().top;
            let nextPosterTop = window.pageYOffset + posterDOMs[i+1].getBoundingClientRect().top;
            if(currentTop > currentPosterTop && currentTop < nextPosterTop) {
                return posterDOMs[i].id;
            }
        }
        return undefined;
    }

    // 针对标签作倒排索引
    function Indexer(posters) {
        let InverseIndex = new Object();
        for(let i = 0; i < posters.length; i++) {
            let tags = posters[i].tags;
            for(let j = 0; j < tags.length; j++) {
                if(tags[j] in InverseIndex) {
                    InverseIndex[tags[j]].push(i);
                }
                else {
                    InverseIndex[tags[j]] = [i];
                }
            }
        }
        return InverseIndex;
    }

    // 导航栏状态切换
    function NavboxToggle() {
        if($("#InspirationMenu").css("margin-left") !== "0px") {
            $("#InspirationMenu").animate({"margin-left": "0px", opacity: "1"}, 500, "easeOutExpo");
        }
        else {
            $("#InspirationMenu").animate({"margin-left": "-360px", opacity: "0"}, 500, "easeOutExpo");
        }
    }

    // 绘制所有Posters
    function PaintPosters() {
        $('#InspirationContainer').html(html);

        SlideInOneByOne("Poster", 10, 800, 20, () => {
            $('.InspirationEnding').html('不可说者，皆应沉默');
            // console.table(posters);
        });
    }

    // 绘制目录
    function PaintNavbox(posterIndexes, currentTag) {
        currentTag = currentTag || "";
        // 绘制左侧目录
        let navHtml = new Array();
        for(let i = 0; i < posterIndexes.length; i++) {
            let posterIndex = posterIndexes[i];
            let prevPosterIndex = posterIndexes[i-1];
            let inspiration = posters[posterIndex];
            let thisYear = inspiration.date.split("-")[0];
            if(i === 0 || (prevPosterIndex >= 0 && thisYear !== posters[prevPosterIndex].date.split("-")[0])) {
                if(isNaN(parseInt(thisYear))) {
                    navHtml.push(`<div class="InspirationMenuItemHrline"><span style="position: absolute; top: -8px; margin-left: 30px; padding: 0 4px; background-color: #fff;">${thisYear}</span></div>`);
                }
                else {
                    navHtml.push(`<div class="InspirationMenuItemHrline"><span style="position: absolute; top: -8px; margin-left: 30px; padding: 0 4px; background-color: #fff;">${thisYear}年</span></div>`);
                }
            }
            navHtml.push(`<div class="InspirationMenuItem" data-poster-id="Poster_${inspiration.id}" id="TurnTo_Poster_${inspiration.id}">${inspiration.title}</div>`);
        }
        $("#InspirationMenuList").html(navHtml.join(""));

        // 绘制标签
        let tagHtml = new Array();
        // 首先添加一个清除选择按钮
        tagHtml.push(`<span class="InspirationMenuTagItem InspirationMenuTagItem_clear" data-tag="">全部</span>`);
        let invIndex = Indexer(posters);
        for(let tag in invIndex) {
            let activeCSS = "";
            if(currentTag === tag) {
                activeCSS = " InspirationMenuTagItem_active";
            }
            tagHtml.push(`<span class="InspirationMenuTagItem${activeCSS}" data-tag="${tag}">${tag} (${invIndex[tag].length})</span>`);
        }
        $("#InspirationMenuTags").html(tagHtml.join(""));

        // 注册目录标题的点击跳转事件
        $(".InspirationMenuItem").each((i, e) => {
            $(e).click(() => {
                let posterId = $(e).attr("data-poster-id");
                TurnTo(posterId);
                if(GetMediaType() === "Mobile") {
                    NavboxToggle();
                }
            });
        });

        // 注册标签的点击事件
        $(".InspirationMenuTagItem").each((i, e) => {
            $(e).click(() => {
                let tag = $(e).attr("data-tag");
                let indexes = Indexer(posters);
                if(tag !== "") {
                    PaintNavbox(indexes[tag], tag);
                }
                else {
                    PaintNavbox(Array.from(posters.keys()));
                }
            });
        });

    }


    function Paint() {
        PaintPosters();
        PaintNavbox(Array.from(posters.keys()));
    }


    $('.InspirationEnding').html('正在读取，请稍等…');

    let xhr = new XMLHttpRequest();
    xhr.open("GET", `./markdown/-inspirations.md`);
    xhr.onreadystatechange = () => {
        if(xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
            $("#Progressbar").animate({width: `100%`});
            $("#Progressbar").fadeOut();

            // 解析
            posters = ParsePosters(xhr.responseText);
            html = RenderPosters(posters);

            Paint();
        }
        else if(xhr.readyState === XMLHttpRequest.DONE && xhr.status !== 200){
            $("#Progressbar").animate({width: `100%`});
            $("#Progressbar").fadeOut();
            $('.InspirationEnding').html('灵感不见了 >_<');
            return;
        }
    };
    xhr.onprogress = (event) => {
        const MAX_ARTICLE_LENGTH = 64000; // 最大字节数，用于近似计算加载进度
        let percentage = parseInt((event.loaded / MAX_ARTICLE_LENGTH) * 100);
        $("#Progressbar").animate({width: `${((percentage > 100) ? 100 : percentage)}%`});
    };
    xhr.send();


    window.onresize = () => {
        // Desktop
        if(GetMediaType() === "Desktop") {
            $(".InspirationMenuToggle").show();
            $(".InspirationMenu").show();
        }
        else if(GetMediaType() === "Mobile"){
            $("#InspirationMenu").css("margin-left", "-360px");
        }
    };

    // 指示滚动位置
    window.onscroll = () => {
        let visiblePosterId = GetVisiblePoster();
        $(`.InspirationMenuItem`).removeClass("InspirationMenuItem_active");
        $(`#TurnTo_${visiblePosterId}`).addClass("InspirationMenuItem_active");
    };

    $(window).resize();

    // 导航栏折叠按钮
    $("#InspirationMenuToggle").click(()=>{ NavboxToggle(); });

}
