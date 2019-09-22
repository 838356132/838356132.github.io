// 遗传算法求解TSP问题
// 2019.04.30

const MAP = [
    [116.46,39.92],
    [117.2,39.13],
    [121.48,31.22],
    [106.54,29.59],
    [91.11,29.97],
    [87.68,43.77],
    [106.27,38.47,24],
    [111.65,40.82,25],
    [108.33,22.84],
    [126.63,45.75],
    [125.35,43.88],
    [123.38,41.8],
    [114.48,38.03],
    [112.53,37.87],
    [101.74,36.56],
    [117,36.65],
    [113.6,34.76],
    [118.78,32.04],
    [117.27,31.86],
    [120.19,30.26],
    [119.3,26.08],
    [115.89,28.68],
    [113,28.21],
    [114.31,30.52],
    [113.23,23.16],
    [121.5,25.05],
    [110.35,20.02],
    [103.73,36.03],
    [108.95,34.27],
    [104.06,30.67],
    [106.71,26.57],
    [102.73,25.04],
    [114.1,22.2],
    [113.33,22.13]
];

const CITY = [
    "北京",  // 0
    "天津",
    "上海",
    "重庆",
    "拉萨",  // 4
    "乌鲁木齐",  // 5
    "银川",
    "呼和浩特",
    "南宁",
    "哈尔滨",
    "长春",  // 10
    "沈阳",
    "石家庄",
    "太原",
    "西宁",  // 14
    "济南",  // 15
    "郑州",
    "南京",
    "合肥",
    "杭州",
    "福州",  // 20
    "南昌",
    "长沙",
    "武汉",
    "广州",
    "台北",  // 25
    "海口",
    "兰州",
    "西安",
    "成都",
    "贵阳",  // 30
    "昆明",
    "香港",
    "澳门"   // 33
];

const MutationProb = 0.008;
const CrossoverProb = 0.2;

// 生成n个点的随机排列
function Shuffle(n) {
    let dict = new Object();
    let seq = new Array();
    let index = Math.floor(Math.random() * n);
    while(seq.length < n) {
        if(!(index in dict)) {
            dict[index] = true;
            seq.push(index);
        }
        index = Math.floor(Math.random() * n);
    }
    return seq;
}

function Individual() {
    this.Gene = Shuffle(MAP.length);
}

Individual.prototype = {
    // 基因的表达：根据基因计算适应度（简单欧氏距离的倒数）
    Decode: function() {
        // 计算环路路程
        function pathLength(path, map) {
            function distance(p1, p2) {
                return Math.sqrt(
                    (p1[0] - p2[0]) * (p1[0] - p2[0])+
                    (p1[1] - p2[1]) * (p1[1] - p2[1])
                );
            }
            let sum = 0;
            for(let i = 1; i < path.length; i++) {
                let p1 = map[path[i-1]];
                let p2 = map[path[ i ]];
                // 加入一些偏好约束
                // 乌市-拉萨优先
                if(path[i-1] === 4 && path[i] === 5 || path[i-1] === 5 && path[i] === 4) {
                    sum += 0.1;
                }
                // 乌市-西宁优先
                else if(path[i-1] === 14 && path[i] === 5 || path[i-1] === 5 && path[i] === 14) {
                    sum += 0.1;
                }
                // 乌市-哈市排除
                else if(path[i-1] === 9 && path[i] === 5 || path[i-1] === 5 && path[i] === 9) {
                    sum += 100000;
                }
                else {
                    sum += distance(p1, p2);
                }
            }
            sum += distance(map[path[0]], map[path[path.length-1]]);
            return sum;
        }
        return (MAP.length / pathLength(this.Gene, MAP));
    },
    // 变异：每一位碱基随机反转
    Mutate: function() {
        let p1 = Math.floor(Math.random() * MAP.length);
        let p2 = Math.floor(Math.random() * MAP.length);
        let temp = this.Gene[p1];
        this.Gene[p1] = this.Gene[p2];
        this.Gene[p2] = temp;
    },
    // 交叉操作
    Crossover: function(that) {
        // 随机选择区段
        let p1 = Math.floor(Math.random() * MAP.length);
        let p2 = Math.floor(Math.random() * MAP.length);
        let pos1 = Math.min(p1, p2);
        let pos2 = Math.max(p1, p2);
        // 先复制一份被交换的片段
        let newThatGene = new Array();
        let newThatGeneDict = new Object();
        for(let i = 0; i < MAP.length; i++) {
            if(i >= pos1 && i <= pos2) {
                newThatGene[i] = this.Gene[i];
                newThatGeneDict[this.Gene[i]] = true;
            }
            else {
                newThatGene[i] = null;
            }
        }
        // 然后选择剩余不重复的碱基按顺序填充进去，得到子代基因
        for(let i = 0; i < MAP.length; i++) {
            if(newThatGene[i] === null) {
                for(let j = 0; j < MAP.length; j++) {
                    let thatBase = that.Gene[j];
                    if(!(thatBase in newThatGeneDict)) {
                        newThatGene[i] = thatBase;
                        newThatGeneDict[thatBase] = true;
                        break;
                    }
                }
            }
        }
        let child = new Individual();
        child.Gene = newThatGene;
        return child;
    },
};

// 快乐的伊甸园
function Eden(popSize) {
    this.popSize = popSize;
    this.Population = new Array();
    this.Fitness = new Array();
    this.TotalFitness = 0;
    this.BestID = 0;
    this.BestFitness = 0;
    // 初始化个体和适应度
    for(let i = 0; i < popSize; i++) {
        this.Population[i] = new Individual();
    }
    this.Evaluate();
}
Eden.prototype = {
    // 适应度评估
    Evaluate: function() {
        let maxValue = Number.MIN_VALUE;
        let maxIndex = 0;
        let totalFitness = 0;
        for(let i = 0; i < this.Population.length; i++) {
            let fit = this.Population[i].Decode();
            this.Fitness[i] = fit;
            totalFitness += fit;
            if(fit >= maxValue) {
                maxValue = fit;  // 优化目标值
                maxIndex = i;    // 局部最优个体
            }
        }
        this.TotalFitness = totalFitness;
        this.BestID = maxIndex;
        this.BestFitness = maxValue;
    },
    // 轮盘赌抽选
    RouletteWheel: function() {
        let totalFitness = this.TotalFitness;
        let pointer = Math.random();
        let position = 0;
        for(let i = 0; i < this.Population.length; i++) {
            position += (this.Fitness[i] / totalFitness);
            if(pointer <= position) {
                return i;
            }
        }
    },
    // 产生下一代
    NextGeneration: function() {
        let newPopulation = new Array();
        // 保留顶级精英
        newPopulation.push(this.Population[this.BestID]);
        // 产生子代
        while(newPopulation.length < this.Population.length) {
            // 挑选人生赢家进行交配
            let p1 = this.RouletteWheel();
            let child = null;
            if(Math.random() <= CrossoverProb) {
                let p2 = this.RouletteWheel();
                child = this.Population[p1].Crossover(this.Population[p2]);
            }
            else {
                child = this.Population[p1];
            }
            // 突变
            if(Math.random() <= MutationProb) {
                child.Mutate();
            }
            newPopulation.push(child);
        }
        this.Population = newPopulation;
    },
    //一轮进化
    Evolve: function() {
        this.Evaluate();
        this.NextGeneration();
        return {
            route: this.Population[this.BestID].Gene,
            distance: MAP.length / this.BestFitness
        };
    }
};

function drawMap(cv, path) {
    cv.Clear();
    for(let i = 0; i < MAP.length; i++) {
        cv.Circle(MAP[i], 0.2, "ff0000");
        cv.Text(CITY[i], MAP[i]);
    }
    let p1 = MAP[path[0]];
    for(let i = 1; i < path.length; i++) {
        let p2 = MAP[path[i]];
        cv.Line(p1, p2, "#0000ff");
        p1 = p2;
    }
    cv.Line(MAP[path[0]], MAP[path[path.length-1]]);
}

function drawStat(cv, history) {
    cv.Clear();
    let p1 = [0, history[0]];
    for(let i = 1; i < history.length; i++) {
        let p2 = [i, history[i]];
        cv.Line(p1, p2, "#0000ff");
        p1 = p2;
    }
    cv.Text(history[history.length-1].toFixed(3).toString(), [10,140]);
}




