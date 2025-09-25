const boardElement = document.getElementById("board");
let board = [];
let selectedSquare = null;
let moveHistory = [];
let showMoves = true;
let flipped = false;

const initialBoard = [
  ["r","n","b","q","k","b","n","r"],
  ["p","p","p","p","p","p","p","p"],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["","","","","","","",""],
  ["P","P","P","P","P","P","P","P"],
  ["R","N","B","Q","K","B","N","R"]
];

const pieces = {
  r:"♜", n:"♞", b:"♝", q:"♛", k:"♚", p:"♟",
  R:"♖", N:"♘", B:"♗", Q:"♕", K:"♔", P:"♙"
};

// Crear tablero
function createBoard() {
  boardElement.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      square.classList.add((row + col) % 2 === 0 ? "light" : "dark");
      square.dataset.row = row;
      square.dataset.col = col;
      const piece = board[row][col];
      square.textContent = piece ? pieces[piece] : "";
      square.addEventListener("click", () => handleSquareClick(row, col));
      boardElement.appendChild(square);
    }
  }
}

// Selección y movimiento
function handleSquareClick(row, col) {
  if (selectedSquare) {
    const [fromRow, fromCol] = selectedSquare;
    if (fromRow === row && fromCol === col) {
      selectedSquare = null;
      createBoard();
      return;
    }
    movePiece(fromRow, fromCol, row, col);
    selectedSquare = null;
    createBoard();
  } else {
    if (board[row][col] !== "") {
      selectedSquare = [row, col];
      if (showMoves) highlightSquare(row, col);
    }
  }
}

function movePiece(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  if (!piece) return;
  moveHistory.push(JSON.parse(JSON.stringify(board)));
  board[toRow][toCol] = piece;
  board[fromRow][fromCol] = "";
}

function highlightSquare(row, col) {
  createBoard();
  const index = row * 8 + col;
  boardElement.children[index].classList.add("highlight");
}

// Controles
function resetGame() {
  board = JSON.parse(JSON.stringify(initialBoard));
  createBoard();
}

function undoMove() {
  if (moveHistory.length > 0) {
    board = moveHistory.pop();
    createBoard();
  }
}

function flipBoard() {
  flipped = !flipped;
  board.reverse();
  board.forEach(row => row.reverse());
  createBoard();
}

function toggleMoves() {
  showMoves = !showMoves;
}

// Inicializar
resetGame();



