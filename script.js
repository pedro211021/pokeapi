const board = document.getElementById("board");

// Piezas iniciales en notación simple
const pieces = {
  0: ["♜","♞","♝","♛","♚","♝","♞","♜"],
  1: ["♟","♟","♟","♟","♟","♟","♟","♟"],
  6: ["♙","♙","♙","♙","♙","♙","♙","♙"],
  7: ["♖","♘","♗","♕","♔","♗","♘","♖"]
};

// Generar tablero 8x8
for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    const square = document.createElement("div");
    square.classList.add("square");

    // Colorear casillas
    if ((row + col) % 2 === 0) {
      square.classList.add("white");
    } else {
      square.classList.add("black");
    }

    // Colocar piezas si existen
    if (pieces[row] && pieces[row][col]) {
      square.textContent = pieces[row][col];
      square.draggable = true;
    }

    board.appendChild(square);
  }
}


