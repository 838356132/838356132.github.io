
// Mikumark V3.0
// Project Aurora - Markdown Parser
// 2019.10 Refactored in TypeScript

// Arch:
// MD → [Parser] → MarkdownDocument object(HTML included) → [Painter] → Web page

class MarkdownDocument {
    public title: string;
    public author: Array<string>;
    public date: string;
    public coverURL: string;
    public type: string;
    public tags: Array<string>;

    public script: string;
    public outline: Array<string>;
    public inlineCSS: string;
    public inlineJS: string;

    public HTML;
}

// Markdown → HTML
function MarkdownParser(MarkdownScript: string): string {
    let HtmlBuffer: Array<string> = new Array();
    // TODO
    return HtmlBuffer.join("");
}

// Markdown → Outline
function OutlineAnalyser(MarkdownScript: string): Array<string> {
    let outline: Array<string> = new Array();
    // TODO
    return outline;
}

