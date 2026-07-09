const boardEl = document.getElementById("board");
const resetBtn = document.getElementById("reset");
const againBtn = document.getElementById("again");
const counterEl = document.getElementById("counter");
let turn = "X";
let cells = [];

// Board state: indices 0..8 represent the cells
const board = Array(9).fill("");
let gameOver = false;
let xWins = 0;
let oWins = 0;
let draws = 0;

// Winning combinations (indices 0-8)
const winningCombos = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function makeBoard() {
  boardEl.innerHTML = "";
  cells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    cell.addEventListener("click", onCellClick);
    cell.textContent = board[i];
    boardEl.appendChild(cell);
    cells.push(cell);
  }
}

function updateCounter() {
  if (!counterEl) return;
  counterEl.textContent = `X: ${xWins} — O: ${oWins} — Draws: ${draws}`;
}

function newRound() {
  for (let i = 0; i < 9; i++) board[i] = "";
  gameOver = false;
  turn = "X";
  makeBoard();
}

function checkWin(bd) {
  for (const combo of winningCombos) {
    const [a, bIdx, c] = combo;
    // ensure the cell is not empty and all three match
    if (bd[a] && bd[a] === bd[bIdx] && bd[a] === bd[c]) {
      return bd[a];
    }
  }
  return null;
}

function onCellClick(e) {
  if (gameOver) return;
  const el = e.currentTarget;
  const idx = Number(el.dataset.index);
  if (board[idx]) return; // already filled

  board[idx] = turn;
  el.textContent = turn;

  const winner = checkWin(board);
  if (winner) {
    gameOver = true;
    if (winner === "X") xWins += 1;
    if (winner === "O") oWins += 1;
    updateCounter();
    setTimeout(() => alert(`${winner} wins!`), 10);
    return;
  }

  // check draw
  if (board.every((cell) => cell)) {
    gameOver = true;
    draws += 1;
    updateCounter();
    setTimeout(() => alert("Draw"), 10);
    return;
  }

  turn = turn === "X" ? "O" : "X";
}

resetBtn.addEventListener("click", () => {
  xWins = 0;
  oWins = 0;
  draws = 0;
  updateCounter();
  newRound();
});

if (againBtn) {
  againBtn.addEventListener("click", () => {
    newRound();
  });
}

updateCounter();
makeBoard();
