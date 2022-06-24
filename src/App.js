import { Client } from 'boardgame.io/client';
import { SocketIO } from 'boardgame.io/multiplayer';
import { TicTacToe } from './Game';

function SplashScreen(rootElement) {
  return new Promise((resolve) => {
    const createButton = (playerID) => {
      const button = document.createElement('button');
      button.textContent = 'Player ' + playerID;
      button.onclick = () => resolve(playerID);
      rootElement.append(button);
    };
    rootElement.innerHTML = ` <p>Play as</p>`;
    const playerIDs = ['0', '1'];
    playerIDs.forEach(createButton);
  });
}

class TicTacToeClient {
  constructor(rootElement, { playerID } = {}) {
    this.client = Client({
      game: TicTacToe,
      multiplayer: SocketIO({ server: 'localhost:8000' }),
      playerID,
    });
    this.connected = false;
    this.client.start();
    this.rootElement = rootElement;
    this.client.subscribe((state) => this.update(state));
  }

  onConnecting() {
    this.connected = false;
    this.showConnecting();
  }

  onConnected() {
    this.connected = true;
    this.createBoard();
    this.attachListeners();
  }

  showConnecting() {
    this.rootElement.innerHTML = '<p>connecting…</p>';
  }

  createBoard() {
    // Create cells in rows for the Tic-Tac-Toe board.
    const rows = [];
    for (let i = 0; i < 3; i++) {
      const cells = [];
      for (let j = 0; j < 3; j++) {
        const id = 3 * i + j;
        cells.push(`<td class="cell" data-id="${id}"></td>`);
      }
      rows.push(`<tr>${cells.join('')}</tr>`);
    }

    // Add the HTML to our app <div>.
    // We’ll use the empty <p> to display the game winner later.
    this.rootElement.innerHTML = `
      <h3>Player ${this.client.playerID}</h3>
      <table>${rows.join('')}</table>
      <p class="winner"></p>
    `;
  }

  attachListeners() {
    // Attach event listeners to the board cells.
    const cells = this.rootElement.querySelectorAll('.cell');
    // This event handler will read the cell id from the cell’s
    // `data-id` attribute and make the `clickCell` move.
    const handleCellClick = (event) => {
      const id = parseInt(event.target.dataset.id, 10);
      this.client.moves.clickCell(id);
    };
    cells.forEach((cell) => {
      cell.onclick = handleCellClick;
    });
  }

  update(state) {
    if (state === null) {
      this.onConnecting();
      return;
    } else if (!this.connected) {
      this.onConnected();
    }

    // Get all the board cells.
    const cells = this.rootElement.querySelectorAll('.cell');
    // Update cells to display the values in game state.
    cells.forEach((cell) => {
      const cellId = parseInt(cell.dataset.id, 10);
      const cellValue = state.G.cells[cellId];
      cell.textContent = cellValue !== null ? cellValue : '';
    });
    // Get the gameover message element.
    const messageEl = this.rootElement.querySelector('.winner');
    // Update the element to show a winner if any.
    if (state.ctx.gameover) {
      messageEl.textContent =
        state.ctx.gameover.winner !== undefined
          ? 'Winner: ' + state.ctx.gameover.winner
          : 'Draw!';
    } else {
      const { currentPlayer } = state.ctx;
      messageEl.textContent = `It’s player ${currentPlayer}’s turn`;
      if (currentPlayer === this.client.playerID) {
        this.rootElement.classList.add('active');
      } else {
        this.rootElement.classList.remove('active');
      }
    }
  }
}

class App {
  constructor(rootElement) {
    this.client = SplashScreen(rootElement).then((playerID) => {
      return new TicTacToeClient(rootElement, { playerID });
    });
  }
}

const appElement = document.getElementById('app');
new App(appElement);
