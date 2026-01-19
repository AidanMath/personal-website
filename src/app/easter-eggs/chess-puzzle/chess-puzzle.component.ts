import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Square {
  row: number;
  col: number;
  piece: string | null;
  isLight: boolean;
  isHighlighted: boolean;
}

@Component({
  selector: 'app-chess-puzzle',
  imports: [CommonModule],
  templateUrl: './chess-puzzle.component.html',
  styleUrl: './chess-puzzle.component.scss'
})
export class ChessPuzzleComponent {
  @Output() close = new EventEmitter<void>();

  board: Square[][] = [];
  showSolution = false;
  solved = false;

  // Mate in 2 puzzle - White to move
  // Position: White Qh5, Bc4, Kg1 vs Black Kf8, Rf7, pawns
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

  solution = [
    { move: 'Qf7+', description: 'Queen takes f7, check!' },
    { move: 'Kxf7 or Ke8', description: 'King must move' },
    { move: 'Bd6# or Bc4#', description: 'Bishop delivers checkmate!' }
  ];

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
          isHighlighted: false
        });
      }
      this.board.push(boardRow);
    }
  }

  getPieceSymbol(piece: string | null): string {
    if (!piece) return '';

    const symbols: { [key: string]: string } = {
      'wK': '\u2654', 'wQ': '\u2655', 'wR': '\u2656',
      'wB': '\u2657', 'wN': '\u2658', 'wp': '\u2659',
      'bK': '\u265A', 'bQ': '\u265B', 'bR': '\u265C',
      'bB': '\u265D', 'bN': '\u265E', 'bp': '\u265F'
    };

    return symbols[piece] || '';
  }

  toggleSolution(): void {
    this.showSolution = !this.showSolution;
    if (this.showSolution) {
      this.highlightSolutionSquares();
    } else {
      this.clearHighlights();
    }
  }

  private highlightSolutionSquares(): void {
    // Highlight key squares for the solution
    this.board[1][5].isHighlighted = true; // f7 - Queen's target
    this.board[0][5].isHighlighted = true; // f8 - King's position
    this.board[3][2].isHighlighted = true; // c5 - Bishop
    this.board[3][7].isHighlighted = true; // h5 - Queen
  }

  private clearHighlights(): void {
    for (const row of this.board) {
      for (const square of row) {
        square.isHighlighted = false;
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
