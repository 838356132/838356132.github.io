#!title:    Nagao串频统计算法
#!date:     2017-10-16
#!authors:  Mikukonai
#!cover:    
#!type:     C
#!tags:     

#!content

<button id="nagao" class="MikumarkButton" style="width:100%;">串频统计</button>

# 引言

词是全文数据中的短小字符序列。下述算法是京都大学的Makoto Nagao于1994年在参考文献[1]中提出的，该算法可以统计全文数据中所有可能的短串及其出现频率。

# 算法说明

1.将文本全文（保留标点、换行等分隔符）读入线性表，形成字符串`S[1:Len]`，字符串长度为`Len`。

```
index  1 2 3 4 5 6 7
    S  庭院深深深几许
```

2.构造指针表`P[1:Len]`：`P[i]`的内容是`i`，代表`S`的后缀子串`S[i:Len]`。

```
index  1 2 3 4 5 6 7
    S  庭院深深深几许

 P[1]  庭院深深深几许
 P[2]    院深深深几许
 P[3]      深深深几许
 P[4]        深深几许
 P[5]          深几许
 P[6]            几许
 P[7]              许
```

3.对所有后缀子串按字典序排序，得到排序后的指针表`PO[j]`。排序采用快速排序，时间复杂度可控制在$O({Len} \log ({Len}))$。

```
     index  1 2 3 4 5 6 7
         S  庭院深深深几许

PO[1] P[6]  几许
PO[2] P[5]  深几许
PO[3] P[4]  深深几许
PO[4] P[3]  深深深几许
PO[5] P[1]  庭院深深深几许
PO[6] P[7]  许
PO[7] P[2]  院深深深几许
```

4.构造“公共前缀串长”表`C[1:Len]`：`C[i]`的内容是`PO[i]`与`PO[i-1]`的①最长②相同③前缀串④的**长度**。特别地，`P[1]`取0。

```
        index  1 2 3 4 5 6 7
            S  庭院深深深几许

C[1] 0  PO[1]  几许
C[1] 0  PO[2]  深几许
C[1] 1  PO[3]  深深几许
C[1] 2  PO[4]  深深深几许
C[1] 0  PO[5]  庭院深深深几许
C[1] 0  PO[6]  许
C[1] 0  PO[7]  院深深深几许
```

5.开始进行串频统计。操作步骤如下：

```
数据结构：S、PO、C，以及存放串频的结果Map
输入：候选词长度N
输出：串频结果Map
1. 取PO[1]的N前缀PN[1]，将<PN[1],1>放入Map；
2. 取PO[i]的N前缀PN[i]：
     若C[i]≥N，则将<PN[i],++>放入Map；（++是自增1函数）
     若C[i]<N，则将<PN[i],1>放入Map；
3. 反复执行2，直到遍历完PO表。
4. 此时得到的Map就是词频统计结果。
```

输入不同的N值，多次执行此步骤，即可得到对“庭院深深深几许”的词频统计结果：

```
庭院   1
院深   1
深深   2
深几   1
几许   1
许     1
庭院深 1
院深深 1
……
```

# 参考文献

+ Nagao M, Mori S. A New Method of N-gram Statistics for Large Number of n and Automatic Extraction of Words and Phrases from Large Text Data of Japanese[J]. Proceedings of Coling, 1994, 1:611-615.
+ 作者不详. Nagao的串频统计算法\[Z/OL\]. [https://wenku.baidu.com/view/9545a9d24431b90d6d85c727.html](), 2015.


#!style

#!script

#!script:./ts/nagao.js
#!script:./ts/dict.js

$('#nagao').click(function() {
    let nw = newword(text);
    // 过滤掉已经在词典的、凝固度小于100的、左右熵小于1.0的词
    let nnw = new Object();
    for(let t in nw) {
        if(!(dict.indexOf(t) >= 0) && t.length >= 2) {
            // if(nw[t]['ent'] >= 1.0 && nw[t]['solidity'] >= 100) {
                nnw[t] = nw[t];
            // }
        }
    }
    console.log(nnw);
});
