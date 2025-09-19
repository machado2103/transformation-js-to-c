import { Ship } from './models/Ship.js';
import { PhysicsEngine } from './services/PhysicsEngine.js';
import { InputManager } from './services/InputManager.js';
import { Renderer } from './services/Renderer.js';
import { GameState } from './services/GameState.js';
import { EntityManager } from './services/EntityManager.js';

/**
 * Game - Main game coordinator and loop manager
 * Orchestrates all game systems including rendering, input, physics, collision, and state management
 */
export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext('2d');

        // Game dimensions - force to fixed size
        this.width = 800;
        this.height = 600;

        // Force canvas to correct size immediately
        canvas.width = this.width;
        canvas.height = this.height;

        // Core game systems
        this.physicsEngine = new PhysicsEngine(this.width, this.height);
        this.inputManager = new InputManager();
        this.renderer = new Renderer(canvas, this.context);
        this.gameState = new GameState();
        this.entityManager = new EntityManager(this.width, this.height);

        // Game entities
        this.ship = null;

        // Game loop management
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.targetFPS = 60;
        this.maxDeltaTime = 1000 / 30; // Cap delta time to 30 FPS minimum

        // Performance monitoring
        this.performanceStats = {
            fps: 60,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0
        };

        // Game configuration
        this.selectedShipColor = '#00FF88';
        this.selectedDifficulty = 'medium';

        this.initialize();
    }

    /**
     * Initialize game systems and state
     */
    initialize() {
        this.gameState.returnToMenu();
    }

    /**
     * Start a new game with selected options
     * @param {string} difficulty Difficulty level
     * @param {string} shipColor Ship color
     */
    startNewGame(difficulty = 'medium', shipColor = '#00FF88') {
        this.selectedDifficulty = difficulty;
        this.selectedShipColor = shipColor;

        this.gameState.startNewGame(difficulty, shipColor);

        this.ship = new Ship({
            position: { x: this.width / 2, y: this.height / 2 },
            color: shipColor,
            screenWidth: this.width,
            screenHeight: this.height
        });

        // Clear previous entities
        this.entityManager.clearAllEntities();

        const asteroidCount = this.gameState.getAsteroidCountForLevel();
        this.entityManager.createAsteroidField(
            asteroidCount,
            this.ship.position,
            difficulty
        );
    }

    /**
     * Main game loop using RequestAnimationFrame
     * @param {number} currentTime Current timestamp
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;

        // Calculate delta time
        const deltaTime = Math.min(currentTime - this.lastFrameTime, this.maxDeltaTime);
        this.lastFrameTime = currentTime;

        const startUpdate = performance.now();
        this.update(deltaTime, currentTime);
        const updateTime = performance.now() - startUpdate;

        const startRender = performance.now();
        this.render();
        const renderTime = performance.now() - startRender;

        this.updatePerformanceStats(deltaTime, updateTime, renderTime);
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Update all game systems
     * @param {number} deltaTime Time since last frame
     * @param {number} currentTime Current timestamp
     */
    update(deltaTime, currentTime) {
        const entityCounts = this.entityManager.getEntityCounts();
        this.gameState.update(deltaTime, { asteroidCount: entityCounts.asteroids });

        // Process input ALWAYS (even when paused, for pause/unpause functionality)
        const inputResult = this.inputManager.processInput({
            ship: this.ship,
            gameState: this.gameState,
            deltaTime,
            currentTime
        });

        this.handleInputActions(inputResult.actions);

        // Skip remaining game updates if paused, game over, or in menu
        if (this.gameState.isPaused || this.gameState.isGameOver || this.gameState.gamePhase === 'menu') {
            return;
        }

        if (inputResult.newProjectile) {
            this.entityManager.createProjectile(inputResult.newProjectile);
            this.gameState.recordShotFired();
        }

        if (this.ship) {
            this.ship.update(deltaTime);
        }

        this.entityManager.update(deltaTime);
        const allEntities = [...this.entityManager.getAllActiveEntities()];
        if (this.ship) {
            allEntities.push(this.ship);
        }

        this.physicsEngine.updateEntities(allEntities, deltaTime);

        const collisionResult = this.physicsEngine.detectCollisions(allEntities);
        this.handleCollisions(collisionResult.collisions);

        // Check for level completion
        if (entityCounts.asteroids === 0) {
            this.handleLevelComplete();
        }
    }

    /**
     * Handle input actions
     * @param {Array<string>} actions Array of input actions
     */
    handleInputActions(actions) {
        for (const action of actions) {
            switch (action) {
                case 'toggle-pause':
                    if (this.gameState.isPaused) {
                        this.gameState.resume();
                    } else {
                        this.gameState.pause();
                    }
                    break;
                case 'escape':
                    this.gameState.returnToMenu();
                    break;
            }
        }
    }

    /**
     * Handle collision events
     * @param {Array} collisions Array of collision data
     */
    handleCollisions(collisions) {
        for (const collision of collisions) {
            const { entityA, entityB } = collision;

            // Ship vs Asteroid collision
            if ((entityA === this.ship && entityB.type === 'asteroid') ||
                (entityB === this.ship && entityA.type === 'asteroid')) {

                const ship = entityA === this.ship ? entityA : entityB;
                const asteroid = entityA === this.ship ? entityB : entityA;

                if (ship.onCollision(asteroid)) {
                    // Ship was destroyed
                    const lifeResult = this.gameState.loseLife();

                    // Create explosion effect
                    this.entityManager.createParticleEffect('explosion', {
                        position: ship.position,
                        color: ship.color,
                        count: 10
                    });

                    if (lifeResult.gameOver) {
                        // Game over handled by game state
                    }
                }
            }

            // Projectile vs Asteroid collision
            else if ((entityA.type === 'projectile' && entityB.type === 'asteroid') ||
                     (entityB.type === 'projectile' && entityA.type === 'asteroid')) {

                const projectile = entityA.type === 'projectile' ? entityA : entityB;
                const asteroid = entityA.type === 'projectile' ? entityB : entityA;

                if (projectile.onCollision(asteroid) && asteroid.onCollision(projectile)) {
                    // Destroy projectile
                    this.entityManager.destroyProjectile(projectile);

                    // Destroy asteroid and create fragments
                    const fragments = this.entityManager.destroyAsteroid(asteroid);

                    // Award points
                    this.gameState.recordAsteroidDestroyed(asteroid.size);
                }
            }
        }
    }

    /**
     * Handle level completion
     */
    handleLevelComplete() {
        const levelResult = this.gameState.completeLevel();

        // Create new asteroid field for next level
        const asteroidCount = this.gameState.getAsteroidCountForLevel();
        this.entityManager.createAsteroidField(
            asteroidCount,
            this.ship.position,
            this.selectedDifficulty
        );
    }

    /**
     * Render the game
     */
    render() {
        // Prepare render data
        const renderData = {
            entities: this.entityManager.getAllActiveEntities(),
            particles: this.entityManager.getEntitiesByType('particle'),
            gameState: this.gameState.getUIState(),
            ui: {
                font: '20px "Courier New", monospace'
            }
        };

        // Add ship to entities if active
        if (this.ship && this.gameState.gamePhase === 'playing') {
            renderData.entities.push(this.ship);
        }

        // Render frame
        this.renderer.render(renderData);
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.lastFrameTime = performance.now();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
    }

    /**
     * Pause the game
     */
    pause() {
        this.gameState.pause();
    }

    /**
     * Resume the game
     */
    resume() {
        this.gameState.resume();
    }

    /**
     * Update performance statistics
     * @param {number} deltaTime Frame delta time
     * @param {number} updateTime Time spent updating
     * @param {number} renderTime Time spent rendering
     */
    updatePerformanceStats(deltaTime, updateTime, renderTime) {
        this.frameCount++;

        // Update FPS calculation
        this.performanceStats.fps = 1000 / deltaTime;
        this.performanceStats.frameTime = deltaTime;
        this.performanceStats.updateTime = updateTime;
        this.performanceStats.renderTime = renderTime;

        // Log performance warnings
        if (deltaTime > 33) { // Less than 30 FPS
            console.warn(`Low FPS detected: ${this.performanceStats.fps.toFixed(1)} FPS`);
        }
    }

    /**
     * Resize game to new dimensions
     * @param {number} width New width
     * @param {number} height New height
     */
    resize(width, height) {
        this.width = width;
        this.height = height;

        this.canvas.width = width;
        this.canvas.height = height;

        // Update systems
        this.physicsEngine.setScreenDimensions(width, height);
        this.entityManager.setScreenDimensions(width, height);
        this.renderer.resize(width, height);

        // Update ship screen bounds
        if (this.ship) {
            this.ship.screenWidth = width;
            this.ship.screenHeight = height;
        }
    }


    /**
     * Cleanup game resources
     */
    destroy() {
        this.stop();
        this.entityManager.clearAllEntities();
        this.inputManager.destroy();
    }
}
