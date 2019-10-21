#!title:    Worker测试
#!date:     2019-10-21
#!authors:  Mikukonai
#!cover:    
#!type:     
#!tags:     

#!content

本文仅用于博客框架Worker机制的测试。此机制的目的是将“PA可视化”系列文章中的计算密集型过程丢到Web Worker中运行，避免阻塞博客框架自身。另一个更为重要的目的是，通过Worker机制，博客的SPA框架可以控制文章中的脚本何时中止，从而解决文章视图切出后脚本仍在运行的问题。

目前正在开发中，很可能不可用。

下面的例子是一个使用`while(true){}`反复计算exp(1)的阻塞过程。如果按照常规方式执行此脚本，将导致页面卡住，并且切出文章视图后，计算也不会中止，严重影响体验。但是在下面的例子中，视图加载时，动态地请求所需的脚本，创建Web Worker并运行。Worker通过消息传递机制与主线程通信，主线程使用Worker发回的计算结果来更新DOM。并且，当视图切出时，Worker会被主线程主动中止，不会常驻后台。

<button class="MikumarkButton" id="start">点击执行阻塞的外部脚本，运行在Worker中。</button>

#!style

#!script

#!script:./ts/worker.js

$("#start").click(() => {
    PostMessage("start");
});

OnMessage((msg) => {
    $("#start").html(msg.data);
});
