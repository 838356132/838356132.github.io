function insertChar(code, beforeIndex, character) {
    if(beforeIndex < 0 || beforeIndex > code.length) {
        return code;
    }
    let newCode = code.substring(0, beforeIndex);
    newCode += character.toString();
    newCode += code.substring(beforeIndex);
    return newCode;
}
function deleteChar(code, index) {
    if(index < 0 || index > code.length) {
        return code;
    }
    let newCode = code.substring(0, index);
    newCode += code.substring(index + 1);
    return newCode;
}

function setElementOffset(id, charIndex) {
    let charOffsetX = $('#char' + charIndex.toString()).offset().left;
    let charOffsetY = $('#char' + charIndex.toString()).offset().top;
    $('#' + id).css('left', charOffsetX + 'px');
    $('#' + id).css('top', charOffsetY + 'px');
}



window.onload = function() {

    // 每行前面行号区域的宽度，当鼠标点击此区域时，将光标置于当行第一个字符的左侧
    const lineNumberWidth = 70;


    this.setInterval(function() {
        console.warn(`光标位置：` + currentCharIndex);
    }, 1000);


    this.setInterval(function() {
        $('#cursor').toggle();
    }, 500);

    let code = `// C/C++
#include <iostream>
using namespace;

int main(int argc, char **argv)
{
    std::cout << "Hello MikuEditor!" << std::endl;
    return 0;
}

// JavaScript
console.log('Hello MikuEditor!');

// Scheme
(display "Hello MikuEditor!")

// Java
class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, MikuEditor!");
    }
}
`;

    
    // 某行对应的最后一个字符的index
    let lineLastCharIndex = new Array();
    // 记录当前光标位置(字符序号)
    let startCursorPosition = 0;
    let endCursorPosition = 0;
    // 选区光标位置
    let firstCursorCharIndex = 0;
    let secondCursorCharIndex = 0;

    // 当前光标位置
    let currentCharIndex = 0;

    // 鼠标按下状态
    let mouseStatus = 0;

    function render(code) {
        // 行号
        let lineNumber = 1;
        let html = '<div class="line" id="line0" linenumber="1"><div class="linenumber" id="linenumber0">1</div>';
        for(let i = 0; i < code.length; i++) {
            if(code[i] === '\n') {
                lineLastCharIndex[lineNumber] = i - 1;
                // console.log(`第${lineNumber}行最后一个字符的下标是${i-1}`);
                html += `<code id="char${i}" class="char crlf">↵</code></div><div class="line" id="line${lineNumber}" linenumber="${lineNumber+1}"><div class="linenumber"  id="linenumber${lineNumber}">${lineNumber+1}</div>`;
                lineNumber++;
            }
            else {
                html += `<code id="char${i}" class="char">${code[i]}</code>`;
            }
        }
        lineLastCharIndex[lineNumber] = code.length-1;
        lineNumber++;
        html += `<code id="char${code.length}" class="char crlf">.</code></div>`;
        document.getElementById('editor').innerHTML = html;
    
        // 计算每个字符的offsetX
        let charX = new Array();
        let charNodes = document.getElementById('editor').childNodes;
        for(let i = 0; i < charNodes.length; i++) {
            charX[i] = charNodes[i].offsetLeft;
            // console.log(charNodes[i].offsetLeft + ' / ' + charNodes[i].offsetWidth + ' / ' + charNodes[i].innerHTML);
            // console.log(charNodes[i]);
        }
    
        // 计算光标高度
        $('#cursor').css('height', $('.char').css('height'));
    }
    
    render(code);





    $('.char').each(function(i,e) {

        // 鼠标按下
        $(e).mousedown(function(event) {
            event.stopPropagation();
            console.log(event.button);
            // 鼠标实际点击点坐标
            let mouseX = event.clientX;
            // let mouseY = event.clientY;
            // 右键复制
            if(event.button === 2) {
                let currentCharIndex = parseInt($(e).attr('id').match(/\d+/gi)[0]);
                if(currentCharIndex > firstCursorCharIndex && currentCharIndex <= secondCursorCharIndex) {
                    alert(code.substring(firstCursorCharIndex+1, secondCursorCharIndex+1));
                }
                return;
            }
            mouseStatus = 1;


            // 高亮所在行
            let lineIndex = parseInt($(e).parent().attr('id').match(/\d+/gi)[0]);
            for(let i = 0; i <= lineLastCharIndex.length; i++) {
                if(i === lineIndex) {
                    $('#line' + i).addClass('line_active');
                }
                else {
                    $('#line' + i).removeClass('line_active');
                }
            }



            // 被点击字符的坐标
            let charX = $(e).offset().left;
            let nextCharX = charX + $(e)[0].offsetWidth;
            let charY = $(e).offset().top;
            // 判断点击位置
            if(mouseX <= charX + $(e)[0].offsetWidth / 2) {
                currentCharIndex = parseInt($(e).attr('id').match(/\d+/gi)[0]);
                $('#cursor').css('left', charX + 'px');
                startCursorPosition = parseInt($(e).attr('id').match(/\d+/gi)[0]) - 1;
            }
            else {
                currentCharIndex = parseInt($(e).attr('id').match(/\d+/gi)[0]) + 1;
                $('#cursor').css('left', nextCharX + 'px');
                startCursorPosition = parseInt($(e).attr('id').match(/\d+/gi)[0]);
            }
            $('#cursor').css('top', charY + 'px');
            // console.log('光标位置：' + mouseX + ' / ' + parseInt(charX) + ' / 字符序号: ' + startCursorPosition);
            // console.log('选区：' + $('#char' + startCursorPosition).html() + ' ~ ' + $('#char' + endCursorPosition).html());
        });


        // 鼠标放下
        $(e).mouseup(function(event) {
            event.stopPropagation();
            mouseStatus = 0;
            // 鼠标实际点击点坐标
            let mouseX = event.clientX;
            let mouseY = event.clientY;
            // 被点击字符的坐标
            let charX = $(e).offset().left;
            let nextCharX = charX + $(e)[0].offsetWidth;
            let charY = $(e).offset().top;
            // 判断点击位置
            if(mouseX <= charX + $(e)[0].offsetWidth / 2) {
                currentCharIndex = parseInt($(e).attr('id').match(/\d+/gi)[0]);
                $('#cursor').css('left', charX + 'px');
                endCursorPosition = parseInt($(e).attr('id').match(/\d+/gi)[0]) - 1;
            }
            else {
                currentCharIndex = parseInt($(e).attr('id').match(/\d+/gi)[0]) + 1;
                $('#cursor').css('left', nextCharX + 'px');
                endCursorPosition = parseInt($(e).attr('id').match(/\d+/gi)[0]);
            }
            $('#cursor').css('top', charY + 'px');
            // 将选区变色（倒着选也可以）
            firstCursorCharIndex = Math.min(startCursorPosition, endCursorPosition);
            secondCursorCharIndex = Math.max(startCursorPosition, endCursorPosition);
            
            for(let i = 0; i < code.length; i++) {
                if(i > firstCursorCharIndex && i <= secondCursorCharIndex) {
                    $('#char' + i).addClass('char_selected');
                }
                else {
                    $('#char' + i).removeClass('char_selected');
                }
            }
            // console.log('光标位置：' + mouseX + ' / ' + parseInt(charX) + ' / 字符序号: ' + startCursorPosition);
            console.log('选区：' + $('#char' + startCursorPosition).html() + ' ~ ' + $('#char' + endCursorPosition).html());
            // console.log($(e));
        });





        // 鼠标划过
        $(e).mouseover(function(event) {
            event.stopPropagation();
            // 只有鼠标按下时才有效
            if(mouseStatus != 1) {
                return;
            }
            // 鼠标实际点击点坐标
            let mouseX = event.clientX;
            let mouseY = event.clientY;
            // 被点击字符的坐标
            let charX = $(e).offset().left;
            let nextCharX = charX + $(e)[0].offsetWidth;
            let charY = $(e).offset().top;
            // 判断点击位置
            if(mouseX <= charX + $(e)[0].offsetWidth / 2) {
                currentCharIndex = parseInt($(e).attr('id').match(/\d+/gi)[0]);
                $('#cursor').css('left', charX + 'px');
                endCursorPosition = parseInt($(e).attr('id').match(/\d+/gi)[0]) - 1;
            }
            else {
                currentCharIndex = parseInt($(e).attr('id').match(/\d+/gi)[0]) + 1;
                $('#cursor').css('left', nextCharX + 'px');
                endCursorPosition = parseInt($(e).attr('id').match(/\d+/gi)[0]);
            }
            $('#cursor').css('top', charY + 'px');
            // 将选区变色（倒着选也可以）
            firstCursorCharIndex = Math.min(startCursorPosition, endCursorPosition);
            secondCursorCharIndex = Math.max(startCursorPosition, endCursorPosition);
            
            for(let i = 0; i < code.length; i++) {
                if(i > firstCursorCharIndex && i <= secondCursorCharIndex) {
                    $('#char' + i).addClass('char_selected');
                }
                else {
                    $('#char' + i).removeClass('char_selected');
                }
            }
            // console.log('光标位置：' + mouseX + ' / ' + parseInt(charX) + ' / 字符序号: ' + startCursorPosition);
            // console.log($(e));
            console.log('选区：' + $('#char' + startCursorPosition).html() + ' ~ ' + $('#char' + endCursorPosition).html());
        });

        $(e).dblclick(function(event) {
            event.stopPropagation();
            // 被点击字符的坐标
            let charIndex = parseInt($(e).attr('id').match(/\d+/gi)[0]);
            // 向左搜索定界符（空格）
            for(let i = charIndex; i >= 0; i--) {
                if(/[\s\.\,\\\|\+\=\-\{\}\[\]\(\)\:\;\'\"\<\>\?\/\`\~\!\@\#\$\%\^\&\*]/i.test(code[i])) {
                    firstCursorCharIndex = i;
                    break;
                }
            }
            // 向右搜索定界符（空格）
            for(let i = charIndex; i < code.length; i++) {
                if(/[\s\.\,\\\|\+\=\-\{\}\[\]\(\)\:\;\'\"\<\>\?\/\`\~\!\@\#\$\%\^\&\*]/i.test(code[i])) {
                    secondCursorCharIndex = i - 1;
                    break;
                }
            }

            // 将选区变色（倒着选也可以）
            for(let i = 0; i < code.length; i++) {
                if(i > firstCursorCharIndex && i <= secondCursorCharIndex) {
                    $('#char' + i).addClass('char_selected');
                }
                else {
                    $('#char' + i).removeClass('char_selected');
                }
            }
        });

    });





    // 鼠标在没有字符的行内区域按下
    $('.line').mousedown(function(event) {
        mouseStatus = 1;
        // 被点击行号
        let lineIndex = parseInt($(this).attr('id').match(/\d+/gi)[0]);

        // 高亮所在行
        for(let i = 0; i <= lineLastCharIndex.length; i++) {
            if(i === lineIndex) {
                $('#line' + i).addClass('line_active');
            }
            else {
                $('#line' + i).removeClass('line_active');
            }
        }

        // 鼠标实际点击点坐标
        let mouseX = event.clientX;
        let mouseY = event.clientY;

        // 如果鼠标点按区域是第一个字符前面(lineNumberWidth px以内)，则光标移到最前面
        if(mouseX - $('#line' + lineIndex).parent().offset().left < lineNumberWidth) {
            // 该行第一个字符的index
            let charIndex = (lineIndex <= 0) ? -1 : lineLastCharIndex[lineIndex] + 1;
            startCursorPosition = charIndex;

            let charX = $('#char' + (charIndex+1).toString()).offset().left;
            let charY = $('#char' + (charIndex+1).toString()).offset().top;
            $('#cursor').css('left', charX + 'px');
            $('#cursor').css('top', charY + 'px');
            currentCharIndex = charIndex+1;
        }
        else {
            // 该行最后一个字符的index
            let charIndex = lineLastCharIndex[lineIndex+1] + 1;
            startCursorPosition = charIndex;

            // alert(JSON.stringify(lineLastCharIndex) + ' ~ ' + lineLastCharIndex[lineIndex+1]);

            let charX = $('#char' + charIndex).offset().left;
            let nextCharX = charX + $('#char' + charIndex)[0].offsetWidth;
            let charY = $('#char' + charIndex).offset().top;
            $('#cursor').css('left', charX + 'px');
            $('#cursor').css('top', charY + 'px');
            currentCharIndex = charIndex;
        }


        console.log('选区：' + $('#char' + startCursorPosition).html() + ' ~ ' + $('#char' + endCursorPosition).html());

        // console.log('光标位置：' + mouseX + ' / ' + parseInt(charX) + ' / 字符序号: ' + startCursorPosition);
    });




    // 鼠标在没有字符的行内区域放下
    $('.line').mouseup(function(event) {
        event.stopPropagation();
        mouseStatus = 0;
        // 被点击行号
        let lineIndex = parseInt($(this).attr('id').match(/\d+/gi)[0]);
        // 鼠标实际点击点坐标
        let mouseX = event.clientX;
        let mouseY = event.clientY;

        // 如果鼠标点按区域是第一个字符前面(lineNumberWidth px以内)，则光标移到最前面
        if(mouseX - $('#line' + lineIndex).parent().offset().left < lineNumberWidth) {
            // 该行第一个字符的index
            let charIndex = (lineIndex <= 0) ? -1 : lineLastCharIndex[lineIndex] + 1;
            endCursorPosition = charIndex;

            let charX = $('#char' + (charIndex+1).toString()).offset().left;
            let charY = $('#char' + (charIndex+1).toString()).offset().top;
            $('#cursor').css('left', charX + 'px');
            $('#cursor').css('top', charY + 'px');
            currentCharIndex = charIndex+1;
        }
        else {
            // 该行最后一个字符的index
            let charIndex = lineLastCharIndex[lineIndex+1] + 1;
            endCursorPosition = charIndex;

            let charX = $('#char' + charIndex).offset().left;
            let nextCharX = charX + $('#char' + charIndex)[0].offsetWidth;
            let charY = $('#char' + charIndex).offset().top;
            $('#cursor').css('left', charX + 'px');
            $('#cursor').css('top', charY + 'px');
            currentCharIndex = charIndex;
        }



        // 将选区变色（倒着选也可以）
        firstCursorCharIndex = Math.min(startCursorPosition, endCursorPosition);
        secondCursorCharIndex = Math.max(startCursorPosition, endCursorPosition);
        
        for(let i = 0; i < code.length; i++) {
            if(i > firstCursorCharIndex && i <= secondCursorCharIndex) {
                $('#char' + i).addClass('char_selected');
            }
            else {
                $('#char' + i).removeClass('char_selected');
            }
        }
        // console.log('光标位置：' + mouseX + ' / ' + parseInt(charX) + ' / 字符序号: ' + startCursorPosition);
        // console.log($(e));
        console.log('选区：' + $('#char' + startCursorPosition).html() + ' ~ ' + $('#char' + endCursorPosition).html());
    });
    

    // 鼠标划过
    $('.line').mouseover(function(event) {
        // 只有鼠标按下时才有效
        if(mouseStatus != 1) {
            return;
        }
        // 被点击行号
        let lineIndex = parseInt($(this).attr('id').match(/\d+/gi)[0]);
        // 鼠标实际点击点坐标
        let mouseX = event.clientX;
        let mouseY = event.clientY;


        // 如果鼠标点按区域是第一个字符前面(lineNumberWidth px以内)，则光标移到最前面
        if(mouseX - $('#line' + lineIndex).parent().offset().left < lineNumberWidth) {
            // 该行第一个字符的index
            let charIndex = (lineIndex <= 0) ? -1 : lineLastCharIndex[lineIndex] + 1;
            endCursorPosition = charIndex;

            let charX = $('#char' + (charIndex+1).toString()).offset().left;
            let charY = $('#char' + (charIndex+1).toString()).offset().top;
            $('#cursor').css('left', charX + 'px');
            $('#cursor').css('top', charY + 'px');

            currentCharIndex = charIndex+1;
        }
        else {
            // 该行最后一个字符的index
            let charIndex = lineLastCharIndex[lineIndex+1] + 1;
            endCursorPosition = charIndex;

            let charX = $('#char' + charIndex).offset().left;
            let charY = $('#char' + charIndex).offset().top;
            $('#cursor').css('left', charX + 'px');
            $('#cursor').css('top', charY + 'px');
            currentCharIndex = charIndex;
        }


        // 将选区变色（倒着选也可以）
        firstCursorCharIndex = Math.min(startCursorPosition, endCursorPosition);
        secondCursorCharIndex = Math.max(startCursorPosition, endCursorPosition);
        
        for(let i = 0; i < code.length; i++) {
            if(i > firstCursorCharIndex && i <= secondCursorCharIndex) {
                $('#char' + i).addClass('char_selected');
            }
            else {
                $('#char' + i).removeClass('char_selected');
            }
        }
        // console.log('光标位置：' + mouseX + ' / ' + parseInt(charX) + ' / 字符序号: ' + startCursorPosition);
        // console.log($(e));
        console.log('选区：' + $('#char' + startCursorPosition).html() + ' ~ ' + $('#char' + endCursorPosition).html());
    });




    // 鼠标在body（编辑器外）放下
    $('body').mouseup(function(event) {
        mouseStatus = 0;

        endCursorPosition = code.length - 1;


        // 将选区变色（倒着选也可以）
        firstCursorCharIndex = Math.min(startCursorPosition, endCursorPosition);
        secondCursorCharIndex = Math.max(startCursorPosition, endCursorPosition);
        
        for(let i = 0; i < code.length; i++) {
            if(i > firstCursorCharIndex && i <= secondCursorCharIndex) {
                $('#char' + i).addClass('char_selected');
            }
            else {
                $('#char' + i).removeClass('char_selected');
            }
        }
        // console.log('光标位置：' + mouseX + ' / ' + parseInt(charX) + ' / 字符序号: ' + startCursorPosition);
        // console.log($(e));
        console.log('Body选区：' + $('#char' + startCursorPosition).html() + ' ~ ' + $('#char' + endCursorPosition).html());
    });

    $('body').keydown(function() {
        setElementOffset('virtual_inputbox', currentCharIndex);
        $('#virtual_inputbox').focus();
    });



    $('#virtual_inputbox').bind("keydown", function(event) {
        console.warn(event.keyCode);
        if(event.keyCode === 229) {
            console.warn(event);
            // return false;
        }
        else if(event.keyCode === 37) { // 左
            if(currentCharIndex > 0) {
                currentCharIndex--;
            }
            charX = $('#char' + currentCharIndex).offset().left;
            charY = $('#char' + currentCharIndex).offset().top;
            $('#cursor').css('left', charX + 'px');
            $('#cursor').css('top', charY + 'px');
            $('#cursor').show();
        }
        else if(event.keyCode === 39) { // 左
            if(currentCharIndex < code.length) {
                currentCharIndex++;
            }
            charX = $('#char' + currentCharIndex).offset().left;
            charY = $('#char' + currentCharIndex).offset().top;
            $('#cursor').css('left', charX + 'px');
            $('#cursor').css('top', charY + 'px');
            $('#cursor').show();
        }
        else if(event.keyCode === 13) { // 回车
            code = insertChar(code, currentCharIndex, '\n');
            render(code);
            currentCharIndex++;
            setElementOffset('cursor', currentCharIndex);
            $('#cursor').show();
            $('#virtual_inputbox').val('');
        }
        else if(event.keyCode === 8) { // 退格
            code = deleteChar(code, currentCharIndex-1);
            render(code);
            currentCharIndex--;
            setElementOffset('cursor', currentCharIndex);
            $('#cursor').show();
        }
        else if(event.keyCode === 46) { // Del
            code = deleteChar(code, currentCharIndex);
            render(code);
            setElementOffset('cursor', currentCharIndex);
            $('#cursor').show();
        }
    });
    
    // 输入法输入完毕
    $('#virtual_inputbox').bind("compositionend", function(event) {
        console.log(event.keyCode);
        let charX = 0;
        let charY = 0;
        if(event.ctrlKey) {
            console.log('ctrl');
        }
        
        
        else {
            // event.preventDefault();
            code = insertChar(code, currentCharIndex, $('#virtual_inputbox').val());
            render(code);
            if(currentCharIndex < code.length) {
                currentCharIndex += $('#virtual_inputbox').val().length;
            }
            setElementOffset('cursor', currentCharIndex);
            $('#cursor').show();
            $('#virtual_inputbox').val('');
        }
        setElementOffset('virtual_inputbox', currentCharIndex);
        $('#virtual_inputbox').focus();
    });

















};

