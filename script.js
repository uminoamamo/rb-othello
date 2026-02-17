const SIZE = 8;
let board = [];
let currentPlayer = 1; // 1: 先手(減算), 2: 後手(加算)
let currentElement = 'r'; // 'r' または 'b'
let turnCount = 1;
let isBlackMode = false; // 黒モードの状態

const boardEl = document.getElementById('board');

// --- 追加: 黒モードの切り替え ---
function toggleBlackMode() {
    isBlackMode = !isBlackMode;
    const btn = document.getElementById('mode-toggle');
    btn.textContent = `黒モード: ${isBlackMode ? 'ON' : 'OFF'}`;
    btn.style.backgroundColor = isBlackMode ? '#000' : '#444';
    btn.style.borderColor = isBlackMode ? '#ff4757' : '#888';
    render();
}

function initBoard() {
    turnCount = 1;
    currentPlayer = 1;
    board = Array.from({ length: SIZE }, () => 
        Array.from({ length: SIZE }, () => ({ r: 0, b: 0, active: false }))
    );

    board[3][3] = { r: 1, b: 1, active: true };
    board[4][4] = { r: 1, b: 1, active: true };
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
            
            if (validMoves.some(m => m.r === r && m.c === c)) {
                cell.classList.add('valid');
                cell.onclick = () => handleMove(r, c);
            }

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
            if (board[r][c].active) continue;
            // 設置条件：そのマスが今の手番の要素を持っていないこと
            if (board[r][c][currentElement] === 0) {
                if (getFlippableStones(r, c).length > 0) {
                    moves.push({ r, c });
                }
            }
        }
    }
    return moves;
}

let isAdvantageMode = false; // 不利解消モードのフラグ

// 不利解消モードの切り替え
function toggleAdvantageMode() {
    isAdvantageMode = !isAdvantageMode;
    const btn = document.getElementById('adv-toggle');
    btn.textContent = `不利解消モード: ${isAdvantageMode ? 'ON' : 'OFF'}`;
    btn.classList.toggle('on', isAdvantageMode);
    render();
}

// 黒モードの切り替え
function toggleBlackMode() {
    isBlackMode = !isBlackMode;
    const btn = document.getElementById('mode-toggle');
    btn.textContent = `黒モード: ${isBlackMode ? 'ON' : 'OFF'}`;
    btn.classList.toggle('on', isBlackMode);
    render();
}

function getFlippableStones(row, col) {
    const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
    let allFlippable = [];

    directions.forEach(([dr, dc]) => {
        let r = row + dr;
        let c = col + dc;
        let temp = [];
        let furthestAnchor = null;

        if (isAdvantageMode && currentPlayer === 1) {
            // 【不利解消モード】最遠のアンカーを探すロジック
            let potentialFlippable = [];
            while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
                const cell = board[r][c];
                if (!cell.active) break;

                // 減算対象(1)があればストック
                if (cell[currentElement] === 1) {
                    potentialFlippable.push({ r, c });
                    // これが現在の最遠アンカー候補
                    furthestAnchor = { r, c };
                } 
                // 属性0の石が混じっていても、不利解消モードでは「飛び越えて」その先を探す
                // ※ただし石自体は繋がっている（activeである）必要がある
                
                r += dr;
                c += dc;
            }
            if (furthestAnchor) {
                allFlippable = allFlippable.concat(potentialFlippable);
            }
        } else {
            // 【通常モード】連続している石のみを対象とするロジック
            while (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
                const cell = board[r][c];
                if (!cell.active) break;

                if (currentPlayer === 1) { // 減算
                    if (cell[currentElement] === 1) temp.push({ r, c });
                    else break;
                } else { // 加算
                    if (cell[currentElement] === 0) temp.push({ r, c });
                    else break;
                }
                r += dr;
                c += dc;

                if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
                    const target = board[r][c];
                    if (target.active && target[currentElement] === 1 && temp.length > 0) {
                        allFlippable = allFlippable.concat(temp);
                        break;
                    }
                }
            }
        }
    });
    return allFlippable;
}

function handleMove(r, c) {
    const flippable = getFlippableStones(r, c);
    
    board[r][c].active = true;

    // 黒モードの処理
    if (isBlackMode && currentPlayer === 1) {
        board[r][c][currentElement] = Math.random() < 0.5 ? 0 : 1;
    } else {
        board[r][c][currentElement] = 1;
    }
    
    // 反転処理
    flippable.forEach(pos => {
        board[pos.r][pos.c][currentElement] = (currentPlayer === 1 ? 0 : 1);
    });

    turnCount++;
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    decideElement();
    render();
    checkGameOver();
}

function checkGameOver() {
    if (getValidMoves().length === 0) {
        currentPlayer = currentPlayer === 1 ? 2 : 1;
        if (getValidMoves().length === 0) {
            const results = calculateFinalScore();
            alert(`ゲーム終了！\nBlack(0,0): ${results.black}\nPurple(1,1): ${results.purple}\n勝者: ${results.winner}`);
        } else {
            alert("置ける場所がないためパスします。");
            decideElement();
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
    let winner = b === p ? "引き分け" : (b > p ? "Black" : "Purple");
    return { black: b, purple: p, winner: winner };
}

function resetGame() {
    initBoard();
}

initBoard();
