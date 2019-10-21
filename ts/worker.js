function Exp1() {
    function fact(n) {
        let p = 1;
        while(n > 0) {
            p *= n;
            n--;
        }
        return p;
    }
    let count = 1;
    let sum = 1;
    while(true) {
        for(let i = 1; i < 30000; i++) {
            sum += 1 / fact(i);
        }
        postMessage(`第${count}轮：${String(sum)}`);
        sum = 1;
        count++;
    }
}

onmessage = (e) => {
    if(e.data === "start") {
        postMessage("同步过程开始");
        Exp1();
    }
}
