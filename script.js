/* script.js - Juego de ajedrez simple */

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const historyEl = document.getElementById('history');
const restartBtn = document.getElementById('restartBtn');
const undoBtn = document.getElementById('undoBtn');

const PIECE_UNICODE = {
  'P':'♙','R':'♖','N':'♘','B':'♗','Q':'♕','K':'♔',
  'p':'♟','r':'♜','n':'♞','b':'♝','q':'♛','k':'♚'
};

let state = {
  board: [],
  turn: 'w', // 'w' or 'b'
  selected: null,
  moves: [],
  history: [],
  snapshots: []
};

// Inicializa posición estándar
function initBoard(){
  // 8x8 matrix with piece codes or null
  state.board = [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];
  state.turn = 'w';
  state.selected = null;
  state.moves = [];
  state.history = [];
  state.snapshots = [];
  saveSnapshot();
  render();
}

function saveSnapshot(){
  const copy = JSON.stringify({board:state.board,turn:state.turn});
  state.snapshots.push(copy);
  if(state.snapshots.length>50) state.snapshots.shift();
}

function undo(){
  if(state.snapshots.length <= 1) return;
  state.snapshots.pop();
  const last = JSON.parse(state.snapshots[state.snapshots.length-1]);
  state.board = last.board;
  state.turn = last.turn;
  state.selected = null;
  state.moves = [];
  state.history.pop();
  render();
}

// Util helpers
function inBounds(r,c){ return r>=0 && r<8 && c>=0 && c<8; }
function cloneBoard(b){
  return b.map(row => row.slice());
}
function algebraic(r,c){
  return String.fromCharCode(97+c) + (8-r);
}

// Render board DOM
function render(){
  boardEl.innerHTML = '';
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const sq = document.createElement('div');
      sq.className = 'square ' + ((r+c)%2? 'dark':'light');
      sq.dataset.r = r; sq.dataset.c = c;
      const piece = state.board[r][c];
      if(piece){
        const span = document.createElement('span');
        span.textContent = PIECE_UNICODE[piece] || piece;
        span.style.fontSize = '34px';
        sq.appendChild(span);
      }
      // Highlight selected / legal moves
      const sel = state.selected;
      if(sel && sel.r==r && sel.c==c) sq.classList.add('highlight');
      else if(state.moves.some(m => m.r==r && m.c==c)){
        sq.classList.add(state.board[r][c] ? 'capture' : 'highlight');
      }
      sq.addEventListener('click', onSquareClick);
      boardEl.appendChild(sq);
    }
  }
  statusEl.textContent = `Turno: ${state.turn === 'w' ? 'White' : 'Black'}` + (isKingInCheck(state.turn) ? ' — Jaque!' : '');
  renderHistory();
}

function renderHistory(){
  historyEl.innerHTML = '';
  state.history.forEach((m,i)=>{
    const li = document.createElement('li');
    li.textContent = `${i+1}. ${m}`;
    historyEl.appendChild(li);
  });
}

// Click handler
function onSquareClick(e){
  const r = parseInt(this.dataset.r), c = parseInt(this.dataset.c);
  const piece = state.board[r][c];
  if(state.selected){
    // If clicked on a legal move -> do move
    const move = state.moves.find(m => m.r===r && m.c===c);
    if(move){
      makeMove(state.selected.r, state.selected.c, r, c);
      state.selected = null;
      state.moves = [];
      render();
      return;
    }
    // Otherwise select the clicked piece if it's player's
    if(piece && isOwnPiece(piece)){
      state.selected = {r,c};
      state.moves = legalMovesFor(r,c);
      render();
      return;
    }
    // Deselect
    state.selected = null;
    state.moves = [];
    render();
    return;
  } else {
    // no selection yet -> pick piece if player's
    if(piece && isOwnPiece(piece)){
      state.selected = {r,c};
      state.moves = legalMovesFor(r,c);
      render();
    }
  }
}

function isOwnPiece(piece){
  return (state.turn==='w' && piece === piece.toUpperCase()) || (state.turn==='b' && piece === piece.toLowerCase());
}

// Make move and handle capture/promotion
function makeMove(r1,c1,r2,c2){
  const piece = state.board[r1][c1];
  if(!piece) return;
  // apply
  const captured = state.board[r2][c2];
  state.board[r2][c2] = piece;
  state.board[r1][c1] = null;

  // Promotion: pawn reaching last rank -> queen
  if(piece === 'P' && r2 === 0) state.board[r2][c2] = 'Q';
  if(piece === 'p' && r2 === 7) state.board[r2][c2] = 'q';

  const moveText = `${piece}@${algebraic(r1,c1)}→${algebraic(r2,c2)}${captured ? ' x'+captured : ''}`;
  state.history.push(moveText);

  // change turn
  state.turn = state.turn === 'w' ? 'b' : 'w';
  saveSnapshot();
}

// Generate legal moves for piece at r,c (filters out moves leaving king in check)
function legalMovesFor(r,c){
  const piece = state.board[r][c];
  if(!piece) return [];
  const raw = generateMoves(piece,r,c, state.board);
  // Filter moves that would leave own king in check
  const legal = raw.filter(m=>{
    const b2 = cloneBoard(state.board);
    b2[m.r][m.c] = b2[r][c];
    b2[r][c] = null;
    // handle promotion simulation
    if(b2[m.r][m.c] === 'P' && m.r===0) b2[m.r][m.c] = 'Q';
    if(b2[m.r][m.c] === 'p' && m.r===7) b2[m.r][m.c] = 'q';
    return !wouldBeInCheck(state.turn, b2);
  });
  return legal;
}

// Check helpers: is king of color in check in given board state?
function wouldBeInCheck(color, board){
  // find king
  const kingChar = color === 'w' ? 'K' : 'k';
  let kr=-1,kc=-1;
  for(let r=0;r<8;r++) for(let c=0;c<8;c++) if(board[r][c] === kingChar){ kr=r; kc=c; }
  if(kr===-1) return true; // king missing => treated as check
  // generate all enemy moves and see if they attack king
  const enemy = color === 'w' ? 'b' : 'w';
  for(let r=0;r<8;r++) for(let c=0;c<8;c++){
    const p = board[r][c];
    if(!p) continue;
    const pColor = p === p.toUpperCase() ? 'w' : 'b';
    if(pColor !== enemy) continue;
    const mvs = generateMoves(p,r,c, board, true); // true -> allow pseudo moves ignoring check filter
    if(mvs.some(m => m.r===kr && m.c===kc)) return true;
  }
  return false;
}

// Convenience wrapper to check current state
function isKingInCheck(color){
  return wouldBeInCheck(color, state.board);
}

// generateMoves: returns array of {r,c} possible targets (pseudo-legal)
function generateMoves(piece, r, c, board, forAttack=false){
  const moves = [];
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  const dir = color === 'w' ? -1 : 1;

  function pushIfEmpty(rr,cc){
    if(!inBounds(rr,cc)) return;
    if(!board[rr][cc]) moves.push({r:rr,c:cc});
  }
  function pushIfEnemy(rr,cc){
    if(!inBounds(rr,cc)) return;
    if(board[rr][cc] && ((board[rr][cc]===board[rr][cc].toUpperCase()) === (piece===piece.toUpperCase()))) return;
    // can capture empty only when forAttack (for pawn captures)
    if(board[rr][cc] || forAttack) moves.push({r:rr,c:cc});
  }

  const pLower = piece.toLowerCase();
  if(pLower === 'p'){
    // forward
    const r1 = r + dir;
    if(inBounds(r1,c) && !board[r1][c]) moves.push({r:r1,c:c});
    // first double move
    const startRow = color==='w' ? 6 : 1;
    const r2 = r + dir*2;
    if(r===startRow && inBounds(r2,c) && !board[r1][c] && !board[r2][c]) moves.push({r:r2,c:c});
    // captures
    const caps = [[r+dir,c-1],[r+dir,c+1]];
    caps.forEach(([rr,cc])=>{
      if(inBounds(rr,cc) && board[rr][cc] && ((board[rr][cc] === board[rr][cc].toUpperCase()) !== (piece === piece.toUpperCase()))){
        moves.push({r:rr,c:cc});
      } else if(forAttack && inBounds(rr,cc)){
        // when for attack (check detection), pawns attack diagonals even if empty
        moves.push({r:rr,c:cc});
      }
    });
    return moves;
  }

  if(pLower === 'n'){
    const deltas = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    deltas.forEach(([dr,dc])=>{
      const rr=r+dr, cc=c+dc;
      if(!inBounds(rr,cc)) return;
      if(!board[rr][cc] || ((board[rr][cc]===board[rr][cc].toUpperCase()) !== (piece === piece.toUpperCase()))) moves.push({r:rr,c:cc});
    });
    return moves;
  }

  if(pLower === 'b' || pLower === 'q' || pLower === 'r'){
    const directions = [];
    if(pLower === 'b' || pLower === 'q') directions.push([-1,-1],[-1,1],[1,-1],[1,1]);
    if(pLower === 'r' || pLower === 'q') directions.push([-1,0],[1,0],[0,-1],[0,1]);
    directions.forEach(([dr,dc])=>{
      let rr=r+dr, cc=c+dc;
      while(inBounds(rr,cc)){
        if(!board[rr][cc]) moves.push({r:rr,c:cc});
        else {
          if((board[rr][cc]===board[rr][cc].toUpperCase()) !== (piece === piece.toUpperCase())){
            moves.push({r:rr,c:cc});
          }
          break;
        }
        rr += dr; cc += dc;
      }
    });
    return moves;
  }

  if(pLower === 'k'){
    const deltas = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    deltas.forEach(([dr,dc])=>{
      const rr=r+dr, cc=c+dc;
      if(!inBounds(rr,cc)) return;
      if(!board[rr][cc] || ((board[rr][cc]===board[rr][cc].toUpperCase()) !== (piece === piece.toUpperCase()))) moves.push({r:rr,c:cc});
    });
    return moves;
  }

  return moves;
}

// UI button handlers
restartBtn.addEventListener('click', ()=>{ initBoard(); });
undoBtn.addEventListener('click', ()=>{ undo(); });

// Start
initBoard();
