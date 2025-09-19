/**
 * InputManager - Handles keyboard input with automatic projectile firing
 * Supports simultaneous key presses and provides game state-aware input processing
 */
export class InputManager {
    constructor() {
        // Current key states
        this.keys = new Map();
        this.previousKeys = new Map();

        // Key bindings - easily configurable
        this.keyBindings = {
            rotateLeft: ['ArrowLeft', 'KeyA'],
            rotateRight: ['ArrowRight', 'KeyD'],
            thrust: ['ArrowUp', 'KeyW'],
            pause: ['KeyP'],
            escape: ['Escape']
        };

        // Input state tracking
        this.lastUpdateTime = 0;
        this.inputEnabled = true;

        // Auto-firing management
        this.autoFireEnabled = true;

        // Initialize event listeners
        this.setupEventListeners();
    }

    /**
     * Set up keyboard event listeners
     */
    setupEventListeners() {
        // Prevent default browser behavior for game keys
        document.addEventListener('keydown', (event) => {
            if (this.isGameKey(event.code)) {
                event.preventDefault();
            }
            this.handleKeyDown(event);
        });

        document.addEventListener('keyup', (event) => {
            if (this.isGameKey(event.code)) {
                event.preventDefault();
            }
            this.handleKeyUp(event);
        });

        // Handle focus events to prevent stuck keys
        window.addEventListener('blur', () => {
            this.clearAllKeys();
        });

        window.addEventListener('focus', () => {
            this.clearAllKeys();
        });
    }

    /**
     * Handle keydown events
     * @param {KeyboardEvent} event Keyboard event
     */
    handleKeyDown(event) {
        if (!this.inputEnabled) return;
        this.keys.set(event.code, true);
    }

    /**
     * Handle keyup events
     * @param {KeyboardEvent} event Keyboard event
     */
    handleKeyUp(event) {
        if (!this.inputEnabled) return;
        this.keys.set(event.code, false);
    }

    /**
     * Process input and update game entities
     * @param {Object} inputState Current input processing state
     * @returns {Object} Input processing results
     */
    processInput(inputState) {
        const { ship, gameState, deltaTime, currentTime } = inputState;
        const actions = [];
        let shipUpdated = false;
        let newProjectile = null;

        // Simple pause toggle
        if (this.isPressed('pause') && this.wasJustPressed('pause')) {
            actions.push('toggle-pause');
        }

        // Process escape (menu) even when paused
        if (this.isPressed('escape') && this.wasJustPressed('escape')) {
            actions.push('escape');
        }

        // Skip ship-related input processing if game is paused, but still return actions
        if (gameState && gameState.isPaused) {
            // Update previous key states for next frame before returning
            this.updatePreviousKeys();
            return { actions, shipUpdated, newProjectile };
        }

        // Skip ship-related input if ship doesn't exist
        if (!ship) {
            // Update previous key states for next frame before returning
            this.updatePreviousKeys();
            return { actions, shipUpdated, newProjectile };
        }

        // Process ship rotation
        if (this.isPressed('rotateLeft')) {
            ship.rotateLeft(deltaTime);
            actions.push('rotate-left');
            shipUpdated = true;
        }

        if (this.isPressed('rotateRight')) {
            ship.rotateRight(deltaTime);
            actions.push('rotate-right');
            shipUpdated = true;
        }

        // Process ship thrust
        if (this.isPressed('thrust')) {
            ship.thrust();
            actions.push('thrust');
            shipUpdated = true;
        } else {
            ship.stopThrust();
        }

        // Process automatic projectile firing
        if (this.autoFireEnabled && ship.canFire(currentTime)) {
            newProjectile = ship.createProjectile(currentTime);
            if (newProjectile) {
                actions.push('auto-fire');
            }
        }


        // Update previous key states for next frame
        this.updatePreviousKeys();

        return {
            actions,
            shipUpdated,
            newProjectile
        };
    }

    /**
     * Check if any keys for an action are currently pressed
     * @param {string} action Action name from key bindings
     * @returns {boolean} True if action key is pressed
     */
    isPressed(action) {
        const keyCodes = this.keyBindings[action];
        if (!keyCodes) return false;

        return keyCodes.some(keyCode => this.keys.get(keyCode) === true);
    }

    /**
     * Check if any keys for an action were just pressed this frame
     * @param {string} action Action name from key bindings
     * @returns {boolean} True if action key was just pressed
     */
    wasJustPressed(action) {
        const keyCodes = this.keyBindings[action];
        if (!keyCodes) return false;

        return keyCodes.some(keyCode =>
            this.keys.get(keyCode) === true &&
            this.previousKeys.get(keyCode) !== true
        );
    }

    /**
     * Check if any keys for an action were just released this frame
     * @param {string} action Action name from key bindings
     * @returns {boolean} True if action key was just released
     */
    wasJustReleased(action) {
        const keyCodes = this.keyBindings[action];
        if (!keyCodes) return false;

        return keyCodes.some(keyCode =>
            this.keys.get(keyCode) !== true &&
            this.previousKeys.get(keyCode) === true
        );
    }

    /**
     * Check if a specific key code is currently pressed
     * @param {string} keyCode Key code to check
     * @returns {boolean} True if key is pressed
     */
    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) === true;
    }

    /**
     * Update previous key states for frame comparison
     */
    updatePreviousKeys() {
        this.previousKeys.clear();
        for (const [key, value] of this.keys) {
            this.previousKeys.set(key, value);
        }
    }

    /**
     * Clear all key states (useful for focus events)
     */
    clearAllKeys() {
        this.keys.clear();
        this.previousKeys.clear();
    }

    /**
     * Check if a key code is used by the game
     * @param {string} keyCode Key code to check
     * @returns {boolean} True if key is used by game
     */
    isGameKey(keyCode) {
        const allGameKeys = Object.values(this.keyBindings).flat();
        return allGameKeys.includes(keyCode);
    }

    /**
     * Enable or disable input processing
     * @param {boolean} enabled Whether input should be processed
     */
    setInputEnabled(enabled) {
        this.inputEnabled = enabled;
        if (!enabled) {
            this.clearAllKeys();
        }
    }

    /**
     * Enable or disable automatic projectile firing
     * @param {boolean} enabled Whether auto-firing should be active
     */
    setAutoFireEnabled(enabled) {
        this.autoFireEnabled = enabled;
    }


    /**
     * Update key bindings configuration
     * @param {Object} newBindings New key binding configuration
     */
    updateKeyBindings(newBindings) {
        this.keyBindings = { ...this.keyBindings, ...newBindings };
    }

    /**
     * Get key binding for an action
     * @param {string} action Action name
     * @returns {Array<string>} Array of key codes for the action
     */
    getKeyBinding(action) {
        return this.keyBindings[action] || [];
    }

    /**
     * Add additional key binding for an action
     * @param {string} action Action name
     * @param {string} keyCode Key code to add
     */
    addKeyBinding(action, keyCode) {
        if (!this.keyBindings[action]) {
            this.keyBindings[action] = [];
        }
        if (!this.keyBindings[action].includes(keyCode)) {
            this.keyBindings[action].push(keyCode);
        }
    }

    /**
     * Remove key binding for an action
     * @param {string} action Action name
     * @param {string} keyCode Key code to remove
     */
    removeKeyBinding(action, keyCode) {
        if (this.keyBindings[action]) {
            this.keyBindings[action] = this.keyBindings[action].filter(k => k !== keyCode);
        }
    }

    /**
     * Reset key bindings to default
     */
    resetKeyBindings() {
        this.keyBindings = {
            rotateLeft: ['ArrowLeft', 'KeyA'],
            rotateRight: ['ArrowRight', 'KeyD'],
            thrust: ['ArrowUp', 'KeyW'],
            pause: ['KeyP'],
            escape: ['Escape']
        };
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        // Remove event listeners if needed
        // Note: In this implementation, we use document-level listeners
        // which typically don't need explicit cleanup in browser games
        this.clearAllKeys();
        this.inputEnabled = false;
    }
}
