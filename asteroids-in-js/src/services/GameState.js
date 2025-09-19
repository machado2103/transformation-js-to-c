/**
 * GameState - Central state management for game progression and status
 * Handles score tracking, lives, level progression, pause/resume, and game over conditions
 */
export class GameState {
    constructor(options = {}) {
        // Core game state
        this.score = options.score || 0;
        this.lives = options.lives || 3;
        this.level = options.level || 1;
        this.difficulty = options.difficulty || 'medium';

        // Game flow state
        this.gamePhase = options.gamePhase || 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.isPaused = false;
        this.isGameOver = false;

        // Level progression
        this.levelStartTime = 0;
        this.levelDuration = 60000; // 60 seconds per level
        this.asteroidsDestroyed = 0;
        this.totalAsteroidsThisLevel = 0;

        // Difficulty settings
        this.difficultySettings = {
            easy: {
                initialLives: 5,
                baseAsteroidCount: 3,
                asteroidSpeedMultiplier: 0.8,
                extraLifeThreshold: 8000
            },
            medium: {
                initialLives: 3,
                baseAsteroidCount: 5,
                asteroidSpeedMultiplier: 1.0,
                extraLifeThreshold: 10000
            },
            hard: {
                initialLives: 1,
                baseAsteroidCount: 8,
                asteroidSpeedMultiplier: 1.3,
                extraLifeThreshold: 15000
            }
        };

        // Scoring system
        this.lastExtraLifeScore = 0;
        this.pointValues = {
            asteroidLarge: 20,
            asteroidMedium: 50,
            asteroidSmall: 100,
            levelBonus: 500
        };

        // Pause/resume functionality - immediate only

        // Statistics tracking
        this.gameStartTime = 0;
        this.totalGameTime = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;

        // Initialize with difficulty settings
        this.applyDifficultySettings();
    }

    /**
     * Apply difficulty-specific settings
     */
    applyDifficultySettings() {
        const settings = this.difficultySettings[this.difficulty];
        if (settings) {
            this.lives = settings.initialLives;
        }
    }

    /**
     * Start a new game
     * @param {string} difficulty Difficulty level
     * @param {string} shipColor Selected ship color
     */
    startNewGame(difficulty = 'medium', shipColor = '#00FF88') {
        this.difficulty = difficulty;
        this.score = 0;
        this.level = 1;
        this.applyDifficultySettings();

        this.gamePhase = 'playing';
        this.isPaused = false;
        this.isGameOver = false;

        this.levelStartTime = Date.now();
        this.gameStartTime = Date.now();
        this.asteroidsDestroyed = 0;
        this.lastExtraLifeScore = 0;

        // Reset statistics
        this.shotsFired = 0;
        this.shotsHit = 0;
    }

    /**
     * Update game state
     * @param {number} deltaTime Time elapsed since last frame
     * @param {Object} gameData Current game data
     */
    update(deltaTime, gameData = {}) {
        if (this.gamePhase !== 'playing') return;

        // Update total game time
        this.totalGameTime += deltaTime;

        // Level completion is handled by Game.js
    }

    /**
     * Add points to the score
     * @param {number} points Points to add
     * @param {string} source Source of points (for statistics)
     * @returns {Object} Score update results
     */
    addScore(points, source = 'unknown') {
        const oldScore = this.score;
        this.score += points;

        // Check for extra life
        const settings = this.difficultySettings[this.difficulty];
        const extraLifeThreshold = settings.extraLifeThreshold;
        const extraLifeEarned = Math.floor(this.score / extraLifeThreshold) >
                               Math.floor(this.lastExtraLifeScore / extraLifeThreshold);

        if (extraLifeEarned) {
            this.lives++;
            this.lastExtraLifeScore = this.score;
        }

        // Track hit statistics
        if (source.includes('asteroid')) {
            this.shotsHit++;
        }

        return {
            newScore: this.score,
            pointsAdded: points,
            extraLifeEarned,
            source
        };
    }

    /**
     * Lose a life
     * @returns {Object} Life loss results
     */
    loseLife() {
        this.lives--;

        const gameOver = this.lives <= 0;
        if (gameOver) {
            this.endGame();
        }

        return {
            livesRemaining: this.lives,
            gameOver
        };
    }

    /**
     * Award level completion bonus (called when level is completed)
     */
    awardLevelBonus() {
        this.addScore(this.pointValues.levelBonus, 'level-bonus');
        return {
            bonusAwarded: this.pointValues.levelBonus
        };
    }

    /**
     * Advance to the next level (separate from bonus awarding)
     */
    advanceLevel() {
        this.level++;
        this.levelStartTime = Date.now();
        this.asteroidsDestroyed = 0;

        return {
            newLevel: this.level
        };
    }

    /**
     * Complete the current level (legacy method - calls both functions)
     */
    completeLevel() {
        const bonusResult = this.awardLevelBonus();
        const levelResult = this.advanceLevel();

        return {
            newLevel: levelResult.newLevel,
            bonusAwarded: bonusResult.bonusAwarded
        };
    }

    /**
     * Get asteroid count for current level
     * @returns {number} Number of asteroids for this level
     */
    getAsteroidCountForLevel() {
        const settings = this.difficultySettings[this.difficulty];
        const baseCount = settings.baseAsteroidCount;

        // Increase asteroid count every few levels
        const levelBonus = Math.floor((this.level - 1) / 3);
        return baseCount + levelBonus;
    }

    /**
     * Get asteroid speed multiplier for current level
     * @returns {number} Speed multiplier
     */
    getAsteroidSpeedMultiplier() {
        const settings = this.difficultySettings[this.difficulty];
        const baseMultiplier = settings.asteroidSpeedMultiplier;

        // Slight speed increase with levels (max 50% increase)
        const levelMultiplier = 1 + Math.min(0.5, (this.level - 1) * 0.05);
        return baseMultiplier * levelMultiplier;
    }

    /**
     * Pause the game
     */
    pause() {
        if (this.gamePhase === 'playing' && !this.isPaused) {
            this.isPaused = true;
            return true;
        }
        return false;
    }

    /**
     * Resume the game with countdown
     */
    resume() {
        if (this.gamePhase === 'playing' && this.isPaused) {
            this.isPaused = false;
            return true;
        }
        return false;
    }

    /**
     * End the game
     */
    endGame() {
        this.isGameOver = true;
        this.gamePhase = 'gameOver';
        this.totalGameTime = Date.now() - this.gameStartTime;
    }

    /**
     * Return to menu
     */
    returnToMenu() {
        this.gamePhase = 'menu';
        this.isPaused = false;
        this.isGameOver = false;
    }

    /**
     * Record an asteroid destruction
     * @param {string} asteroidSize Size of destroyed asteroid
     */
    recordAsteroidDestroyed(asteroidSize) {
        this.asteroidsDestroyed++;

        // Award points based on asteroid size
        let points = 0;
        switch (asteroidSize) {
            case 'large':
                points = this.pointValues.asteroidLarge;
                break;
            case 'medium':
                points = this.pointValues.asteroidMedium;
                break;
            case 'small':
                points = this.pointValues.asteroidSmall;
                break;
        }

        if (points > 0) {
            return this.addScore(points, `asteroid-${asteroidSize}`);
        }

        return { newScore: this.score, pointsAdded: 0, extraLifeEarned: false };
    }

    /**
     * Record a shot fired (for statistics)
     */
    recordShotFired() {
        this.shotsFired++;
    }


    /**
     * Get game state for UI display
     * @returns {Object} UI-friendly game state
     */
    getUIState() {
        return {
            score: this.score,
            lives: this.lives,
            level: this.level,
            difficulty: this.difficulty,
            gamePhase: this.gamePhase,
            isPaused: this.isPaused,
            isGameOver: this.isGameOver
        };
    }

    /**
     * Get configuration for save/load
     * @returns {Object} Serializable game state
     */
    getConfig() {
        return {
            score: this.score,
            lives: this.lives,
            level: this.level,
            difficulty: this.difficulty,
            gamePhase: this.gamePhase,
            asteroidsDestroyed: this.asteroidsDestroyed,
            totalGameTime: this.totalGameTime,
            shotsFired: this.shotsFired,
            shotsHit: this.shotsHit,
            lastExtraLifeScore: this.lastExtraLifeScore
        };
    }

    /**
     * Set configuration from saved data
     * @param {Object} config Saved game state
     */
    setConfig(config) {
        this.score = config.score || 0;
        this.lives = config.lives || 3;
        this.level = config.level || 1;
        this.difficulty = config.difficulty || 'medium';
        this.gamePhase = config.gamePhase || 'menu';
        this.asteroidsDestroyed = config.asteroidsDestroyed || 0;
        this.totalGameTime = config.totalGameTime || 0;
        this.shotsFired = config.shotsFired || 0;
        this.shotsHit = config.shotsHit || 0;
        this.lastExtraLifeScore = config.lastExtraLifeScore || 0;

        // Reset transient state
        this.isPaused = false;
        this.isGameOver = false;
    }
}
