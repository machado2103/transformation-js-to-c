import { Vector2D } from '../lib/Vector2D.js';

/**
 * Ship - Player-controlled spacecraft with automatic projectile firing
 * Handles movement, rotation, thrust, collision detection, and invulnerability
 */
export class Ship {
    constructor(options = {}) {
        // Position and movement
        this.position = options.position instanceof Vector2D
            ? options.position
            : new Vector2D(options.position?.x || 400, options.position?.y || 300);
        this.velocity = options.velocity instanceof Vector2D
            ? options.velocity
            : new Vector2D(options.velocity?.x || 0, options.velocity?.y || 0);
        this.rotation = options.rotation || 0; // Radians

        // Physical properties
        this.radius = options.radius || 12;
        this.thrustPower = options.thrustPower || 200; // pixels/second²
        this.rotationSpeed = options.rotationSpeed || Math.PI; // radians/second (180°/s)
        this.maxVelocity = options.maxVelocity || 300; // pixels/second
        this.drag = options.drag || 0.98; // Velocity decay factor

        // Visual properties
        this.color = options.color || '#00FF88';
        this.size = options.size || 15;

        // State
        this.isThrusting = false;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
        this.invulnerabilityDuration = 2000; // 2 seconds in milliseconds

        // Automatic firing
        this.lastFireTime = 0;
        this.fireRate = 250; // milliseconds between shots (4 shots per second)
        this.projectileSpeed = 400; // pixels/second

        // Screen bounds for wrapping
        this.screenWidth = options.screenWidth || 800;
        this.screenHeight = options.screenHeight || 600;
    }

    /**
     * Update ship physics and state
     * @param {number} deltaTime Time elapsed since last frame (milliseconds)
     */
    update(deltaTime) {
        const deltaSeconds = deltaTime / 1000;

        // Apply thrust if active
        if (this.isThrusting) {
            const thrustVector = Vector2D.fromAngle(this.rotation, this.thrustPower * deltaSeconds);
            this.velocity.add(thrustVector);
        }

        // Apply velocity to position
        const movement = this.velocity.clone().multiply(deltaSeconds);
        this.position.add(movement);

        // Apply drag
        this.velocity.multiply(this.drag);

        // Limit maximum velocity
        this.velocity.limit(this.maxVelocity);

        // Handle screen wrapping
        this.wrapScreenEdges();

        // Update invulnerability timer
        if (this.isInvulnerable) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
                this.invulnerabilityTimer = 0;
            }
        }
    }

    /**
     * Apply thrust force in the direction the ship is facing
     */
    thrust() {
        this.isThrusting = true;
    }

    /**
     * Stop applying thrust
     */
    stopThrust() {
        this.isThrusting = false;
    }

    /**
     * Rotate the ship counter-clockwise
     * @param {number} deltaTime Time elapsed since last frame (milliseconds)
     */
    rotateLeft(deltaTime) {
        this.rotation -= this.rotationSpeed * (deltaTime / 1000);
    }

    /**
     * Rotate the ship clockwise
     * @param {number} deltaTime Time elapsed since last frame (milliseconds)
     */
    rotateRight(deltaTime) {
        this.rotation += this.rotationSpeed * (deltaTime / 1000);
    }

    /**
     * Check if ship can fire a projectile (automatic firing)
     * @param {number} currentTime Current timestamp
     * @returns {boolean} True if ship can fire
     */
    canFire(currentTime) {
        return currentTime - this.lastFireTime >= this.fireRate;
    }

    /**
     * Create a projectile fired from this ship (automatic firing)
     * @param {number} currentTime Current timestamp
     * @returns {Object|null} Projectile data or null if can't fire
     */
    createProjectile(currentTime) {
        if (!this.canFire(currentTime)) {
            return null;
        }

        this.lastFireTime = currentTime;

        // Calculate projectile starting position (front of ship)
        const offset = Vector2D.fromAngle(this.rotation, this.radius + 5);
        const projectilePosition = this.position.clone().add(offset);

        // Calculate projectile velocity (ship's velocity + projectile speed)
        const projectileVelocity = this.velocity.clone();
        const projectileDirection = Vector2D.fromAngle(this.rotation, this.projectileSpeed);
        projectileVelocity.add(projectileDirection);

        return {
            position: projectilePosition,
            velocity: projectileVelocity,
            rotation: this.rotation
        };
    }

    /**
     * Handle collision with another object
     * @param {Object} other The object that was collided with
     */
    onCollision(other) {
        if (this.isInvulnerable) {
            return false; // No collision during invulnerability
        }

        // Handle collision based on object type
        if (other.type === 'asteroid') {
            this.destroy();
            return true;
        }

        return false;
    }

    /**
     * Destroy the ship and trigger respawn
     */
    destroy() {
        this.respawn();
    }

    /**
     * Respawn the ship at center with invulnerability
     */
    respawn() {
        // Reset position to center
        this.position.set(this.screenWidth / 2, this.screenHeight / 2);

        // Reset velocity
        this.velocity.zero();

        // Reset rotation to facing up
        this.rotation = -Math.PI / 2;

        // Stop thrust
        this.isThrusting = false;

        // Enable invulnerability
        this.isInvulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;
    }

    /**
     * Wrap ship position around screen edges
     */
    wrapScreenEdges() {
        if (this.position.x < 0) {
            this.position.x = this.screenWidth;
        } else if (this.position.x > this.screenWidth) {
            this.position.x = 0;
        }

        if (this.position.y < 0) {
            this.position.y = this.screenHeight;
        } else if (this.position.y > this.screenHeight) {
            this.position.y = 0;
        }
    }

    /**
     * Get circular collision boundary
     * @returns {Object} Collision bounds with position and radius
     */
    getBounds() {
        return {
            x: this.position.x,
            y: this.position.y,
            radius: this.radius
        };
    }

    /**
     * Draw the ship on the canvas
     * @param {CanvasRenderingContext2D} context Canvas rendering context
     */
    draw(context) {
        context.save();

        // Move to ship position
        context.translate(this.position.x, this.position.y);
        context.rotate(this.rotation);

        // Set ship color and style
        context.strokeStyle = this.color;
        context.fillStyle = this.isInvulnerable ?
            (Math.floor(Date.now() / 100) % 2 ? this.color : 'transparent') : // Flashing effect
            'transparent';
        context.lineWidth = 2;

        // Draw ship triangle
        context.beginPath();
        context.moveTo(this.size, 0); // Front point
        context.lineTo(-this.size * 0.7, -this.size * 0.7); // Top back
        context.lineTo(-this.size * 0.3, 0); // Back center
        context.lineTo(-this.size * 0.7, this.size * 0.7); // Bottom back
        context.closePath();

        context.stroke();
        if (!this.isInvulnerable || Math.floor(Date.now() / 100) % 2) {
            context.fill();
        }

        // Draw thrust flame if thrusting
        if (this.isThrusting) {
            context.strokeStyle = '#FF4400';
            context.fillStyle = '#FF8800';
            context.lineWidth = 1;

            const flameLength = this.size * 0.8 + Math.random() * 4;
            context.beginPath();
            context.moveTo(-this.size * 0.3, 0);
            context.lineTo(-this.size * 0.3 - flameLength, -3);
            context.lineTo(-this.size * 0.3 - flameLength * 0.8, 0);
            context.lineTo(-this.size * 0.3 - flameLength, 3);
            context.closePath();

            context.fill();
            context.stroke();
        }

        context.restore();
    }

    /**
     * Get ship configuration for serialization
     * @returns {Object} Ship configuration
     */
    getConfig() {
        return {
            position: { x: this.position.x, y: this.position.y },
            velocity: { x: this.velocity.x, y: this.velocity.y },
            rotation: this.rotation,
            color: this.color,
            isInvulnerable: this.isInvulnerable,
            invulnerabilityTimer: this.invulnerabilityTimer
        };
    }

    /**
     * Set ship configuration from saved data
     * @param {Object} config Ship configuration
     */
    setConfig(config) {
        this.position.set(config.position.x, config.position.y);
        this.velocity.set(config.velocity.x, config.velocity.y);
        this.rotation = config.rotation;
        this.color = config.color || this.color;
        this.isInvulnerable = config.isInvulnerable || false;
        this.invulnerabilityTimer = config.invulnerabilityTimer || 0;
    }
}
