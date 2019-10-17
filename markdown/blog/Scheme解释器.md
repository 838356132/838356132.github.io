
#!title:    Scheme解释器
#!date:     2018-08-16
#!authors:  Mikukonai
#!cover:    
#!type:     原创
#!tags:     函数式编程,计算机科学,Scheme


#!content

<a id="reload" style="display: block; text-align:center;">**没有加载完成？点此重新加载**</a>

<form style="border: 1px solid #cccccc; border-radius: 8px; overflow: hidden;"><textarea id="code1" name="code"></textarea></form>

**V3 测试用例**：<a id="clear">**清除**</a> / <a id="testcase0">显式TCO和模式匹配</a> / <a id="testcase1">词法作用域</a> / <a id="testcase2">Man or Boy Test</a> / <a id="testcase3">日历</a> / <a id="testcase4">快排</a> / <a id="testcase5">TLS解释器</a> / <a id="testcase6">CPS阶乘</a> / <a id="testcase7">CPS阴阳谜题</a> / <a id="testcase8">2的65536次幂</a> / <a id="testcase9">丘奇编码</a> / <a id="testcase10">隐式尾递归优化</a> / <a id="testcase11">侯世达雌雄序列</a>

**V4 测试用例**：<a id="v4test0">call/cc测试1</a> / <a id="v4test1">call/cc测试2</a> / <a id="v4test2">词法作用域</a> / <a id="v4test3">Man or Boy Test</a> / <a id="v4test4">日历</a> / <a id="v4test5">快排</a> / <a id="v4test6">TLS解释器</a> / <a id="v4test7">CPS阶乘</a> / <a id="v4test8">CPS阴阳谜题</a> / <a id="v4test9">2的65536次幂</a> / <a id="v4test10">丘奇编码</a> / <a id="v4test11">set!测试</a> / <a id="v4test12">生成器</a> / <a id="v4test13">仅使用Call/cc无限循环</a> / <a id="v4test14">Hey! Call/cc</a> / <a id="v4test15">阴阳谜题</a>

<button class="md-button-green" id="test" style="width:100%;">执行</button>

<span id="test_result"></span>

> **说明**：解释器项目已经冻结，原则上不再继续维护。相关的工作全部转移到[AuroraScheme](https://github.com/mikukonai/AuroraScheme)项目，该项目是对解释器项目的继承和发展。

> 尽管上面的测试用例全部运行无误，但是目前V3和V4在设计上都有重大的错误，且V4有部分特性和内置函数尚未实现。由于项目已冻结，因此不再改正。

2018年10月18日的自我评价：

> 你搞的这个解释器啊，naive！

> 首先你没有卫生宏，没有卫生宏的Scheme和咸鱼有什么区别？？？

> 其次你的词法作用域真的sound吗？不要以为你用各种说不清道不明的workaround搞定了阴阳谜题和Knuth的那个用例，就真的觉得万事大吉了。实际上你这个设计从根本上来讲就是不恰当的。你的闭包链本质上仍然是动态作用域那一套。

> 进一步说，你的这个解释器实际上是应该做形式化验证的。但是你既不懂coq也不懂haskell，所以验证不了，对不对？

> 你读得少、做得也不多。你花了两个月搞出这么一个trivial的小东西，真的很simple。

> 你的用例少得可怜，所以你没办法通过高覆盖的测试去验证你拍脑袋想出的各种小trick对不对？

> 你的代码架构脏得可以，毫无封装意识，毕竟你也没有正经学过JavaScript对不对？毕竟你连TSPL/SICP/EOPL/甚至HTDP都没读过嘛。你只是一个刚刚从The Little Schemer开始入门的FP新手菜鸟而已啊。

> 好了，不挖苦你了。王垠说解释器这东西既简单又复杂，简单就简单在它一是一、二是二，核心思想是简洁且有规律有逻辑可循的；但复杂就复杂在，作为一种虚拟机器，它的输入空间是千变万化的，你很难通过测试去彻底地验证它，同时也有工程上的复杂性。

> 本次开发的一个有益的经验是：从一开始就采取测试驱动的开发，以及相对比较好的版本控制。尽管你也没设计多少有一定复杂性的用例，但是这件事情是对的。值得鼓励。

> 接下来，你还有卫生宏和continuation两座大山需要翻越。搞定了这两个advanced的特性，即便MikuRec不能投入生产，即便MikuRec有种种缺陷，那也算是一件值得写入简历的作品了。

> 行了，就说到这里。10月18日的版本拉个基线出来，后续开发基于这个基线。祝你成功~

# 形式语法

```
         <Term> ::= <SList> | <Lambda> | <Quote> | <Quasiquote> | <Symbol>
        <SList> ::= ( <SListSeq> )
       <Lambda> ::= ( lambda <ArgList> <Body> )
     <SListSeq> ::= <Term> <SListSeq> | ε
   <ArgListSeq> ::= <ArgSymbol> <ArgListSeq> | ε
      <ArgList> ::= ( <ArgListSeq> )
         <Body> ::= <SList> | <Lambda> | <Quote> | <BodySymbol>
        <Quote> ::= ' <Term>
   <Quasiquote> ::= [ <SListSeq> ] | ε
       <Symbol> ::= IDENTIFIER
   <BodySymbol> ::= IDENTIFIER
    <ArgSymbol> ::= IDENTIFIER
```

其中IDENTIFIER是上文所述的标识符。

非终结符的FIRST集合：

|非终结符|FIRST|
|---|
|`&lt;Term&gt;`|`(` `[` `'` `SYMBOL`|
|`&lt;SList&gt;`|`(`|
|`&lt;Lambda&gt;`|`(`|
|`&lt;SListSeq&gt;`|`ε` `(` `[` `'` `SYMBOL`|
|`&lt;ArgListSeq&gt;`|`ε` `SYMBOL`|
|`&lt;ArgList'&gt;`|`(`|
|`&lt;Body&gt;`|`(` `[` `'` `SYMBOL`|
|`&lt;Quote&gt;`|`'`|
|`&lt;Quasiquote&gt;`|`[`|
|`&lt;Symbol&gt;`|`SYMBOL`|
|`&lt;BodySymbol&gt;`|`SYMBOL`|
|`&lt;ArgSymbol&gt;`|`SYMBOL`|

为简单起见，使用递归下降分析。因为已经消除了左递归，所以理论上是不会出现无限循环的。此外，最多只需要向前看两个符号，就可以决定产生式。

# 卫生宏

宏（macro）是一种元编程手段。简单地说，宏的用途是匹配代码中出现的某种模式，将其替换为事先定义好的其他结构。

宏是Scheme最强大的语言设施之一，许多语法糖（派生结构）实际上就是利用宏机制，在少数基本结构的基础上构造而成的。进一步，Continuation也可以利用宏对原始代码作CPS变换而实现。

C语言也提供了宏，但C语言的宏仅仅是字符串的简单替换，稍不注意，就会掉进坑里。例如，考虑下列代码：

```:c
#define SQUARE(x) (x*x)

SQUARE(a+1) //=>(a+1*a+1)
SQUARE(a++) //=>(a++*a++)
```

第一种情况是简单字符串替换造成的错误，但第二种情况很难说清楚，因为`++`运算符是有副作用的，这里并不知道程序员的真实意图。

简单宏替换会污染宏调用的上下文，因此是“不卫生”的。

Scheme创新性地引入了**卫生宏**的概念。所谓的卫生宏，指的是可以通过重命名等机制，保证宏替换过程不会污染宏调用所在的上下文。具体来说，是满足这样几点性质：

+ 宏定义中出现的自由变量，仍然是词法作用域的。即，在宏定义中出现的自由变量，其绑定以**定义**所在的上下文为准，而**不会**被宏调用所在上下文所覆盖。
+ 宏定义中引入的变量绑定，若宏调用所在上下文出现了同名绑定，则宏定义引入的变量会被改名，以避免污染宏调用上下文。

第一点保证了宏定义内部自由变量的词法作用域特性；第二点保证了宏展开过程不会污染宏调用上下文已有的绑定。但是，如果传入宏调用的参数是有副作用的（例如`set!`），则会出现上面C语言例子中的第二种情况，必须特别注意。

下面是一个例子：

```:scheme
(define var 100)
;; 宏定义
(macro test
  ((_ f a)
   (lambda (x) (f a x var))))
;; 宏调用
(define foo
  (lambda (x var)
    (test (lambda (x y z) (+ x y z)) x)))

#lang racket
(define var 10)
(define-syntax test
  (syntax-rules ()
    ((_ a)
     (+ a a))))
(test (begin (set! var (+ 1 var)) var))
```

每个宏都有宏关键字，用于唯一标识已定义的宏。宏和宏关键字必须在程序顶层定义，不可嵌套定义。局部变量绑定会覆盖宏关键字，而宏关键字会覆盖同级以及上级的变量绑定。

# 尾递归

发生在尾位置的递归调用，称为**尾递归**。R5RS中给出了尾位置的归纳定义。MikuRec在解释执行前，会对AST进行扫描，检测出尾递归并加以标记，在执行时进行尾递归优化。

此外，可以利用 MikuRec 提供的`while`循环，使用一种称为“[蹦床](https://en.wikipedia.org/wiki/Trampoline_\(computing\))”的方法，实现手工的尾递归优化。

# 延续传递风格（CPS）

在C等命令式语言中，可通过跳转指令实现控制流转向。在基于表达式的 Scheme 中，每个表达式都有一个对应的“上下文”。此上下文保存了表达式可见的变量绑定、函数调用栈和语法上下文等信息。在 Scheme 中，上下文用 Continuation（延续）来表示，并作为一等对象暴露给程序员。利用 continuation，程序员可以手动控制程序的控制流，实现非局部跳出、异常处理、协程、生成器等高级的控制结构。

可以使用MikuRec提供的宏机制，实现代码到代码的自动CPST。以下用S*指代S-term的CPS形式。

```:lisp
; 符号 S* =
(lambda (cont) (cont S))

; 函数 (lambda (x) M)* =
(lambda (cont)
  (cont (lambda (x)
          (lambda (k)
            (M* (lambda (m) (k m)))))))

; 调用 (M N)* =
(lambda (cont)
  (M* (lambda (m-res)
        (N* (lambda (n-res)
              ((m-res n-res)
               (lambda (a) (cont a))))))))

; 未经柯里化的多参数调用 (M0 M1 M2 M3 ...)* =
(lambda (cont)
  ; 以下仅仅是对每个AST节点进行简单的遍历CPST/重命名，并未体现求值顺序，可以理解成并行的
  (M0* (lambda (node0) ; 每个nodex的类型都是cont->...
  (M1* (lambda (node1)
  (M2* (lambda (node2)
  (M3* (lambda (node3)
  ; 从这里开始体现求值顺序，几乎等于是 A-Normal Form
  ((node0 node1 node2 node3) (lambda (res)
  ; 最后执行总的continuation
  ( cont res))))))))))))

; (if P T F)* =
(lambda (cont)
  (P*
   (lambda (p-res)
     (if p-res
         (T* cont)
         (F* cont)))))
```

# 参考资料

+ Danvy O, Filinski A. [Representing Control: a Study of the CPS Transformation](http://pdfs.semanticscholar.org/144b/7a68e040839f161ae9025e6e2c02ee4b08e2.pdf)[J]. Mathematical Structures in Computer Science, 1992, 2(4):361-391.
+ D.P. Friedman, M. Wand. [Essentials of Programming Languages](http://www.eopl3.com/).
+ 王垠. [怎样写一个解释器](http://www.yinwang.org/blog-cn/2012/08/01/interpreter/).
+ [CPS变换与CPS变换编译](https://zhuanlan.zhihu.com/p/22721931).
+ [Matt Might 的博客](http://matt.might.net/)


#!style

#!style:./css/codemirror/codemirror.css
#!style:./css/codemirror/matchesonscrollbar.css

.CodeMirror-focused .cm-matchhighlight {
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQI12NgYGBgkKzc8x9CMDAwAAAmhwSbidEoSQAAAABJRU5ErkJggg==);
    background-position: bottom;
    background-repeat: repeat-x;
}
.cm-matchhighlight {background-color: rgba(0, 0, 0, 0.1)}

#!script

#!script:./js/codemirror/codemirror.js
#!script:./js/codemirror/scheme.js
#!script:./js/codemirror/active-line.js
#!script:./js/codemirror/matchbrackets.js
#!script:./js/codemirror/match-highlighter.js
#!script:./js/codemirror/matchesonscrollbar.js
#!script:./ts/signal.js
#!script:./js/mikurec3.js

// 2018.10.10 大数乘法
function bigIntMultiply(astr, bstr) {
    // 自适应FFT长度
    let maxlen = Math.max(astr.length, bstr.length) * 2;
    let loglen = Math.round(Math.log2(maxlen));
    let FFTSIZE = (loglen % 2 === 0) ? POW[loglen+2] : POW[loglen+1]; // 偶数POW
    // 字符串->复数序列
    let a = new Array(FFTSIZE);
    let b = new Array(FFTSIZE);
    for(let i = 0; i < FFTSIZE; i++) {
        aDigit = (i < astr.length) ? parseInt(astr[astr.length-1-i]) : 0;
        bDigit = (i < bstr.length) ? parseInt(bstr[bstr.length-1-i]) : 0;
        a[i] = new Complex(aDigit, 0);
        b[i] = new Complex(bDigit, 0);
    }
    // 傅氏变换
    let A = FFT(a, FFTSIZE);
    let B = FFT(b, FFTSIZE);
    // 卷积
    let C = new Array();
    for(let i = 0; i < FFTSIZE; i++) {
        let c = A[i].mul(B[i]);
        C.push(c);
    }
    let c = IFFT(C, FFTSIZE);
    // 以字符串输出
    return (function(n) {
        let numstr = '';
        let carry = 0;
        for(let i = 0; i < n.length; i++) {
            let c = Math.round(n[i].rep) + carry;
            if(c >= 0 && c <= 9) {
                numstr = c.toString() + numstr;
                carry = 0;
            }
            else {
                numstr = (c % 10).toString() + numstr;
                carry = Math.round((c - c % 10) / 10);
            }
        }
        return numstr.replace(/^0*/gi, '');
    })(c);
}


setTimeout(loadTest, 600);

document.getElementById('reload').addEventListener('click', ()=>{
    loadTest();
});

function loadTest() {
    var editor = CodeMirror.fromTextArea(document.getElementById("code1"), {
        lineNumbers: true,
        styleActiveLine: true,
        matchBrackets: true,
        lineWrapping: false,
        highlightSelectionMatches: {showToken: /[^\s\(\)]+/}
    });
    editor.setSize('auto', '300px');

    const CURRY = `

`;

    const SAMPLE = [`(display "20的阶乘（TCO）：")
(define fac-iter
  (lambda (n s)
    (if (= n 0)
        s
        (lambda ()
          (fac-iter (- n 1) (* n s))))))
(define trampoline
  (lambda (thunk)
    (begin
      (define fn thunk)
      (while (eq? "CLOSURE" (type-of-value (fn)))
             (set! fn (fn)))
      (fn))))
(display (trampoline (lambda () (fac-iter 20 1))))
(newline)
(match ('cond (p a) ...)
       ('cond ((= n 1) 100)
              (#t ((lambda (x) (+ x y)) 10))
              (free-var 'abc) ))
(define counter 0)
(define closure-counter 0)
(display "10的阶乘（CPS）：")
(define fac
  (lambda (n cont)
    (begin (set! counter (+ 1 counter))
           (if (= n 0)
               (cont 1)
               (fac (- n 1)
                    (lambda (res)
                      (begin (set! closure-counter (+ 1 closure-counter))
                             (cont (* res n)))))))))
(display (fac 10 (lambda (x) x)))
(newline)
(display "fac调用次数：")
(display counter)
(newline)
(display "闭包（continuation）的调用次数：")
(display closure-counter)
(newline)
`,

// testcase1
`;; 用于测试基本的静态作用域
;; 期望输出：
;; 顶级变量
;; 110
;; 123
;; 10
(define free-var "顶级变量")
(define A
  (lambda (k)
    (begin
      (display free-var) (newline)
      (define B
        (lambda ()
          (set! k (+ k 10))))
      (B)
      k)))
(define C
  (lambda (free-var)
    (A 100)))
(display (C "调用上下文的值")) (newline)

(define c 10)
(define f
  (lambda (c)
    (begin
      (set! c 123)
      c)))

(display (f 1)) (newline)
(display c)

`,

// testcase 2
`;; Knuth提出的编译器递归测试，期望结果见维基百科
;; https://en.wikipedia.org/wiki/Man_or_boy_test
;; 注意：当k大于或等于11时会爆栈
(define A
  (lambda (k x1 x2 x3 x4 x5)
    (begin
      (define B
        (lambda ()
          (begin
            ; (display "B: 进入B=") (display (current-closure)) (newline)
            ; (display "   old k: ") (display k) (newline)
            (set! k (- k 1))
            ; (display "   new k: ") (display k) (newline)
            ; (display "B: 执行(A k B x1 x2 x3 x4)") (newline)
            (A k B x1 x2 x3 x4))))
      ; (display "A: 进入A=") (display (current-closure)) (newline)
      (if (<= k 0)
          (begin
            ; (display "A: 执行(+ (x4) (x5))") (newline)
            (+ (x4) (x5)))
          (begin
            ; (display "A: 执行(B)") (newline)
            (B))))))

(define count 0)
(while (<= count 11)
  (begin
    (display "(A ") (display count)
    (display " [1,-1,-1,1,0]) = ")
    (display (A count (lambda () 1) (lambda () -1) (lambda () -1) (lambda () 1) (lambda () 0)))
    (newline)
    (set! count (+ count 1))))
`,

// testcase 3
`(display "=== 日历演示 ===")
(newline)

(define get_value_iter
  (lambda (list i counter)
    (if (= counter i)
        (car list)
        (get_value_iter (cdr list) i (+ counter 1)))))

(define get_value
  (lambda (list i)
    (get_value_iter list i 0)))

(define is_leap_year
  (lambda (year)
    (cond ((and (= (% year 4) 0)
                (not (= (% year 100) 0)))
           #t)
          ((= (% year 400) 0)
           #t)
          (else
           #f))))

(define days_of_month
  (lambda (year month)
    (cond ((< month 1) 0)
          ((> month 12) 0)
          (else (cond ((is_leap_year year)
                       (get_value '(0 31 29 31 30 31 30 31 31 30 31 30 31) month))
                      (else
                       (get_value '(0 31 28 31 30 31 30 31 31 30 31 30 31) month)))))))

(define days_of_year
  (lambda (year)
    (if (is_leap_year year)
        366 
        365)))

;某月某日是某年的第几天
(define day_count
  (lambda (year month day)
    (cond ((= month 0) day)
          (else (+ (days_of_month year (- month 1)) (day_count year (- month 1) day))))))


;计算两个日期之间的日数差
(define day_diff
  (lambda (y1 m1 d1 y2 m2 d2)
    (cond ((= y1 y2) (- (day_count y2 m2 d2) (day_count y1 m1 d1)))
          (else (+ (days_of_year (- y2 1)) (day_diff y1 m1 d1 (- y2 1) m2 d2))))))

;计算某日的星期数
(define get_week
  (lambda (year month day)
    (% (day_diff 2017 1 1 year month day) 7)))

;格式输出
(define print_iter
  (lambda (year month iter blank_flag)
    (cond ((>= iter (+ (get_week year month 1) (days_of_month year month)))
             (newline)) ;月末结束
          ((< iter (get_week year month 1))
            (begin
             (display "   ")
             (print_iter year month (+ iter 1) blank_flag))) ;月初空格
          (else
             (cond ((and (< (- iter (get_week year month 1)) 9) (= blank_flag 0))
                     (begin
                      (display " ")
                      (print_iter year month iter 1)))
                   (else
                      (cond ((= (% iter 7) 6)
                              (begin
                               (display (+ 1 (- iter (get_week year month 1))))
                               (newline)
                               (print_iter year month (+ iter 1) 0))) ;行末换行
                            (else
                              (begin
                                (display (+ 1 (- iter (get_week year month 1))))
                                (display " ")
                                (print_iter year month (+ iter 1) 0))))))))))

(define print_calendar
  (lambda (year month)
    (print_iter year month 0 0)))

(define YEAR 2018)
(define MONTH 9)

(newline)
(display "Scheme日历")(newline)
(display "2017.8.26 mikukonai")(newline)(newline)
(display YEAR)(display "年")(display MONTH)(display "月")(newline)
(display "====================")(newline)
(display "Su Mo Tu We Th Fr Sa")(newline)
(display "====================")(newline)
(print_calendar YEAR MONTH)
(display "====================")(newline)

`,
// testcase 4
`(define filter
  (lambda (f lst)
    (if (null? lst)
        '()
        (if (f (car lst))
            (cons (car lst) (filter f (cdr lst)))
            (filter f (cdr lst))))))
(define concat
  (lambda (a b)
    (if (null? a)
        b
        (cons (car a) (concat (cdr a) b)))))

(define quicksort
  (lambda (array)
    (if (or (null? array) (null? (cdr array)))
        array
        (concat (quicksort (filter (lambda (x)
                                     (if (< x (car array)) #t #f))
                                   array))
                           (cons (car array)
                                 (quicksort (filter (lambda (x)
                                                      (if (> x (car array)) #t #f))
                                                    array)))))))

(display (quicksort '(5 9 1 7 5 3 0 4 6 8 2)))
(newline)

`,
// testcase 5
`;; The Little Schemer 第十章的简单解释器

(define build
  (lambda (s1 s2)
    (cons s1 (cons s2 '()))))

(define first
  (lambda (list-pair)
    (car list-pair)))

(define second
  (lambda (list-pair)
    (car (cdr list-pair))))

(define third
  (lambda (list-pair)
    (car (cdr (cdr list-pair)))))

(define new-entry build)

(define lookup-in-entry-help
  (lambda (name names values entry-f)
    (cond ((null? names) (entry-f name))
          ((eq? (car names) name) (car values))
          (else (lookup-in-entry-help name (cdr names) (cdr values) entry-f)))))

(define lookup-in-entry
  (lambda (name entry entry-f)
    (lookup-in-entry-help name (first entry) (second entry) entry-f)))

(define extend-table cons)

(define lookup-in-table
  (lambda (name table table-f)
    (cond ((null? table) (table-f name))
          (else (lookup-in-entry name
                                 (car table)
                                 (lambda (n)
                                   (lookup-in-table n
                                                    (cdr table)
                                                    table-f)))))))

(define expression-to-action
  (lambda (e)
    (cond ((atom? e) (atom-to-action e))
          (else (list-to-action e)))))

(define atom-to-action
  (lambda (e)
    (cond ((number? e) *const)
          ((eq? e #t) *const)
          ((eq? e #f) *const)
          ((eq? e 'cons) *const)
          ((eq? e 'car) *const)
          ((eq? e 'cdr) *const)
          ((eq? e 'null?) *const)
          ((eq? e 'eq?) *const)
          ((eq? e 'atom?) *const)
          ((eq? e 'zero?) *const)
          ((eq? e 'add1) *const)
          ((eq? e 'sub1) *const)
          ((eq? e '+) *const)
          ((eq? e '-) *const)
          ((eq? e '*) *const)
          ((eq? e '/) *const)
          ((eq? e '=) *const)
          ((eq? e 'begin) *const)
          ((eq? e 'display) *const)
          ((eq? e 'number?) *const)
          (else *identifier))))

(define list-to-action
  (lambda (e)
    (cond ((atom? (car e))
           (cond ((eq? (car e) 'quote)  *quote)
                 ((eq? (car e) 'lambda) *lambda)
                 ((eq? (car e) 'cond)   *cond)
                 (else *application)))
          (else *application))))

(define meaning
  (lambda (e table)
    ;(begin (display "Meaning:") (display e) (newline)
    ((expression-to-action e) e table)));)

(define value
  (lambda (e)
    (meaning e '())))

(define *const
  (lambda (e table)
    (cond ((number? e) e)
          ((eq? e #t) #t)
          ((eq? e #f) #f)
          (else (build 'primitive e)))))

(define text-of second)

(define *quote
  (lambda (e table)
    (text-of e)))

(define initial-table (lambda (name) (car '())))

(define *identifier
  (lambda (e table)
    (lookup-in-table e table initial-table)))

(define *lambda
  (lambda (e table)
    (build 'non-primitive (cons table (cdr e)))))

(define table-of first)
(define formals-of second)
(define body-of third)

(define else?
  (lambda (x)
    (cond ((atom? x) (eq? x 'else))
          (else #f))))

(define question-of first)
(define answer-of second)

(define evcon
  (lambda (lines table)
    (cond ((else? (question-of (car lines))) (meaning (answer-of (car lines)) table))
          ((meaning (question-of (car lines)) table) (meaning (answer-of (car lines)) table))
          (else (evcon (cdr lines) table)))))

(define cond-lines-of cdr)

(define *cond
  (lambda (e table)
    (evcon (cond-lines-of e) table)))

(define evlis
  (lambda (args table)
    (cond ((null? args) '())
          (else (cons (meaning (car args) table)
                      (evlis (cdr args) table))))))

(define function-of car)
(define arguments-of cdr)

(define *application
  (lambda (e table)
    (apply (meaning (function-of e) table)
           (evlis (arguments-of e) table))))

(define primitive?
  (lambda (l)
    (eq? (first l) 'primitive)))

(define non-primitive?
  (lambda (l)
    (eq? (first l) 'non-primitive)))

(define apply
  (lambda (fun vals)
    (cond ((primitive? fun)
           (apply-primitive (second fun) vals))
          ((non-primitive? fun)
           (apply-closure (second fun) vals))
          (else (display "Error occured in 'apply'!")))))

(define :atom?
  (lambda (x)
    (cond ((atom? x) #t)
          ((null? x) #f)
          ((eq? (car x) 'primitive) #t)
          ((eq? (car x) 'non-primitive) #t)
          (else #f))))

(define apply-primitive
  (lambda (name vals)
    (cond ((eq? name 'cons)  (cons (first vals) (second vals)))
          ((eq? name 'car)   (car (first vals)))
          ((eq? name 'cdr)   (cdr (first vals)))
          ((eq? name 'null?) (null? (first vals)))
          ((eq? name 'eq?)   (eq? (first vals) (second vals)))
          ((eq? name 'atom?) (:atom? (first vals)))
          ((eq? name 'zero?) (= (first vals) 0))
          ((eq? name 'add1)  (+ 1 (first vals)))
          ((eq? name 'sub1)  (- (first vals) 1))
          ((eq? name '+)     (+ (first vals) (second vals)))
          ((eq? name '-)     (- (first vals) (second vals)))
          ((eq? name '*)     (* (first vals) (second vals)))
          ((eq? name '/)     (/ (first vals) (second vals)))
          ((eq? name '=)     (= (first vals) (second vals)))
          ((eq? name 'begin)   (second vals))
          ((eq? name 'display) (display (first vals)))
          ((eq? name 'number?) (number? (first vals)))
          (else (display "Unknown primitive function.")))))

(define apply-closure
  (lambda (closure vals)
    (meaning (body-of closure)
             (extend-table (new-entry (formals-of closure) vals)
                           (table-of closure)))))

(display "((lambda (x) (add1 x)) 2)=")
(display (value '((lambda (x) (add1 x)) 2))) (newline)
(display "30!=")
(display (value '(((lambda (S)
                     ((lambda (x) (S (lambda (y) ((x x) y))))
                      (lambda (x) (S (lambda (y) ((x x) y))))))
                   (lambda (f)
                     (lambda (n)
                       (cond ((= n 0) 1)
                             (else (* n (f (- n 1)))))))) 30)))

`,
// testcase 6
`(display "70! = ")
(newline)
(define fac-cps
(lambda (cont)
  (cont (lambda (n)
          (lambda (k)
            ((lambda (cont)
               ((lambda (cont)
                  ((lambda (cont) (cont (lambda (x y) (lambda (k) (k (= x y)))))) ; 内置相等判断
                   (lambda (node0)
                     ((node0 0 n)
                      (lambda (res) (cont res))))))
                (lambda (p-res)
                  (if p-res
                      ((lambda (cont) (cont 1))
                       cont)
                      ((lambda (cont)
                         ; 以下仅仅是对每个AST节点进行简单的遍历CPST/重命名,并未体现求值顺序，可以理解成并行的
                         ((lambda (cont) (cont (lambda (x y) (lambda (k) (k (* x y)))))) (lambda (node0) ; 内置乘法
                         ( fac-cps                                                       (lambda (node1) ; 递归调用(重命名后的)
                         ((lambda (cont) (cont (lambda (x y) (lambda (k) (k (- x y)))))) (lambda (node2) ; 内置减法
                         ; 从这里开始体现求值顺序,几乎等于是 A-Normal Form
                         ((node2 n 1)    (lambda (res2)
                         ((node1 res2)   (lambda (res1)
                         ((node0 n res1) (lambda (res)
                         ; 最后执行总的continuation
                         ( cont res))))))))))))))
                       cont)))))
             (lambda (m) (k m))))))))

(((fac-cps (lambda (x) x)) 70) (lambda (x) (display x)))

`,
// testcase 7
`;; Yin-yang puzzle
;(((lambda (x) (display "@") x) (call/cc (lambda (k) k)))
; ((lambda (x) (display "*") x) (call/cc (lambda (k) k))))

;; Continuation-passing style Yin-yang puzzle
(
(lambda (cont)
  ((lambda (cont)
     ((lambda (cont)
        (cont (lambda (x)
                (lambda (k)
                  ((lambda (cont) (begin (display "@") (cont x)))
                   (lambda (m) (k m)))))))
      (lambda (m-res)
        ((lambda (k) (cont k))
         (lambda (n-res)
           ((m-res n-res)
            (lambda (a) (cont a))))))))
   (lambda (m-res)
        ((lambda (cont)
           ((lambda (cont)
              (cont (lambda (x)
                      (lambda (k)
                        ((lambda (cont) (begin (display "*") (cont x)))
                         (lambda (m) (k m)))))))
            (lambda (m-res)
              ((lambda (k) (cont k))
               (lambda (n-res)
                 ((m-res n-res)
                  (lambda (a) (cont a))))))))
         (lambda (n-res)
              ((m-res n-res)
               (lambda (a) (cont a))))))))
(lambda (x) x))
`,
// testcase 8
`;; 计算2的65536次幂
;; 见https://www.zhihu.com/question/66242557/answer/241020508
(define power
  (lambda (base exp init)
    (cond ((= exp 0) init)
          ((= 0 (% exp 2)) (power (* base base) (/ exp 2) init))
          (else (power base (- exp 1) (* base init))))))

(display (power 2 65536 1))
`,
// testcase 9
`;; 丘奇编码
;; https://en.wikipedia.org/wiki/Church_encoding

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 布尔值
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define SHOWBOOL
  (lambda (b)
    (b #t #f)))

(define @true  (lambda (x y) x))
(define @false (lambda (x y) y))

(define NOT
  (lambda (bool)
    (bool @false @true)))

(define AND
  (lambda (boolx booly)
    (boolx booly boolx)))

(define OR
  (lambda (boolx booly)
    (boolx boolx booly)))

(define IS_ZERO
  (lambda (n)
    (n (lambda (x) @false) @true)))

(define IF
  (lambda (p x y)
    (p x y)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 自然数
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define SHOWNUM
  (lambda (n)
    (n (lambda (x) (+ x 1)) 0)))

(define NUM_TO_LAMBDA
  (lambda (number)
    (cond ((= number 0) @0)
          (else (INC (NUM_TO_LAMBDA (- number 1)))))))

(define @0 (lambda (f a) a))

(define @1 (lambda (f a) (f a)))

(define INC
  (lambda (n)
    (lambda (f a)
      (f (n f a)))))

(define ADD
  (lambda (m n)
    (m INC n)))

;Curried-ADD - for function MUL
(define ADD-c
  (lambda (m)
    (lambda (n)
      (m INC n))))

(define MUL
  (lambda (m n)
    (n (ADD-c m) @0)))

;Curried-MUL - for function POW
(define MUL-c
  (lambda (m)
    (lambda (n)
      (n (ADD-c m) @0))))

(define POW
  (lambda (m n)
    (n (MUL-c m) @1)))

;some paticular numbers
(define @2 (lambda (f a) (f (f a))))
(define @3 (lambda (f a) (f (f (f a)))))
(define @4 (lambda (f a) (f (f (f (f a))))))
(define @5 (lambda (f a) (f (f (f (f (f a)))))))
(define @6 (lambda (f a) (f (f (f (f (f (f a))))))))
(define @7 (lambda (f a) (f (f (f (f (f (f (f a)))))))))
(define @8 (lambda (f a) (f (f (f (f (f (f (f (f a))))))))))
(define @9 (lambda (f a) (f (f (f (f (f (f (f (f (f a)))))))))))
(define @10 (lambda (f a) (f (f (f (f (f (f (f (f (f (f a))))))))))))
(define @11 (lambda (f a) (f (f (f (f (f (f (f (f (f (f (f a)))))))))))))
(define @12 (lambda (f a) (f (f (f (f (f (f (f (f (f (f (f (f a))))))))))))))
(define @13 (lambda (f a) (f (f (f (f (f (f (f (f (f (f (f (f (f a)))))))))))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 有序对和减法
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define PAIR
  (lambda (x y)
    (lambda (f)
      (f x y))))

(define LEFT
  (lambda (pair)
    (pair @true)))

(define RIGHT
  (lambda (pair)
    (pair @false)))

;substraction
(define SLIDE
  (lambda (pair)
    (PAIR (RIGHT pair) (INC (RIGHT pair)))))

(define DEC
  (lambda (n)
    (LEFT (n SLIDE (PAIR @0 @0)))))

(define SUB
  (lambda (m n)
    (n DEC m)))

;comparation
(define IS_LE
  (lambda (num1 num2)
    (IS_ZERO (SUB num1 num2))))

(define IS_EQUAL
  (lambda (num1 num2)
    (AND (IS_LE num1 num2) (IS_LE num2 num1))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; Z组合子（Y组合子的应用序求值版本）
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;Y-Combinator
;注意：目标函数应使用单参形式
(define Y
  (lambda (S)
    ( (lambda (x) (S (lambda (y) ((x x) y))))
      (lambda (x) (S (lambda (y) ((x x) y)))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 整数（暂时没有用）
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define INT
  (lambda (neg pos)
    (PAIR neg pos)))

(define *ZERO
  (PAIR @0 @0))

(define IS*ZERO
  (lambda (int)
    (AND (IS_ZERO (LEFT  int))
         (IS_ZERO (RIGHT int)))))

;整数标准化，也就是简化成至少一边为0的形式，这样就可以实现绝对值函数和符号函数了
(define *NORMALIZE
  (lambda (int)
    (IF (IS_LE (LEFT int) (RIGHT int))
        (INT @0 (SUB (RIGHT int) (LEFT int)))
        (INT (SUB (LEFT int) (RIGHT int)) @0))))

(define *ABS
  (lambda (int)
    (IF (IS_ZERO (LEFT (*NORMALIZE int)))
        (RIGHT (*NORMALIZE int))
        (LEFT  (*NORMALIZE int)))))

;@true +; @false -
(define *SGN
  (lambda (int)
    (IS_ZERO (LEFT (*NORMALIZE int)))))

(define SHOWINT
  (lambda (int)
    (cond ((SHOWBOOL (*SGN int)) (display "+") (SHOWNUM (*ABS int)))
          (else                  (display "-") (SHOWNUM (*ABS int))))))

(define *ADD
  (lambda (i j)
    (INT (ADD (LEFT  i) (LEFT  j))
         (ADD (RIGHT i) (RIGHT j)))))

(define *MUL
  (lambda (i j)
    (INT (ADD (MUL (LEFT i) (LEFT j)) (MUL (RIGHT i) (RIGHT j)))
         (ADD (MUL (LEFT i) (RIGHT j)) (MUL (RIGHT i) (LEFT j))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 阶乘函数（组合子测试）
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(display "6!=")
(display
(SHOWNUM 
((Y (lambda (f)
     (lambda (n)
       (IF (IS_EQUAL n @0)
           @1
           (lambda (x y) ((MUL n (f (DEC n)))
                          x
                          y))
       ))))
 @6)
)
)
(newline)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; 列表（二叉树）
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define NULL_LIST
  (PAIR @true @true))

(define IS_NULLLIST
  (lambda (list)
    (LEFT list)))

(define CONS
  (lambda (e l)
    (PAIR @false (PAIR e l))))

(define CAR
  (lambda (list)
    (LEFT (RIGHT list))))

(define CDR
  (lambda (list)
    (RIGHT (RIGHT list))))

(define COUNT
  (lambda (l)
    ((Y (lambda (f)
          (lambda (list)
            (IF (NOT (IS_NULLLIST list))
                (lambda (x y) ((INC (f (CDR list)))
                               x
                               y))
                @0))))
     l)))

(display "Count(1,2,3,3,3)=")
(display (SHOWNUM (COUNT (CONS @1 (CONS @2 (CONS @3 (CONS @3 (CONS @3 NULL_LIST))))))))
(newline)

(define SHOWLIST
  (lambda (list)
    (cond ((SHOWBOOL (IS_NULLLIST list)) (display "N)"))
          (else (begin
                  (display (SHOWNUM (CAR list)))
                  (display ",")
                  (SHOWLIST (CDR list)))))))

(display "List=(")
(SHOWLIST (CONS @1 (CONS @2 (CONS @3 (CONS @4 (CONS @5 NULL_LIST))))))
(newline)

;闭区间
;注意Currying
(define RANGE
  (lambda (m n)
    (((Y (lambda (f)
          (lambda (a)
            (lambda (b)
            (IF (IS_LE a b)
                (lambda (z) ((CONS a ((f (INC a)) b))
                               z ))
                NULL_LIST
            )))))m)n)))

(COUNT (RANGE @2 @4))
(display "Range(2,7)=(")
(SHOWLIST (RANGE @2 @7))
(newline)


;高阶函数Fold和Map
(define FOLD
  (lambda (list init func)
    ((((Y (lambda (f)
          (lambda (l)
            (lambda (i)
              (lambda (g)
                (IF (IS_NULLLIST l)
                    i
                    (lambda (x y) (
                      (g (CAR l) (((f (CDR l)) i) g))
                      x y))
                ))))))list)init)func)))

(define MAP
  (lambda (list func)
    (((Y (lambda (f)
           (lambda (l)
             (lambda (g)
               (IF (IS_NULLLIST l)
                   NULL_LIST
                   (lambda (x) ((CONS (g (CAR l)) ((f (CDR l)) g)) x))
                )))))list)func)))

; 投影函数（常用）
(define PROJ
  (lambda (list index)
    ((((Y (lambda (f)
            (lambda (l)
              (lambda (i)
                (lambda (j)
                  (IF (IS_EQUAL i j)
                      (CAR l)
                      (lambda (x y) ((((f (CDR l)) i) (INC j)) x y))
                   ))))))list)index)@0)))

(display "Fold(1:10,0,ADD)=")
(display (SHOWNUM (FOLD (RANGE @1 @10) @0 ADD)))
(newline)

(display "MAP(1:9,0,INC)=(")
(SHOWLIST (MAP (RANGE @1 @9) INC))
(newline)

(display "Proj(2:10,5)=")
(display (SHOWNUM (PROJ (MAP (RANGE @1 @9) INC) @5)))
(newline)
`,
// testcase 10
`;; 尾递归优化演示
(define sum
  (lambda (n s)
    (if (= n 0)
        s
        (sum (- n 1) (+ n s)))))
;; 开尾递归优化
(display "Sum(1~100000) = ")
(display (sum 100000 0))

`,
// testcase 11
`;; 侯世达的雌雄序列
;; https://en.wikipedia.org/wiki/Hofstadter_sequence
(define F
  (lambda (n)
    (if (= n 0)
        1
        (- n (M (F (- n 1)))))))
(define M
  (lambda (n)
    (if (= n 0)
        0
        (- n (F (M (- n 1)))))))
(define test
  (lambda (f n)
    (begin
      (define i 0)
      (while (<= i n)
             (begin (display (f i))
                    (display " ")
                    (set! i (+ i 1)))))))

(display "F(0~10): ")(test F 10)
(newline)
(display "M(0~10): ")(test M 10)

`,

// testcase12
`

(define INIT 100)
(define fac
  (lambda (n)
    (call/cc
     (if (= n 0)
         1
         (if (= n 2)
             (RETURN INIT)
             (* n (fac (- n 1))))))))

(display (fac 5))

`,

];


const TESTCASEv4 = [
`;; call/cc的试验性实现
;; 2018.01.13-14
;; 预期结果：“中止~”

((lambda ()
  (display
   (call/cc (lambda (RETURN) (begin
              (define free "TOP")
              (define A
                (lambda (RETURN)
                  (display free)))
              (define B
                (lambda (free)
                  (A (RETURN "中止~"))))
              (B "Context")
              (display "这是后续过程")))))))
`,

`;; 2019.1.17
;; 预期结果：0

(define product
  (lambda (ls)
    (call/cc
      (lambda (RETURN) (begin
        (define f
          (lambda (ls)
            (cond ((null? ls) 1)
                  ((= (car ls) 0) (RETURN 0))
                  (else (* (car ls) (f (cdr ls)))))))
        (f ls))))))

(display (product '(2 3 4 5 6 7 0 8 9 10)))
`,
SAMPLE[1],
SAMPLE[2],
SAMPLE[3],
SAMPLE[4],
SAMPLE[5],
SAMPLE[6],
SAMPLE[7],
SAMPLE[8],
SAMPLE[9],

`;; set!测试
;; 期望结果：
;; 10的阶乘（CPS）：3628800
;; fac调用次数：11
;; 闭包（continuation）的调用次数：10

(define counter 0)
(define closure-counter 0)
(display "10的阶乘（CPS）：")
(define fac
  (lambda (n cont)
    (begin (set! counter (+ 1 counter))
           (if (= n 0)
               (cont 1)
               (fac (- n 1)
                    (lambda (res)
                      (begin (set! closure-counter (+ 1 closure-counter))
                             (cont (* res n)))))))))
(display (fac 10 (lambda (x) x)))
(newline)
(display "fac调用次数：")
(display counter)
(newline)
(display "闭包（continuation）的调用次数：")
(display closure-counter)`,

`;; 生成器示例
;; 用于演示一等Continuation
;; 说明：本解释器暂时没有将顶级作用域特殊看待，导致捕获Continuation时会同时捕获到后续的generator调用，形成递归。因此引入了判断，使得演示程序能够在10轮递归之内结束。
;; 预期结果：输出1~10

(define count 0)
(define generator #f)
(define g
  (lambda ()
    ((lambda (init) (begin
      (call/cc (lambda (Kont)
                 (set! generator Kont)))
      (set! init (+ init 1))
      (set! count init)
      init)) 0)))

(display (g))
(newline)
(if (>= count 10)
    100
    (display (generator)))`,

`;; 仅使用call/cc实现无限循环
;; 会一直运行到爆栈
;; 预期结果：输出0~爆栈

(define invoke-self
  (lambda (f)
    ((lambda (x)
       ((x f) 0))
     (call/cc (lambda (k) k)))
  ))

(invoke-self (lambda (f)
               (lambda (n) (begin
                 (display n) (display " ")
                 ((f f) (+ n 1))))))
`,

`;; 输出一个“Hey”
;; 例子来源：https://www.scheme.com/tspl4/further.html
(display
 (((call/cc (lambda (x) x))
  (lambda (x) x)) "Hey"))
`,

`;; 阴阳谜题 2019.1.22
;; 用于验证一等Continuation和call/cc的实现
;; 此程序的详细解析请参考本博客文章《阴阳谜题解析》
;; 临时设定解释器最大tick数为10000，防止程序卡住
#MAX_TICK_NUM = 10000
(((lambda (x) (begin (display "@") x)) (call/cc (lambda (k) k)))
 ((lambda (x) (begin (display "*") x)) (call/cc (lambda (k) k))))`,

``,

``,
];

    editor.setValue(SAMPLE[0]);

    var currentTestCaseNumber = -1;
    var currentVersion = "V3";

    function test(x, version, cont) {
        flushIO();
        NODE_MEMORY = new Array();
        NODE_MEMORY_POINTER = 0;
        NODE_STACK = new Array();
        CLOSURE_MEMORY = new Array();
        CLOSURE_MEMORY_POINTER = 0;
        let code = '';
        try {
            if(x < 0 || x === false) {
                code = editor.getValue();
            }
            else if(version === "V3"){
                currentTestCaseNumber = x;
                currentVersion = "V3";
                editor.setValue(SAMPLE[x]);
                return;
            }
            else if(version === "V4"){
                currentTestCaseNumber = x;
                currentVersion = "V4";
                editor.setValue(TESTCASEv4[x]);
                return;
            }
            // 删除注释
            code = code.replace(/\;.*\n/gi, '');
            // 处理解释器指令
            
            let interpreterConfig = new Object();
            
            code = (function preprocess(code) {
                let lines = code.split('\n');
                let schemecode = new Array();
                for(let i = 0; i < lines.length; i++) {
                    let line = lines[i];
                    if(/^\s*\#[A-Za-z\_\-]+\s*\=\s*[A-Za-z0-9]+\s*$/.test(line)) {
                        let fields = line.split('=');
                        let key = fields[0].trim().substring(1); // 字段名
                        let value = fields[1].trim(); // 等号后面的值
                        interpreterConfig[key] = (isNaN(parseInt(value))) ? value.toString() : parseInt(value);
                    }
                    else {
                        schemecode.push(line);
                    }
                }
                return schemecode.join('\n');
            })(code);

            // 顶级闭包
            code = '((lambda () (begin ' + code + ')))';
            
            // 词法分析
            let tokens = Lexer(code);
            // 语法分析
            Parser(tokens);
            // 对AST进行柯里化
            // Curry(0);
            // quote预处理
            dealQuote();
            // 尾调用分析
            TailRecursionAnalysis();

            // 变量重命名
            // variableRename();

            console.warn(`======== AST节点 ========`);
            console.log(NODE_MEMORY);

            // 开始求值
            console.warn(`======== 解释器输出 ========`);
            console.time("执行计时");
            let startTime = new Date();
            let res = null;
            if(version === "V4") {
                res = MainLoop(interpreterConfig);
            }
            else if(version === "V3"){
                res = Run();
            }
            else {
                if(currentVersion === "V4") {
                    res = MainLoop(interpreterConfig);
                }
                else if(currentVersion === "V3"){
                    res = Run();
                }
            }
            let finishTime = new Date();
            console.timeEnd("执行计时");
            if(x < 0 || x === false) {
                document.getElementById('test_result').innerHTML = '<pre style="margin: 10px 0 0 0;"><code><span style="color:#aaaaaa;">运行时间：' + (finishTime-startTime).toString() + 'ms</span>\n'+ /*nodeToString(res)*/readIO(STDOUT) + '</code></pre>';
            }
            else {
                alert(readIO(STDOUT));
            }
            console.warn(`======== 闭包链 ========`);
            console.log(CLOSURE_MEMORY);
            console.warn(`======== 求值结果 ========`);
            console.log(nodeToString(res));
        }
        catch(e) {
            // console.log(NODE_MEMORY);
            console.warn(`======== 闭包链(debug) ========`);
            console.log(CLOSURE_MEMORY);
            document.getElementById('test_result').innerHTML = '<pre style="margin: 10px 0 0 0;"><code>' + /*nodeToString(res)*/readIO(STDOUT) + '\n<span style="color:red;">' + e.toString() + '</span></code></pre>';
            console.error(e);
        }
        setTimeout(cont, 50);
    }
    function startExec(cont) {
        $('#test').attr('disabled', 'disabled');
        $('#test').html('正在执行');
        setTimeout(cont, 50);
    }
    function endExec() {
        $('#test').removeAttr('disabled');
        $('#test').html('执行');
    }
    document.getElementById('clear').addEventListener('click', ()=>{editor.setValue('');});

    // V3 Test
    document.getElementById('testcase0').addEventListener('click', ()=>{test(0, "V3");});
    document.getElementById('testcase1').addEventListener('click', ()=>{test(1, "V3");});
    document.getElementById('testcase2').addEventListener('click', ()=>{test(2, "V3");});
    document.getElementById('testcase3').addEventListener('click', ()=>{test(3, "V3");});
    document.getElementById('testcase4').addEventListener('click', ()=>{test(4, "V3");});
    document.getElementById('testcase5').addEventListener('click', ()=>{test(5, "V3");});
    document.getElementById('testcase6').addEventListener('click', ()=>{test(6, "V3");});
    document.getElementById('testcase7').addEventListener('click', ()=>{test(7, "V3");});
    document.getElementById('testcase8').addEventListener('click', ()=>{test(8, "V3");});
    document.getElementById('testcase9').addEventListener('click', ()=>{test(9, "V3");});
    document.getElementById('testcase10').addEventListener('click', ()=>{test(10, "V3");});
    document.getElementById('testcase11').addEventListener('click', ()=>{test(11, "V3");});

    // V4 Test
    document.getElementById('v4test0').addEventListener('click', ()=>{test(0, "V4");});
    document.getElementById('v4test1').addEventListener('click', ()=>{test(1, "V4");});
    document.getElementById('v4test2').addEventListener('click', ()=>{test(2, "V4");});
    document.getElementById('v4test3').addEventListener('click', ()=>{test(3, "V4");});
    document.getElementById('v4test4').addEventListener('click', ()=>{test(4, "V4");});
    document.getElementById('v4test5').addEventListener('click', ()=>{test(5, "V4");});
    document.getElementById('v4test6').addEventListener('click', ()=>{test(6, "V4");});
    document.getElementById('v4test7').addEventListener('click', ()=>{test(7, "V4");});
    document.getElementById('v4test8').addEventListener('click', ()=>{test(8, "V4");});
    document.getElementById('v4test9').addEventListener('click', ()=>{test(9, "V4");});
    document.getElementById('v4test10').addEventListener('click', ()=>{test(10, "V4");});
    document.getElementById('v4test11').addEventListener('click', ()=>{test(11, "V4");});
    document.getElementById('v4test12').addEventListener('click', ()=>{test(12, "V4");});
    document.getElementById('v4test13').addEventListener('click', ()=>{test(13, "V4");});
    document.getElementById('v4test14').addEventListener('click', ()=>{test(14, "V4");});
    document.getElementById('v4test15').addEventListener('click', ()=>{test(15, "V4");});

    document.getElementById('test').addEventListener('click', ()=>{startExec(()=>{test(-1, null, ()=>{endExec();});});});

    document.getElementById('reload').style.display = "none";
};
