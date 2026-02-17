const SIZE = 8;
let board = [];
let currentPlayer = 1; // 1: 先手(減算), 2: 後手(加算)
let currentElement = 'r'; // 'r' または 'b'
let turnCount = 1;

const boardEl = document.getElementById('board');

function initBoard() {
    turnCount = 1;
    board = Array.from({ length: SIZE }, () => 
        Array.from({ length: SIZE }, () => ({ r: 0, b: 0, active: false })) // activeを追加
    );

    // 初期配置: 中央4マスのみ active にする
    // (4,4) と (5,5) は紫(1,1)
    board[3][3] = { r: 1, b: 1, active: true };
    board[4][4] = { r: 1, b: 1, active: true };
    // (4,5) と (5,4) は黒(0,0)
    board[3][4] = { r: 0, b: 0, active: true };
    board[4][3] = { r: 0, b: 0, active: true };
    
    decideElement();
    render();
}

function decideElement() {
    currentElement = Math.random() < 0.5 ? 'r' : 'b';
}

function render() {
    boardEl.innerHTML = '';
    let blackCount = 0;
    let purpleCount = 0;

    const validMoves = getValidMoves();

    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            const cellData = board[r][c];
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // 有効な手であればハイライト
            if (validMoves.some(m => m.r === r && m.c === c)) {
                cell.classList.add('valid');
                cell.onclick = () => handleMove(r, c);
            }

            // 石が置かれている(active)場合のみ石を表示
            if (cellData.active) {
                const stone = document.createElement('div');
                stone.className = 'stone ' + getColorName(cellData);
                cell.appendChild(stone);

                if (cellData.r === 0 && cellData.b === 0) blackCount++;
                if (cellData.r === 1 && cellData.b === 1) purpleCount++;
            }
            
            boardEl.appendChild(cell);
        }
    }

    document.getElementById('turn-count').textContent = `ターン: ${turnCount}`;
    document.getElementById('current-player').textContent = currentPlayer === 1 ? "先手 (減算者)" : "後手 (加算者)";
    const elDisplay = document.getElementById('current-element');
    elDisplay.textContent = currentElement === 'r' ? "RED" : "BLUE";
    elDisplay.className = currentElement === 'r' ? 'red' : 'blue';
    document.getElementById('score').textContent = `Black: ${blackCount} | Purple: ${purpleCount}`;
}

function getColorName(data) {
    if (data.r && data.b) return 'purple';
    if (data.r) return 'red';
    if (data.b) return 'blue';
    return 'black';
}

function getValidMoves() {
    const moves = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            // 既に石がある場所には置けない
            if (board[r][c].active) continue;

            // 設置条件：そのマスが今の手番の要素を持っていないこと (R:0 または B:0)
            // 先手・後手共通で、置く瞬間にその要素を1として置くため、元が1だと置けない
            if (board[r][c][currentElement] === 0) {
                if (getFlippableStones(r, c).length > 0) {
                    moves.push({ r, c });
                }
            }
        }
    }
    return moves;
}

function getFlippableStones(row, col) {
    const directions = [
        [-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]
    ];
    let allFlippable = [];

    directions.forEach(([dr, dc]) => {
        let r = row + dr;
        let c = col + dc;
        let temp = [];

        while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
            const cell = board[r][c];
            // 石がない場所（activeでない）に突き当たったら終了
            if (!cell.active) break;

            if (currentPlayer === 1) { // 先手(減算者): 間の石の要素が1である必要がある
                if (cell[currentElement] === 1) {
                    temp.push({ r, c });
                } else {
                    break;
                }
            } else { // 後手(加算者): 間の石の要素が0である必要がある
                if (cell[currentElement] === 0) {
                    temp.push({ r, c });
                } else {
                    break;
                }
            }
            
            r += dr;
            c += dc;

            // 挟んだ端の判定
            if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
                const targetCell = board[r][c];
                // 端の石が active かつ 指定要素を含んでいる(1である)こと
                if (targetCell.active && targetCell[currentElement] === 1 && temp.length > 0) {
                    allFlippable = allFlippable.concat(temp);
                    break;
                }
            }
        }
    });
    return allFlippable;
}

function handleMove(r, c) {
    const flippable = getFlippableStones(r, c);
    
    // 石を設置
    board[r][c].active = true;
    board[r][c][currentElement] = 1; // 置いた瞬間はその要素を持つ
    
    // 挟んだ要素を変化（1→0 または 0→1）
    flippable.forEach(pos => {
        board[pos.r][pos.c][currentElement] = (currentPlayer === 1 ? 0 : 1);
    });

    // ターン更新処理
    turnCount++;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    decideElement();
    
    render();
    checkGameOver();
}

function checkGameOver() {
    if (getValidMoves().length === 0) {
        // パス判定
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        if (getValidMoves().length === 0) {
            const results = calculateFinalScore();
            alert(`ゲーム終了！\nターン: ${turnCount-1}\nBlack(0,0): ${results.black}\nPurple(1,1): ${results.purple}\n勝者: ${results.winner}`);
        } else {
            alert("置ける場所がないためパスします。");
            decideElement(); // 要素を振り直して再描画
            render();
        }
    }
}

function calculateFinalScore() {
    let b = 0, p = 0;
    board.forEach(row => row.forEach(cell => {
        if (cell.active) {
            if (cell.r === 0 && cell.b === 0) b++;
            if (cell.r === 1 && cell.b === 1) p++;
        }
    }));
    let winner = "引き分け";
    if (b > p) winner = "Black (先手有利?)";
    if (p > b) winner = "Purple (後手有利?)";
    return { black: b, purple: p, winner: winner };
}

function resetGame() {
    initBoard();
}

initBoard();