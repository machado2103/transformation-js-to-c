import { Vector2D } from '../lib/Vector2D.js';

/**
 * Projectile - Fast-moving bullets fired automatically by the player ship
 * Features limited lifespan, collision detection, and automatic cleanup
 */
export class Projectile {
    constructor(options = {}) {
        // Position and movement
        this.position = options.position || new Vector2D(0, 0);
        this.velocity = options.velocity || new Vector2D(0, 0);
        this.speed = options.speed || 400; // pixels/second

        // Physical properties
        this.radius = options.radius || 3;
        this.size = options.size || 2;

        // Lifespan management
        this.lifespan = options.lifespan || 2000; // 2 seconds in milliseconds
        this.age = 0;
        this.maxDistance = options.maxDistance || 1000; // Maximum travel distance

        // State
        this.isActive = true;
        this.type = 'projectile';

        // Visual properties
        this.color = options.color || '#FFFFFF';

        // Screen bounds for cleanup
        this.screenWidth = options.screenWidth || 800;
        this.screenHeight = options.screenHeight || 600;

        // Track starting position for distance calculation
        this.startPosition = this.position.clone();
    }

    /**
     * Update projectile position and lifespan
     * @param {number} deltaTime Time elapsed since last frame (milliseconds)
     */
    update(deltaTime) {
        if (!this.isActive) return;

        const deltaSeconds = deltaTime / 1000;

        // Update position based on velocity
        const movement = this.velocity.clone().multiply(deltaSeconds);
        this.position.add(movement);

        // Update age
        this.age += deltaTime;

        // Check lifespan expiration
        if (this.age >= this.lifespan) {
            this.deactivate();
            return;
        }

        // Check maximum distance traveled
        const distanceTraveled = this.position.distanceTo(this.startPosition);
        if (distanceTraveled >= this.maxDistance) {
            this.deactivate();
            return;
        }

        // Check if projectile is far outside screen bounds
        const buffer = 50;
        if (this.position.x < -buffer ||
            this.position.x > this.screenWidth + buffer ||
            this.position.y < -buffer ||
            this.position.y > this.screenHeight + buffer) {
            this.deactivate();
            return;
        }
    }

    /**
     * Handle collision with another object
     * @param {Object} other The object that was collided with
     * @returns {boolean} True if collision should be processed
     */
    onCollision(other) {
        if (!this.isActive) return false;

        if (other.type === 'asteroid') {
            this.destroy();
            return true;
        }

        return false;
    }

    /**
     * Destroy this projectile
     */
    destroy() {
        this.deactivate();
    }

    /**
     * Deactivate this projectile for cleanup
     */
    deactivate() {
        this.isActive = false;
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
     * Draw the projectile on the canvas
     * @param {CanvasRenderingContext2D} context Canvas rendering context
     */
    draw(context) {
        if (!this.isActive) return;

        context.save();

        // Set projectile color
        context.fillStyle = this.color;
        context.strokeStyle = this.color;

        // Draw as a small circle
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        context.fill();

        // Optional: Add a subtle glow effect
        context.globalAlpha = 0.3;
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.size * 2, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    /**
     * Draw projectile with motion blur effect (alternative rendering)
     * @param {CanvasRenderingContext2D} context Canvas rendering context
     */
    drawWithTrail(context) {
        if (!this.isActive) return;

        context.save();

        // Calculate trail direction (opposite to velocity)
        const trailLength = 8;
        const trailDirection = this.velocity.clone().normalize().multiply(-trailLength);
        const trailStart = this.position.clone().add(trailDirection);

        // Draw trail
        context.strokeStyle = this.color;
        context.lineWidth = 1;
        context.globalAlpha = 0.5;

        context.beginPath();
        context.moveTo(trailStart.x, trailStart.y);
        context.lineTo(this.position.x, this.position.y);
        context.stroke();

        // Draw projectile head
        context.globalAlpha = 1;
        context.fillStyle = this.color;

        context.beginPath();
        context.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    /**
     * Check if projectile is expired and should be removed
     * @returns {boolean} True if projectile should be removed
     */
    isExpired() {
        return !this.isActive || this.age >= this.lifespan;
    }

    /**
     * Get remaining lifespan as a percentage
     * @returns {number} Remaining lifespan (0-1)
     */
    getLifespanPercentage() {
        return Math.max(0, 1 - (this.age / this.lifespan));
    }

    /**
     * Create a projectile from ship position and direction
     * @param {Vector2D} position Starting position
     * @param {Vector2D} velocity Starting velocity
     * @param {Object} options Additional options
     * @returns {Projectile} New projectile instance
     */
    static createFromShip(position, velocity, options = {}) {
        return new Projectile({
            position: position.clone(),
            velocity: velocity.clone(),
            ...options
        });
    }

    /**
     * Create multiple projectiles (for potential spread shot or burst fire)
     * @param {Vector2D} position Starting position
     * @param {number} direction Base direction in radians
     * @param {number} speed Projectile speed
     * @param {number} count Number of projectiles
     * @param {number} spread Spread angle in radians
     * @param {Object} options Additional options
     * @returns {Array<Projectile>} Array of projectile instances
     */
    static createSpread(position, direction, speed, count = 3, spread = 0.3, options = {}) {
        const projectiles = [];

        for (let i = 0; i < count; i++) {
            const angleOffset = spread * (i - (count - 1) / 2) / (count - 1);
            const projectileDirection = direction + angleOffset;
            const velocity = Vector2D.fromAngle(projectileDirection, speed);

            const projectile = new Projectile({
                position: position.clone(),
                velocity,
                ...options
            });

            projectiles.push(projectile);
        }

        return projectiles;
    }

    /**
     * Get projectile configuration for serialization
     * @returns {Object} Projectile configuration
     */
    getConfig() {
        return {
            position: { x: this.position.x, y: this.position.y },
            velocity: { x: this.velocity.x, y: this.velocity.y },
            age: this.age,
            lifespan: this.lifespan,
            isActive: this.isActive,
            color: this.color
        };
    }

    /**
     * Set projectile configuration from saved data
     * @param {Object} config Projectile configuration
     */
    setConfig(config) {
        this.position.set(config.position.x, config.position.y);
        this.velocity.set(config.velocity.x, config.velocity.y);
        this.age = config.age || 0;
        this.lifespan = config.lifespan || this.lifespan;
        this.isActive = config.isActive !== false;
        this.color = config.color || this.color;
    }
}
