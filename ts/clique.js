// 极大团与最大团
// 2018.11

function Graph(vertexNumber, adjMatrix) {
    this.VERTEX_NUMBER = vertexNumber;
    this.MATRIX = adjMatrix;
}

// DFS计算团
Graph.prototype.calculateAllCliques = function() {
    var currentClique = new Array();
    var solutions = new Array();

    const DFS = function(i) {
        // 递归出口：所有顶点检查完毕
        if(i >= this.VERTEX_NUMBER) {
            // 收集当前获得的团
            let vert = new Array();
            for(let j = 0; j < this.VERTEX_NUMBER; j++) {
                if(currentClique[j] != 0) {
                    vert.push(j);
                }
            }
            solutions.push(vert);
            return;
        }
        else {
            // 检查顶点i能否与既有团形成团（是否与所有顶点都有边）
            let isClique = true;
            for(let j = 0; j < i; j++) {
                if(currentClique[j] === 1 && this.MATRIX[i][j] === 0) {
                    isClique = false;
                    break;
                }
            }
            // 如果形成团
            if(isClique) {
                currentClique[i] = 1;
                DFS.bind(this, i+1)();
                currentClique[i] = 0;
            }
            // 检查另一个分支
            currentClique[i] = 0;
            DFS.bind(this, i+1)();
        }
    };
    DFS.bind(this, 0)();
    console.log(solutions);
    return solutions;
}

// 求所有极大团
Graph.prototype.calculateMaximalCliques = function() {
    // 将所有平凡团合并起来，最终留下极大团
    const mergeCliques = function(cliques) {
        // 初始化
        let newCliques = new Array();
        for(let c = 0; c < cliques.length; c++) {
            newCliques.push(new Array());
        }
        // 遍历所有平凡团
        for(let i = 0; i < cliques.length; i++) {
            // 如果某个团被标记为null，意味着它已经是某个已经遍历过的团的子图，可以跳过了
            if(newCliques[i] === null) { continue; }

            for(let j = i + 1; j < cliques.length + 1; j++) {
                // 处理最后一个平凡团
                if(j === cliques.length) {
                    newCliques[i] = cliques[i];
                    continue;
                }
                // 如果某个团被标记为null，意味着它已经是某个已经遍历过的团的子图，可以跳过了
                if(newCliques[j] === null) { continue; }

                // 辅助函数：子集判断，即判断第j个团是否是第i个团的超集或者子集，如果是，则只留下大者，即将大者加入newCliques，小者标记为null，小者在后续的遍历过程中会被忽略掉
                Array.prototype.containsAll = function(anotherArray) {
                    if(this.length < anotherArray.length) {
                        return false;
                    }
                    else {
                        for(let i = 0; i < anotherArray.length; i++) {
                            let found = false;
                            for(let j = 0; j < this.length; j++) {
                                if(this[j] === anotherArray[i]) {
                                    found = true; break;
                                }
                            }
                            if(found !== true) {
                                return false;
                            }
                        }
                        return true;
                    }
                }

                if(cliques[i].containsAll(cliques[j])) {
                    newCliques[i] = cliques[i];
                    newCliques[j] = null;
                }
                else if(cliques[j].containsAll(cliques[i])) {
                    newCliques[j] = cliques[j];
                    newCliques[i] = null;
                }
            }
        }
        // 清理掉null
        let result = new Array();
        for(let i = 0; i < newCliques.length; i++) {
            if(newCliques[i] !== null) {
                result.push(newCliques[i]);
            }
        }
        return result;
    };

    let allCliques = this.calculateAllCliques(false);
    return mergeCliques(allCliques);
}


