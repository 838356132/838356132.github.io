function format(word) {
    if(VOCABULARY[word] === undefined) {
        alert('这个词暂时没有');
        return undefined;
    }
    let items = VOCABULARY[word].items;
    let examples = VOCABULARY[word].examples;
    let usages = VOCABULARY[word].usages;
    let related = VOCABULARY[word].related;
    
    let html = '<div class="card">';
    html += `<div class="word-title">${word}</div>`;

    html += `<div class="item"><div class="field-title">释义</div>`;
    for(let i = 0; i < items.length; i++) {
        let item = items[i];
        let pos = item.match(/^\[.+\]/gi)[0];
        let expl = item.replace(pos, "").trim();
        html += `<div class="expl-line"><span class="part-of-speech">${pos}</span><span class="explanation">${expl}</span></div>`;
    }
    html += `</div>`;

    html += `<div class="examples"><div class="field-title">例句</div>`;
    for(let i = 0; i < examples.length; i++) {
        // 需要高亮例句中编辑距离最小的词
        let segs = examples[i].split('/');
        html += `<div class="field-line"><span class="item-eng">${segs[0].trim()}</span><br><span class="item-chn">${segs[1].trim()}</span></div>`;
    }
    html += `</div>`;

    html += `<div class="usages"><div class="field-title">用法和习语</div>`;
    for(let i = 0; i < usages.length; i++) {
        // 需要高亮编辑距离最小的词
        let segs = usages[i].split('/');
        html += `<div class="field-line"><span class="item-eng">${segs[0].trim()}</span><br><span class="item-chn">${segs[1].trim()}</span></div>`;
    }
    html += `</div>`;

    html += `<div class="related"><div class="field-title">相关词</div>`;
    for(let i = 0; i < related.length; i++) {
        let rel = related[i];
        html += `<div class="field-line"><a class="word-link" id="${rel}">${rel}</span></div>`;
    }
    html += `</div>`;
    html += `</div>`;

    document.getElementById('flashcard-content').innerHTML = html;

    return html;
}