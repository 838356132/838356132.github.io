;

// Project Aurora
// “灵感”页解析-渲染

function InspirationParser(inspirations) {
    this.inspirations = inspirations;
    const defaultAvatarURI = "./image/haruhi-avatar.jpg";

    var fieldName = ['avatar_url','title','time','image_url','content'];
    this.posterBuffer = [];

    function ContentParser(content) {
        let html = '';
        // 分段
        content.split(/\n{2,}/).forEach(function(paragraph, index) {
            html += '<p class="poster-p">';
            // 分行
            paragraph.split(/\n{1}/).forEach(function(line, index, lines) {
                // 处理话题标签
                line.split(/#{1}/).forEach(function(slice, index, slices) {
                    // 偶数段为标签外文本
                    if(index % 2 == 0 || slices.length-1 == index) {
                        // 处理超链接
                        slice.split(/\[/).forEach(function(link_remain, index, remains) {
                            // 取首次（当然不支持嵌套括号）出现的右括号位置下标
                            let right_bracket = link_remain.search(/\]/);
                            // 没有左括号，视为没有链接
                            if(remains.length == 1) {
                                html += link_remain;
                            }
                            // 如果没有发现右括号，说明是链接前的部分，原样输出
                            else if(right_bracket < 0) {
                                html += link_remain;
                            }
                            else {
                                let urlstr = '';
                                let hasurl = false;
                                // 检查是否有链接字段
                                if(/\]\(.*\)/.test(link_remain)) {
                                    hasurl = true;
                                    urlstr = link_remain.match(/\]\(.*\)/g)[0]; // 最大匹配范围，因而不可嵌套或并列
                                    urlstr = urlstr.substring(2, urlstr.length-1);
                                }
                                
                                let link = link_remain.substring(0,right_bracket);
                                if(urlstr != '') {
                                    html += '<a href="' + urlstr + '">' + link + '</a>';
                                }
                                else {
                                    html += '<a href="' + link + '">' + link + '</a>';
                                }
                                let remnent = link_remain.substring(right_bracket+1);
                                if(hasurl == true) {
                                    let r_index = remnent.search(/\)[^\)]*$/);
                                    remnent = remnent.substring(r_index + 1);
                                }
                                html += remnent;
                            }
                        });
                    }
                    // 标签内文本套上a输出
                    else {
                        html += ' <a class="topic-tag" href="javascript:topic();">#';
                        html += slice;
                        html += '#</a> ';
                    }
                });
                if(!(lines.length == 1 || index == lines.length-1)) {
                    html += '<br/>';
                }
            });
            html += '</p>';
        });
        return html;
    }

    this.Parser = function() {
        // 预处理：转义字符替换
        let inspirations = this.inspirations
        .replace(/\\(?!\\)[#]/g, '@S^').replace(/\\(?!\\)[\[]/g, '@L^')
        .replace(/\\(?!\\)[\]]/g, '@R^').replace(/\\(?!\\)[\(]/g, '@A^')
        .replace(/\\(?!\\)[\)]/g, '@B^').replace(/\\(?!\\)[;]/g, '@C^');

        let posters = inspirations.split(/\n+={5,}\n+/);
        let inspirationsHTML = new Array();

        for(let index = 0; index < posters.length; index++) {
            let poster = posters[index];
            let posterObject = new Object;

            let pid = 'MikuPoster' + index;
            posterObject.pid = index;

            let image_url = '';
            let fields = poster.split(/;\n+/);

            let html = '';

            // 头像
            html += '<img src="';
            html += defaultAvatarURI;//field;
            html +='" class="poster-avatar">';

            fields.forEach(function(field, index) {
                posterObject[fieldName[index]] = field;
                // 标题
                if(index === 0) {
                    html += '<div class="poster-header">';
                    html += field;
                    html += '</div>';
                }
                // 日期（或者副标题）
                else if(index === 1) {
                    html += '<div class="poster-meta">';
                    html += field;
                    html += '</div>';
                }
                // 图像URL
                else if(index === 2) {
                    image_url = field;
                }
                // 正文
                else if(index === 3) {
                    let content_parsed = ContentParser(field);
                    // 2018.4.22 正文超过400字符即折叠，避免时间线过长
                    if(field.length > 400) {
                        html += ('<div id="pst_' + pid + '" style="height:100px;overflow: hidden; margin-top: -8px;">' + content_parsed + '</div><div id="mask_' + pid + '" style="margin-top: -120px; padding: 120px 0 10px 0; position: relative; height:20px; background: linear-gradient(0deg, rgba(255,255,255,1.0),rgba(255,255,255,0.0)); text-align: center; line-height: 20px; font-weight: bold; color: #b395f0; font-size: 15px;" onclick="$(\'#pst_' + pid + '\').css(\'height\', \'100%\');$(\'#mask_' + pid + '\').css(\'display\', \'none\');">▼ 展 开 全 文</div>');
                    }
                    else {
                        html += content_parsed;
                    }
                }
            });
            if(image_url != '') {
                html += '<p class="poster-p"><a href="' + image_url + '"><img id="IMG_' + index + '" src="' + image_url + '" style="max-width:80%;max-height:300px;" class="poster-attachment"></a></p>';
            }

            html = html
            .replace(/@S\^/g, '#').replace(/@L\^/g, '[')
            .replace(/@R\^/g, ']').replace(/@A\^/g, '(')
            .replace(/@B\^/g, ')').replace(/@C\^/g, ';');

            html = '<h1 id="p_anchor_' + pid + '" class="p_anchor" style="display:none;">' + posterObject.title + '</h1><div id="' + pid + '" class="poster">' + html + '</div>';
            inspirationsHTML.push(html);
            this.posterBuffer[index] = posterObject;
        }
        
        return {
            html: inspirationsHTML.join('\n'),
            inspirations: this.posterBuffer,
        };
    }

    this.Render = function() {
        let res = this.Parser(inspirations);
        let html = res.html;
        $('#poster_anchor').after(html);
        // 2018.07.28 进场动画
        let showTime = 0;
        $(".poster").each(function(i,e) {
            setTimeout(function() {
                // console.log($(e).attr('id'));
                $(e).animate({'opacity':1.0,'margin-top':'0px'}, 800);
            }, showTime);
            showTime += 200;
        });
        setTimeout(function() {
            $('.content-ending').html('不可说者，皆应沉默');
        }, showTime);
        console.table(res.inspirations);
    }

    return this;
}

if(typeof(window) === "undefined") {
    module.exports.InspirationParser = InspirationParser;
}
