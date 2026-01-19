import { Component, EventEmitter, Output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Square {
  row: number;
  col: number;
  piece: string | null;
  isLight: boolean;
  isHighlighted: boolean;
  isLegalMove: boolean;
  isLastMove: boolean;
  isCheck: boolean;
}

interface Move {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  piece: string;
  capturedPiece?: string | null;
}

type PuzzleState = 'playing' | 'wrong' | 'success' | 'computer_moving';

@Component({
  selector: 'app-chess-puzzle',
  imports: [CommonModule],
  templateUrl: './chess-puzzle.component.html',
  styleUrl: './chess-puzzle.component.scss'
})
export class ChessPuzzleComponent {
  @Output() close = new EventEmitter<void>();

  board: Square[][] = [];
  puzzleState: PuzzleState = 'playing';
  moveNumber = 0;
  message = 'Your turn - Find the best move!';

  // Drag and drop state
  selectedSquare: Square | null = null;
  draggingPiece: string | null = null;
  dragPosition = { x: 0, y: 0 };
  isDragging = false;

  // Animation state
  animatingMove: Move | null = null;
  animationStartPos = { x: 0, y: 0 };
  animationEndPos = { x: 0, y: 0 };

  // Position: White Qh5, Bc5, Kg1 vs Black Kf8, Rf7, pawns on g7, h7, e6
  // Board is 0-indexed from top-left (a8 = 0,0)
  private initialPosition: { [key: string]: string } = {
    '0-5': 'bK', // Black King on f8
    '1-5': 'bR', // Black Rook on f7
    '1-6': 'bp', // Black pawn on g7
    '1-7': 'bp', // Black pawn on h7
    '2-4': 'bp', // Black pawn on e6
    '3-2': 'wB', // White Bishop on c5
    '3-7': 'wQ', // White Queen on h5
    '7-6': 'wK', // White King on g1
  };

  private pieceSymbols: { [key: string]: string } = {
    'wK': '\u2654', 'wQ': '\u2655', 'wR': '\u2656',
    'wB': '\u2657', 'wN': '\u2658', 'wp': '\u2659',
    'bK': '\u265A', 'bQ': '\u265B', 'bR': '\u265C',
    'bB': '\u265D', 'bN': '\u265E', 'bp': '\u265F'
  };

  constructor() {
    this.initBoard();
  }

  private initBoard(): void {
    this.board = [];
    for (let row = 0; row < 8; row++) {
      const boardRow: Square[] = [];
      for (let col = 0; col < 8; col++) {
        const key = `${row}-${col}`;
        boardRow.push({
          row,
          col,
          piece: this.initialPosition[key] || null,
          isLight: (row + col) % 2 === 0,
          isHighlighted: false,
          isLegalMove: false,
          isLastMove: false,
          isCheck: false
        });
      }
      this.board.push(boardRow);
    }
  }

  getPieceSymbol(piece: string | null): string {
    if (!piece) return '';
    return this.pieceSymbols[piece] || '';
  }

  getColumnLabel(col: number): string {
    return String.fromCharCode(97 + col); // a-h
  }

  getRowLabel(row: number): string {
    return String(8 - row); // 8-1
  }

  // Mouse event handlers for drag and drop
  onMouseDown(event: MouseEvent, square: Square): void {
    if (this.puzzleState !== 'playing' || !square.piece || !square.piece.startsWith('w')) {
      return;
    }

    event.preventDefault();
    this.selectedSquare = square;
    this.draggingPiece = square.piece;
    this.isDragging = true;
    this.dragPosition = { x: event.clientX, y: event.clientY };

    this.showLegalMoves(square);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.dragPosition = { x: event.clientX, y: event.clientY };
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging || !this.selectedSquare) {
      return;
    }

    // Find the square under the cursor
    const targetSquare = this.getSquareFromEvent(event);

    if (targetSquare && targetSquare.isLegalMove) {
      this.makeMove(this.selectedSquare, targetSquare);
    }

    this.clearSelection();
  }

  onSquareClick(square: Square): void {
    if (this.puzzleState !== 'playing') return;

    // If clicking on a legal move square while a piece is selected
    if (this.selectedSquare && square.isLegalMove) {
      this.makeMove(this.selectedSquare, square);
      this.clearSelection();
      return;
    }

    // If clicking on own piece, select it
    if (square.piece && square.piece.startsWith('w')) {
      this.clearLegalMoves();
      this.selectedSquare = square;
      this.showLegalMoves(square);
      return;
    }

    // Otherwise clear selection
    this.clearSelection();
  }

  private getSquareFromEvent(event: MouseEvent): Square | null {
    const boardElement = document.querySelector('.chess-board') as HTMLElement;
    if (!boardElement) return null;

    const rect = boardElement.getBoundingClientRect();
    const squareSize = rect.width / 8;

    const col = Math.floor((event.clientX - rect.left) / squareSize);
    const row = Math.floor((event.clientY - rect.top) / squareSize);

    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      return this.board[row][col];
    }
    return null;
  }

  private showLegalMoves(square: Square): void {
    this.clearLegalMoves();
    const legalMoves = this.getLegalMoves(square);

    for (const move of legalMoves) {
      this.board[move.row][move.col].isLegalMove = true;
    }
  }

  private clearLegalMoves(): void {
    for (const row of this.board) {
      for (const sq of row) {
        sq.isLegalMove = false;
      }
    }
  }

  private clearSelection(): void {
    this.selectedSquare = null;
    this.draggingPiece = null;
    this.isDragging = false;
    this.clearLegalMoves();
  }

  private clearLastMoveHighlights(): void {
    for (const row of this.board) {
      for (const sq of row) {
        sq.isLastMove = false;
        sq.isCheck = false;
      }
    }
  }

  private getLegalMoves(square: Square): { row: number; col: number }[] {
    const moves: { row: number; col: number }[] = [];
    const piece = square.piece;
    if (!piece) return moves;

    const pieceType = piece[1];
    const isWhite = piece[0] === 'w';

    switch (pieceType) {
      case 'Q':
        this.addQueenMoves(square, moves, isWhite);
        break;
      case 'B':
        this.addBishopMoves(square, moves, isWhite);
        break;
      case 'K':
        this.addKingMoves(square, moves, isWhite);
        break;
      case 'R':
        this.addRookMoves(square, moves, isWhite);
        break;
      case 'p':
        this.addPawnMoves(square, moves, isWhite);
        break;
    }

    return moves;
  }

  private addQueenMoves(square: Square, moves: { row: number; col: number }[], isWhite: boolean): void {
    this.addBishopMoves(square, moves, isWhite);
    this.addRookMoves(square, moves, isWhite);
  }

  private addBishopMoves(square: Square, moves: { row: number; col: number }[], isWhite: boolean): void {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of directions) {
      this.addSlidingMoves(square, moves, dr, dc, isWhite);
    }
  }

  private addRookMoves(square: Square, moves: { row: number; col: number }[], isWhite: boolean): void {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of directions) {
      this.addSlidingMoves(square, moves, dr, dc, isWhite);
    }
  }

  private addSlidingMoves(square: Square, moves: { row: number; col: number }[], dr: number, dc: number, isWhite: boolean): void {
    let r = square.row + dr;
    let c = square.col + dc;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const targetPiece = this.board[r][c].piece;
      if (targetPiece) {
        if ((isWhite && targetPiece[0] === 'b') || (!isWhite && targetPiece[0] === 'w')) {
          moves.push({ row: r, col: c });
        }
        break;
      }
      moves.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
  }

  private addKingMoves(square: Square, moves: { row: number; col: number }[], isWhite: boolean): void {
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (const [dr, dc] of directions) {
      const r = square.row + dr;
      const c = square.col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const targetPiece = this.board[r][c].piece;
        if (!targetPiece || (isWhite && targetPiece[0] === 'b') || (!isWhite && targetPiece[0] === 'w')) {
          moves.push({ row: r, col: c });
        }
      }
    }
  }

  private addPawnMoves(square: Square, moves: { row: number; col: number }[], isWhite: boolean): void {
    const direction = isWhite ? -1 : 1;
    const r = square.row + direction;
    const c = square.col;

    if (r >= 0 && r < 8) {
      // Forward move
      if (!this.board[r][c].piece) {
        moves.push({ row: r, col: c });
      }
      // Captures
      for (const dc of [-1, 1]) {
        const nc = c + dc;
        if (nc >= 0 && nc < 8) {
          const targetPiece = this.board[r][nc].piece;
          if (targetPiece && ((isWhite && targetPiece[0] === 'b') || (!isWhite && targetPiece[0] === 'w'))) {
            moves.push({ row: r, col: nc });
          }
        }
      }
    }
  }

  private makeMove(from: Square, to: Square): void {
    const move: Move = {
      fromRow: from.row,
      fromCol: from.col,
      toRow: to.row,
      toCol: to.col,
      piece: from.piece!,
      capturedPiece: to.piece
    };

    this.executeMove(move);
    this.validatePuzzleMove(move);
  }

  private executeMove(move: Move, animate = false): void {
    this.clearLastMoveHighlights();

    this.board[move.toRow][move.toCol].piece = move.piece;
    this.board[move.fromRow][move.fromCol].piece = null;

    this.board[move.fromRow][move.fromCol].isLastMove = true;
    this.board[move.toRow][move.toCol].isLastMove = true;

    // Check if king is in check
    this.updateCheckHighlight();
  }

  private updateCheckHighlight(): void {
    // Find both kings
    for (const row of this.board) {
      for (const sq of row) {
        sq.isCheck = false;
      }
    }

    // Check if black king is in check
    const blackKingSquare = this.findKing('b');
    if (blackKingSquare && this.isSquareAttacked(blackKingSquare.row, blackKingSquare.col, true)) {
      blackKingSquare.isCheck = true;
    }
  }

  private findKing(color: string): Square | null {
    for (const row of this.board) {
      for (const sq of row) {
        if (sq.piece === `${color}K`) {
          return sq;
        }
      }
    }
    return null;
  }

  private isSquareAttacked(row: number, col: number, byWhite: boolean): boolean {
    const attackerColor = byWhite ? 'w' : 'b';

    for (const boardRow of this.board) {
      for (const sq of boardRow) {
        if (sq.piece && sq.piece[0] === attackerColor) {
          const moves = this.getLegalMoves(sq);
          if (moves.some(m => m.row === row && m.col === col)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private isCheckmate(kingColor: string): boolean {
    const kingSquare = this.findKing(kingColor);
    if (!kingSquare) return false;

    const isWhiteKing = kingColor === 'w';

    // Check if king is in check
    if (!this.isSquareAttacked(kingSquare.row, kingSquare.col, !isWhiteKing)) {
      return false;
    }

    // Check if any piece can make a legal move
    for (const row of this.board) {
      for (const sq of row) {
        if (sq.piece && sq.piece[0] === kingColor) {
          const moves = this.getLegalMoves(sq);
          for (const move of moves) {
            // Simulate the move
            const originalPiece = this.board[move.row][move.col].piece;
            const movingPiece: string = sq.piece;

            this.board[move.row][move.col].piece = movingPiece;
            sq.piece = null;

            const newKingSquare = movingPiece === `${kingColor}K` ?
              this.board[move.row][move.col] : this.findKing(kingColor);

            const stillInCheck = newKingSquare ?
              this.isSquareAttacked(newKingSquare.row, newKingSquare.col, !isWhiteKing) : true;

            // Undo the move
            sq.piece = movingPiece;
            this.board[move.row][move.col].piece = originalPiece;

            if (!stillInCheck) {
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  private validatePuzzleMove(move: Move): void {
    if (this.moveNumber === 0) {
      // First move: Must be Qxf7 (Queen from h5 to f7)
      if (move.piece === 'wQ' && move.toRow === 1 && move.toCol === 5) {
        this.moveNumber = 1;
        this.message = 'Excellent! Check!';
        this.puzzleState = 'computer_moving';

        setTimeout(() => this.computerMove(), 800);
      } else {
        this.handleWrongMove();
      }
    } else if (this.moveNumber === 2) {
      // Second white move: Must deliver checkmate
      // If black king is on f7 (row 1, col 5), Bd6# (bishop to d6, row 2, col 3)
      // If black king is on e8 (row 0, col 4), Bc4# (bishop to c4, row 4, col 2) or Bd6# still works
      const blackKingSquare = this.findKing('b');

      if (move.piece === 'wB') {
        // Check if this move delivers checkmate
        if (this.isCheckmate('b')) {
          this.puzzleState = 'success';
          this.message = 'Checkmate! Brilliant!';
        } else {
          this.handleWrongMove();
        }
      } else {
        this.handleWrongMove();
      }
    }
  }

  private computerMove(): void {
    // Black's response: King takes queen or moves to e8
    const blackKingSquare = this.findKing('b');

    if (!blackKingSquare) return;

    // Prefer Kxf7 (capture the queen)
    const queenSquare = this.board[1][5];

    let targetRow: number;
    let targetCol: number;

    if (queenSquare.piece === 'wQ') {
      // This shouldn't happen since queen just moved there
      targetRow = 0;
      targetCol = 4; // Ke8
    } else {
      // King takes queen on f7
      targetRow = 1;
      targetCol = 5;
    }

    const move: Move = {
      fromRow: blackKingSquare.row,
      fromCol: blackKingSquare.col,
      toRow: targetRow,
      toCol: targetCol,
      piece: 'bK',
      capturedPiece: this.board[targetRow][targetCol].piece
    };

    setTimeout(() => {
      this.executeMove(move);
      this.moveNumber = 2;
      this.puzzleState = 'playing';
      this.message = 'Your turn - Deliver checkmate!';
    }, 500);
  }

  private handleWrongMove(): void {
    this.puzzleState = 'wrong';
    this.message = 'Not quite right. Try again!';

    setTimeout(() => {
      this.resetPuzzle();
    }, 1500);
  }

  resetPuzzle(): void {
    this.initBoard();
    this.moveNumber = 0;
    this.puzzleState = 'playing';
    this.message = 'Your turn - Find the best move!';
    this.clearSelection();
  }

  onClose(): void {
    this.close.emit();
  }
}
