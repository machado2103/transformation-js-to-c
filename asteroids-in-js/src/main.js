import { Game } from './Game.js';

/**
 * Main application entry point
 * Handles UI interactions, game initialization, and menu management
 */
class AsteroidsApp {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.menuScreen = document.getElementById('menuScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');

        // Menu controls
        this.shipColorSelector = document.getElementById('shipColorSelector');
        this.difficultySelector = document.getElementById('difficultySelector');
        this.startButton = document.getElementById('startButton');
        this.restartButton = document.getElementById('restartButton');
        this.menuButton = document.getElementById('menuButton');

        // Game over screen elements
        this.finalScoreDisplay = document.getElementById('finalScoreValue');

        // Game instance
        this.game = null;

        // Current selections
        this.selectedShipColor = '#00FF88';
        this.selectedDifficulty = 'medium';

        this.initialize();
    }

    /**
     * Initialize the application
     */
    initialize() {
        this.setupEventListeners();
        this.setupCanvas();
        this.showMenu();
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Unified option selection handler
        this.handleOptionClick = (event, selector, className, dataKey) => {
            if (event.target.classList.contains(className)) {
                selector(event.target.dataset[dataKey]);
            }
        };

        // Ship color selection
        this.shipColorSelector.addEventListener('click', (e) =>
            this.handleOptionClick(e, (v) => this.selectShipColor(v), 'color-option', 'color'));

        // Difficulty selection
        this.difficultySelector.addEventListener('click', (e) =>
            this.handleOptionClick(e, (v) => this.selectDifficulty(v), 'difficulty-option', 'difficulty'));

        // Button clicks
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
        this.menuButton.addEventListener('click', () => this.returnToMainMenu());

        // Global keyboard events
        document.addEventListener('keydown', (event) => {
            this.handleGlobalKeyboard(event);
        });

        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    /**
     * Set up canvas and create game instance
     */
    setupCanvas() {
        this.resizeCanvas();
        this.game = new Game(this.canvas);
        this.game.start();
    }

    /**
     * Resize canvas to container dimensions
     */
    resizeCanvas() {
        // Use fixed dimensions matching the game container
        this.canvas.width = 800;
        this.canvas.height = 600;

        if (this.game) {
            this.game.resize(800, 600);
        }
    }

    /**
     * Update option selection UI
     * @param {HTMLElement} container Container element
     * @param {string} optionClass Option class name
     * @param {string} dataKey Data attribute key
     * @param {string} value Selected value
     */
    updateOptionSelection(container, optionClass, dataKey, value) {
        const options = container.querySelectorAll(`.${optionClass}`);
        options.forEach(option => {
            option.classList.toggle('selected', option.dataset[dataKey] === value);
        });
    }

    /**
     * Select ship color
     * @param {string} color Selected color
     */
    selectShipColor(color) {
        this.selectedShipColor = color;
        this.updateOptionSelection(this.shipColorSelector, 'color-option', 'color', color);
    }

    /**
     * Select difficulty
     * @param {string} difficulty Selected difficulty
     */
    selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;
        this.updateOptionSelection(this.difficultySelector, 'difficulty-option', 'difficulty', difficulty);
    }

    /**
     * Start a new game
     */
    startGame() {
        this.showGameScreen();

        // Force canvas dimensions and ensure proper sizing
        this.canvas.width = 800;
        this.canvas.height = 600;

        // Force game resize
        this.game.resize(800, 600);

        this.game.startNewGame(this.selectedDifficulty, this.selectedShipColor);
        this.startGameUpdateLoop();
    }

    /**
     * Start the game update loop for UI synchronization
     */
    startGameUpdateLoop() {
        const updateUI = () => {
            if (this.game && this.game.gameState) {
                const gameState = this.game.gameState.getUIState();

                // HUD is now handled by canvas rendering

                if (gameState.gamePhase === 'gameOver') {
                    this.showGameOver(gameState.score);
                } else if (gameState.gamePhase === 'menu') {
                    this.showMenu();
                }

                // Pause screen is now handled by Canvas renderer
            }

            // Continue update loop
            requestAnimationFrame(updateUI);
        };

        updateUI();
    }

    /**
     * Show a specific screen
     * @param {HTMLElement} screen Screen to show
     * @param {Function} callback Optional callback after showing
     */
    showScreen(screen, callback) {
        this.hideAllScreens();
        if (screen) {
            screen.classList.remove('hidden');
            if (callback) callback();
        }
    }

    /**
     * Show main menu
     */
    showMenu() {
        this.showScreen(this.menuScreen, () => {
            this.selectShipColor(this.selectedShipColor);
            this.selectDifficulty(this.selectedDifficulty);
        });
    }

    /**
     * Return to main menu (like ESC key) - resets game state properly
     */
    returnToMainMenu() {
        // Reset game state properly (like ESC key does)
        if (this.game && this.game.gameState) {
            this.game.gameState.returnToMenu();
        }

        // Then show the menu UI
        this.showMenu();
    }

    /**
     * Show game screen
     */
    showGameScreen() {
        this.showScreen(this.gameScreen);
    }


    /**
     * Show game over screen
     * @param {number} finalScore Final score
     */
    showGameOver(finalScore) {
        this.showScreen(this.gameOverScreen, () => {
            this.finalScoreDisplay.textContent = finalScore;
        });
    }

    /**
     * Hide all screens
     */
    hideAllScreens() {
        const screens = [this.menuScreen, this.gameScreen, this.gameOverScreen];
        screens.forEach(screen => {
            if (screen) {
                screen.classList.add('hidden');
            }
        });
    }

    /**
     * Handle global keyboard events
     * @param {KeyboardEvent} event Keyboard event
     */
    handleGlobalKeyboard(event) {
        if (event.code === 'Escape') {
            if (this.game && this.game.gameState) {
                const gameState = this.game.gameState.getUIState();

                if (gameState.gamePhase === 'playing') {
                    // Return to menu from game
                    this.showMenu();
                    this.game.gameState.returnToMenu();
                } else if (gameState.gamePhase === 'gameOver') {
                    // Return to menu from game over
                    this.showMenu();
                }
            }
        }

        if (event.code === 'Enter' || event.code === 'Space') {
            if (!this.menuScreen.classList.contains('hidden')) {
                this.startGame();
            }
        }

        // Prevent default browser behavior for game keys
        const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyW', 'KeyS', 'KeyD', 'KeyP'];
        if (gameKeys.includes(event.code)) {
            event.preventDefault();
        }
    }

}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AsteroidsApp();
});

// Handle page visibility changes
