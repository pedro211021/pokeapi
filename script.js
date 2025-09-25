// Piezas en Unicode
const PIECES = {
  'r':'\u265C','n':'\u265E','b':'\u265D','q':'\u265B','k':'\u265A','p':'\u265F',
  'R':'\u2656','N':'\u2658','B':'\u2657','Q':'\u2655','K':'\u2654','P':'\u2659'
}

let boardEl = document.getElementById('board')
let turnLabel = document.getElementById('turnLabel')
let moveListEl = document.getElementById('moveList')
let selected = null
let movesVisible = false
let flipped = false

let board = []
let history = []
let turn = 'w'

function startPosition() {
  const rows = [
    'rnbqkbnr',
    'pppppppp',
    '........',
    '........',
    '........',
    '........',
    'PPPPPPPP',
    'RNBQKBNR'
  ]
  board = rows.map(r => r.split(''))
  history = []
  turn = 'w'
  render()
}

function render() {
  boardEl.innerHTML = ''
  const indices = [...Array(64).keys()]
  if(flipped) indices.reverse()
  indices.forEach(i=>{
    const row = Math.floor(i/8)
    const col = i%8
    const square = document.createElement('div')
    square.className = 'square '+(((row+col)%2===0)?'light':'dark')
    square.dataset.r = row
    square.dataset.c = col

    const r = flipped ? 7-row : row
    const c = flipped ? 7-col : col
    const piece = board[r][c]
    if(piece && piece !== '.') {
      square.textContent = PIECES[piece]
      square.dataset.piece = piece
    }

    square.addEventListener('click', onSquareClick)
    square.addEventListener('touchstart', onSquareClick)

    boardEl.appendChild(square)
  })
  turnLabel.textContent = (turn==='w') ? 'Blancas' : 'Negras'
  updateMoveList()
}

function coordsFromElement(el){
  const idx = Array.from(boardEl.children).indexOf(el)
  const usedIdx = flipped ? 63-idx : idx
  const r = Math.floor(usedIdx/8)
  const c = usedIdx%8
  return [r,c]
}

function onSquareClick(e){
  e.preventDefault()
  const el = e.currentTarget
  const [r,c] = coordsFromElement(el)
  const piece = board[r][c]

  if(selected){
    const [sr,sc] = selected
    if(sr===r && sc===c){ selected = null; clearHighlights(); return }
    const legal = genMovesFor(sr,sc)
    const found = legal.find(m => m[0]===r && m[1]===c)
    if(found){
      makeMove(sr,sc,r,c,found[2])
      selected = null
      clearHighlights()
      render()
      return
    }
  }

  if(piece && piece !== '.' && ((turn==='w' && piece===piece.toUpperCase()) || (turn==='b' && piece===piece.toLowerCase()))){
    selected = [r,c]
    clearHighlights()
    highlightSquareAt(r,c,'selected')
    const legal = genMovesFor(r,c)
    legal.forEach(m=> highlightSquareAt(m[0],m[1], m[2] ? 'capture' : 'dot'))
  }
}

function highlightSquareAt(r,c,kind){
  const idx = flipped ? 63 - (r*8 + c) : (r*8 + c)
  const el = boardEl.children[idx]
  if(!el) return
  if(kind==='selected') el.classList.add('selected')
  else if(kind==='dot'){
    const d = document.createElement('div'); d.className='dot'; el.appendChild(d)
  } else if(kind==='capture'){
    const d = document.createElement('div'); d.className='capture'; el.appendChild(d)
  }
}

function clearHighlights(){
  Array.from(boardEl.children).forEach(ch=>{
    ch.classList.remove('selected')
    while(ch.querySelector('.dot')) ch.querySelector('.dot').remove()
    while(ch.querySelector('.capture')) ch.querySelector('.capture').remove()
  })
}

function inside(r,c){ return r>=0&&r<8&&c>=0&&c<8 }

function genMovesFor(r,c){
  const piece = board[r][c]
  if(!piece||piece==='.') return []
  const isWhite = piece===piece.toUpperCase()
  const moves = []
  const add = (rr,cc,capture=false)=>{
    if(inside(rr,cc)){
      const target = board[rr][cc]
      if(target==='.') { if(!capture) moves.push([rr,cc,false]) }
      else {
        const targetWhite = target===target.toUpperCase()
        if(targetWhite !== isWhite) moves.push([rr,cc,true])
      }
    }
  }

  const p = piece.toLowerCase()
  if(p==='p'){
    const dir = isWhite ? -1 : 1
    const startRow = isWhite ? 6 : 1
    if(inside(r+dir,c) && board[r+dir][c]==='.') add(r+dir,c,false)
    if(r===startRow && board[r+dir][c]==='.' && board[r+2*dir][c]==='.') add(r+2*dir,c,false)
    [[r+dir,c-1],[r+dir,c+1]].forEach(([rr,cc])=>{
      if(inside(rr,cc) && board[rr][cc]!=='.' && (board[rr][cc]===board[rr][cc].toUpperCase())!==isWhite)
        add(rr,cc,true)
    })
  } else if(p==='n'){
    [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(d=>add(r+d[0],c+d[1],true))
  } else if(p==='b' || p==='q'){
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(d=>{
      let rr=r+d[0], cc=c+d[1]
      while(inside(rr,cc)){
        if(board[rr][cc]==='.') add(rr,cc,false)
        else { add(rr,cc,true); break }
        rr+=d[0]; cc+=d[1]
      }
    })
  }
  if(p==='r' || p==='q'){
    [[-1,0],[1,0],[0,-1],[0,1]].forEach(d=>{
      let rr=r+d[0], cc=c+d[1]
      while(inside(rr,cc)){
        if(board[rr][cc]==='.') add(rr,cc,false)
        else { add(rr,cc,true); break }
        rr+=d[0]; cc+=d[1]
      }
    })
  }
  if(p==='k'){
    for(let dr=-1;dr<=1;dr++)
      for(let dc=-1;dc<=1;dc++)
        if(dr!==0||dc!==0) add(r+dr,c+dc,true)
  }
  return moves
}

function makeMove(sr,sc,dr,dc){
  const piece = board[sr][sc]
  const target = board[dr][dc]
  history.push(JSON.stringify({from:[sr,sc],to:[dr,dc],piece,cap:target}))
  board[dr][dc] = piece
  board[sr][sc] = '.'
  if(piece.toLowerCase()==='p' && (dr===0 || dr===7)){
    board[dr][dc] = (piece===piece.toUpperCase()) ? 'Q' : 'q'
  }
  turn = (turn==='w') ? 'b' : 'w'
  updateMoveListAdd(piece, sr,sc,dr,dc, target)
}

function updateMoveListAdd(piece, sr,sc,dr,dc){
  const from = coordToSquare(sr,sc)
  const to = coordToSquare(dr,dc)
  const text = `${piece} ${from}→${to}`
  const el = document.createElement('div'); el.textContent = text
  moveListEl.appendChild(el)
}

function updateMoveList(){
  if(history.length===0){ moveListEl.textContent='—'; return }
  moveListEl.innerHTML = ''
  history.forEach((h)=>{
    const o = JSON.parse(h)
    const div = document.createElement('div')
    div.textContent = `${coordToSquare(o.from[0],o.from[1])} → ${coordToSquare(o.to[0],o.to[1])}`
    moveListEl.appendChild(div)
  })
}

function coordToSquare(r,c){
  const file = 'abcdefgh'[c]
  const rank = 8 - r
  return file+rank
}

// Botones
document.getElementById('newBtn').addEventListener('click', ()=> startPosition())
document.getElementById('undoBtn').addEventListener('click', ()=>{
  if(history.length===0) return
  const last = JSON.parse(history.pop())
  board[last.from[0]][last.from[1]] = last.piece
  board[last.to[0]][last.to[1]] = last.cap
  turn = (turn==='w') ? 'b' : 'w'
  render()
})
document.getElementById('flipBtn').addEventListener('click', ()=>{ flipped = !flipped; render() })
document.getElementById('hintBtn').addEventListener('click', ()=>{
  movesVisible = !movesVisible
  if(!movesVisible) clearHighlights()
  else if(selected){
    const legal = genMovesFor(selected[0],selected[1])
    legal.forEach(m=> highlightSquareAt(m[0],m[1], m[2] ? 'capture' : 'dot'))
  }
})

// Iniciar
startPosition()


