import { Vector2D } from '../lib/Vector2D.js';

/**
 * Particle - Visual effects for explosions and destruction feedback
 * Features alpha decay, size reduction, and color inheritance from destroyed objects
 */
export class Particle {
    constructor(options = {}) {
        // Position and movement
        this.position = options.position || new Vector2D(0, 0);
        this.velocity = options.velocity || new Vector2D(0, 0);

        // Visual properties
        this.color = options.color || '#FFFFFF';
        this.size = options.size || 3;
        this.initialSize = this.size;
        this.alpha = options.alpha || 1.0;
        this.initialAlpha = this.alpha;

        // Lifespan management
        this.lifespan = options.lifespan || 1000; // 1 second in milliseconds
        this.age = 0;

        // Physics properties
        this.drag = options.drag || 0.95; // Velocity decay factor
        this.gravity = options.gravity || new Vector2D(0, 0); // Optional gravity effect

        // State
        this.isActive = true;
        this.type = 'particle';

        // Visual effects
        this.fadeOut = options.fadeOut !== false; // Whether to fade alpha over time
        this.shrink = options.shrink !== false;   // Whether to shrink size over time
    }

    /**
     * Update particle position, size, and alpha over time
     * @param {number} deltaTime Time elapsed since last frame (milliseconds)
     */
    update(deltaTime) {
        if (!this.isActive) return;

        const deltaSeconds = deltaTime / 1000;

        // Update age
        this.age += deltaTime;

        // Check if particle has expired
        if (this.age >= this.lifespan) {
            this.deactivate();
            return;
        }

        // Calculate life progress (0 to 1)
        const lifeProgress = this.age / this.lifespan;

        // Update position based on velocity
        const movement = this.velocity.clone().multiply(deltaSeconds);
        this.position.add(movement);

        // Apply gravity if present
        if (this.gravity.magnitude() > 0) {
            const gravityEffect = this.gravity.clone().multiply(deltaSeconds);
            this.velocity.add(gravityEffect);
        }

        // Apply drag to velocity
        this.velocity.multiply(this.drag);

        // Update alpha (fade out over time)
        if (this.fadeOut) {
            this.alpha = this.initialAlpha * (1 - lifeProgress);
        }

        // Update size (shrink over time)
        if (this.shrink) {
            this.size = this.initialSize * (1 - lifeProgress * 0.5); // Shrink to 50% of original size
        }
    }

    /**
     * Deactivate this particle for cleanup
     */
    deactivate() {
        this.isActive = false;
    }

    /**
     * Check if particle is expired and should be removed
     * @returns {boolean} True if particle should be removed
     */
    isExpired() {
        return !this.isActive || this.age >= this.lifespan;
    }

    /**
     * Draw the particle on the canvas
     * @param {CanvasRenderingContext2D} context Canvas rendering context
     */
    draw(context) {
        if (!this.isActive || this.alpha <= 0 || this.size <= 0) return;

        context.save();

        // Set alpha blending for particle effect
        context.globalAlpha = this.alpha;
        context.fillStyle = this.color;

        // Draw particle as a circle
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    /**
     * Draw particle with glow effect
     * @param {CanvasRenderingContext2D} context Canvas rendering context
     */
    drawWithGlow(context) {
        if (!this.isActive || this.alpha <= 0 || this.size <= 0) return;

        context.save();

        // Draw glow effect (larger, more transparent)
        context.globalAlpha = this.alpha * 0.3;
        context.fillStyle = this.color;

        context.beginPath();
        context.arc(this.position.x, this.position.y, this.size * 2, 0, Math.PI * 2);
        context.fill();

        // Draw main particle
        context.globalAlpha = this.alpha;
        context.beginPath();
        context.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
        context.fill();

        context.restore();
    }

    /**
     * Draw particle as a square (alternative shape)
     * @param {CanvasRenderingContext2D} context Canvas rendering context
     */
    drawAsSquare(context) {
        if (!this.isActive || this.alpha <= 0 || this.size <= 0) return;

        context.save();

        context.globalAlpha = this.alpha;
        context.fillStyle = this.color;

        const halfSize = this.size / 2;
        context.fillRect(
            this.position.x - halfSize,
            this.position.y - halfSize,
            this.size,
            this.size
        );

        context.restore();
    }

    /**
     * Create an explosion effect with multiple particles
     * @param {Vector2D} position Center position of explosion
     * @param {string} color Base color for particles
     * @param {number} count Number of particles to create
     * @param {Object} options Additional options
     * @returns {Array<Particle>} Array of particle instances
     */
    static createExplosion(position, color = '#FFFFFF', count = 8, options = {}) {
        const particles = [];

        const baseSpeed = options.speed || 100;
        const speedVariation = options.speedVariation || 50;
        const lifespan = options.lifespan || 1000;
        const size = options.size || 3;

        for (let i = 0; i < count; i++) {
            // Random direction
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            const speed = baseSpeed + (Math.random() - 0.5) * speedVariation;
            const velocity = Vector2D.fromAngle(angle, speed);

            // Add slight position offset
            const offset = Vector2D.fromAngle(angle, Math.random() * 5);
            const particlePosition = position.clone().add(offset);

            // Create particle with random variations
            const particle = new Particle({
                position: particlePosition,
                velocity,
                color,
                size: size + Math.random() * 2,
                lifespan: lifespan + (Math.random() - 0.5) * 500,
                drag: 0.92 + Math.random() * 0.05,
                ...options
            });

            particles.push(particle);
        }

        return particles;
    }

    /**
     * Create a debris field effect
     * @param {Vector2D} position Center position
     * @param {Vector2D} velocity Initial velocity to inherit
     * @param {string} color Base color
     * @param {number} count Number of debris particles
     * @param {Object} options Additional options
     * @returns {Array<Particle>} Array of debris particles
     */
    static createDebris(position, velocity, color = '#888888', count = 6, options = {}) {
        const particles = [];

        for (let i = 0; i < count; i++) {
            // Random direction with some inheritance from original velocity
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 70;
            const debrisVelocity = Vector2D.fromAngle(angle, speed);

            // Add portion of original velocity
            debrisVelocity.add(velocity.clone().multiply(0.3));

            const particle = new Particle({
                position: position.clone(),
                velocity: debrisVelocity,
                color,
                size: 2 + Math.random() * 3,
                lifespan: 800 + Math.random() * 600,
                drag: 0.90,
                shrink: false, // Debris doesn't shrink
                ...options
            });

            particles.push(particle);
        }

        return particles;
    }

    /**
     * Create sparks effect for impacts
     * @param {Vector2D} position Impact position
     * @param {Vector2D} direction Impact direction
     * @param {string} color Spark color
     * @param {number} count Number of sparks
     * @param {Object} options Additional options
     * @returns {Array<Particle>} Array of spark particles
     */
    static createSparks(position, direction, color = '#FFFF00', count = 5, options = {}) {
        const particles = [];

        const baseAngle = direction.angle();
        const spreadAngle = options.spread || Math.PI / 3; // 60 degree spread

        for (let i = 0; i < count; i++) {
            // Create sparks in a cone from the impact direction
            const angleOffset = (Math.random() - 0.5) * spreadAngle;
            const sparkAngle = baseAngle + Math.PI + angleOffset; // Sparks fly backward from impact
            const speed = 80 + Math.random() * 40;
            const velocity = Vector2D.fromAngle(sparkAngle, speed);

            const particle = new Particle({
                position: position.clone(),
                velocity,
                color,
                size: 1 + Math.random() * 2,
                lifespan: 400 + Math.random() * 300,
                drag: 0.85,
                ...options
            });

            particles.push(particle);
        }

        return particles;
    }

    /**
     * Get particle configuration for serialization
     * @returns {Object} Particle configuration
     */
    getConfig() {
        return {
            position: { x: this.position.x, y: this.position.y },
            velocity: { x: this.velocity.x, y: this.velocity.y },
            color: this.color,
            size: this.size,
            alpha: this.alpha,
            age: this.age,
            lifespan: this.lifespan,
            isActive: this.isActive
        };
    }
}
