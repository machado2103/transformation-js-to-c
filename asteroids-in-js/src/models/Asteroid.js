import { Vector2D } from '../lib/Vector2D.js';

/**
 * Asteroid - Destructible space rocks with procedural generation and splitting mechanics
 * Features procedurally generated shapes, rainbow colors, and authentic splitting behavior
 */
export class Asteroid {
    constructor(options = {}) {
        // Position and movement
        this.position = options.position || new Vector2D(0, 0);
        this.velocity = options.velocity || new Vector2D(0, 0);
        this.angularVelocity = options.angularVelocity || (Math.random() - 0.5) * 2; // radians/second
        this.rotation = options.rotation || 0;

        // Size category and properties
        this.size = options.size || 'large'; // 'large', 'medium', 'small'
        this.setupSizeProperties();

        // Procedural shape generation
        this.vertices = options.vertices || this.generateShape();

        // Visual properties
        this.color = options.color || this.generateColor();

        // Game properties
        this.type = 'asteroid';
        this.isActive = true;

        // Screen bounds for wrapping
        this.screenWidth = options.screenWidth || 800;
        this.screenHeight = options.screenHeight || 600;
    }

    /**
     * Set up size-dependent properties
     */
    setupSizeProperties() {
        switch (this.size) {
            case 'large':
                this.radius = 40 + Math.random() * 10;
                this.pointValue = 20;
                this.splitCount = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
                break;
            case 'medium':
                this.radius = 25 + Math.random() * 8;
                this.pointValue = 50;
                this.splitCount = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
                break;
            case 'small':
                this.radius = 12 + Math.random() * 5;
                this.pointValue = 100;
                this.splitCount = 0; // Small asteroids don't split
                break;
        }
    }

    /**
     * Generate procedural asteroid shape using polar coordinates
     * @returns {Array<Vector2D>} Array of vertices defining the asteroid shape
     */
    generateShape() {
        const vertices = [];
        const vertexCount = 8 + Math.floor(Math.random() * 5); // 8-12 vertices

        for (let i = 0; i < vertexCount; i++) {
            const angle = (i / vertexCount) * Math.PI * 2;

            // Apply random perturbation to radius (60-140% of base radius)
            const radiusVariation = 0.6 + Math.random() * 0.8;
            const vertexRadius = this.radius * radiusVariation;

            // Convert polar to cartesian coordinates
            const x = Math.cos(angle) * vertexRadius;
            const y = Math.sin(angle) * vertexRadius;

            vertices.push(new Vector2D(x, y));
        }

        return vertices;
    }

    /**
     * Generate rainbow color from curated HSL palette
     * @returns {string} CSS color string
     */
    generateColor() {
        // Soft rainbow colors with consistent saturation and lightness
        const hue = Math.floor(Math.random() * 360);
        const saturation = 60 + Math.random() * 20; // 60-80%
        const lightness = 50 + Math.random() * 20;  // 50-70%

        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    /**
     * Update asteroid physics and state
     * @param {number} deltaTime Time elapsed since last frame (milliseconds)
     */
    update(deltaTime) {
        if (!this.isActive) return;

        const deltaSeconds = deltaTime / 1000;

        // Update position based on velocity
        const movement = this.velocity.clone().multiply(deltaSeconds);
        this.position.add(movement);

        // Update rotation
        this.rotation += this.angularVelocity * deltaSeconds;

        // Handle screen wrapping
        this.wrapScreenEdges();
    }

    /**
     * Split asteroid into smaller pieces when destroyed
     * @returns {Array<Asteroid>} Array of smaller asteroids
     */
    split() {
        if (this.splitCount === 0) {
            return []; // Small asteroids don't split
        }

        const fragments = [];
        const nextSize = this.size === 'large' ? 'medium' : 'small';

        for (let i = 0; i < this.splitCount; i++) {
            // Calculate fragment velocity with inherited momentum
            const angle = (i / this.splitCount) * Math.PI * 2 + Math.random() * 0.5;
            const speed = 50 + Math.random() * 100; // Random speed for fragments
            const fragmentVelocity = Vector2D.fromAngle(angle, speed);

            // Add some of parent's velocity
            fragmentVelocity.add(this.velocity.clone().multiply(0.3));

            // Create fragment with slight position offset
            const offsetDistance = this.radius * 0.3;
            const offset = Vector2D.fromAngle(angle, offsetDistance);
            const fragmentPosition = this.position.clone().add(offset);

            const fragment = new Asteroid({
                position: fragmentPosition,
                velocity: fragmentVelocity,
                angularVelocity: (Math.random() - 0.5) * 4,
                size: nextSize,
                screenWidth: this.screenWidth,
                screenHeight: this.screenHeight
            });

            fragments.push(fragment);
        }

        // Deactivate this asteroid
        this.isActive = false;

        return fragments;
    }

    /**
     * Handle collision with another object
     * @param {Object} other The object that was collided with
     * @returns {boolean} True if collision should be processed
     */
    onCollision(other) {
        if (!this.isActive) return false;

        if (other.type === 'projectile') {
            return this.destroy();
        }

        return true; // Other collisions (ship, etc.) are handled by the other object
    }

    /**
     * Destroy this asteroid (called by EntityManager for proper fragment handling)
     * @returns {boolean} True to indicate collision was processed
     */
    destroy() {
        this.isActive = false;
        return true;
    }

    /**
     * Wrap asteroid position around screen edges
     */
    wrapScreenEdges() {
        const buffer = this.radius; // Allow asteroid to partially exit before wrapping

        if (this.position.x < -buffer) {
            this.position.x = this.screenWidth + buffer;
        } else if (this.position.x > this.screenWidth + buffer) {
            this.position.x = -buffer;
        }

        if (this.position.y < -buffer) {
            this.position.y = this.screenHeight + buffer;
        } else if (this.position.y > this.screenHeight + buffer) {
            this.position.y = -buffer;
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
     * Draw the asteroid on the canvas
     * @param {CanvasRenderingContext2D} context Canvas rendering context
     */
    draw(context) {
        if (!this.isActive) return;

        context.save();

        // Move to asteroid position and apply rotation
        context.translate(this.position.x, this.position.y);
        context.rotate(this.rotation);

        // Set asteroid color and style
        context.strokeStyle = this.color;
        context.fillStyle = this.color;
        context.globalAlpha = 0.8;
        context.lineWidth = 2;

        // Draw procedural asteroid shape
        if (this.vertices.length > 0) {
            context.beginPath();
            context.moveTo(this.vertices[0].x, this.vertices[0].y);

            for (let i = 1; i < this.vertices.length; i++) {
                context.lineTo(this.vertices[i].x, this.vertices[i].y);
            }

            context.closePath();
            context.fill();
            context.stroke();
        }

        context.restore();
    }

    /**
     * Create a random asteroid at a safe distance from the player
     * @param {Vector2D} playerPosition Player's current position
     * @param {string} size Asteroid size ('large', 'medium', 'small')
     * @param {number} screenWidth Screen width
     * @param {number} screenHeight Screen height
     * @param {number} safeDistance Minimum distance from player
     * @returns {Asteroid} New asteroid instance
     */
    static createRandom(playerPosition, size = 'large', screenWidth = 800, screenHeight = 600, safeDistance = 100) {
        let position;
        let attempts = 0;
        const maxAttempts = 50;

        // Find a safe spawn position
        do {
            position = new Vector2D(
                Math.random() * screenWidth,
                Math.random() * screenHeight
            );
            attempts++;
        } while (
            position.distanceTo(playerPosition) < safeDistance &&
            attempts < maxAttempts
        );

        // Generate random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 40;
        const velocity = Vector2D.fromAngle(angle, speed);

        return new Asteroid({
            position,
            velocity,
            size,
            screenWidth,
            screenHeight
        });
    }

    /**
     * Create an asteroid field with multiple asteroids
     * @param {number} count Number of asteroids to create
     * @param {Vector2D} playerPosition Player's current position
     * @param {string} difficulty Difficulty level ('easy', 'medium', 'hard')
     * @param {number} screenWidth Screen width
     * @param {number} screenHeight Screen height
     * @returns {Array<Asteroid>} Array of asteroid instances
     */
    static createField(count, playerPosition, difficulty = 'medium', screenWidth = 800, screenHeight = 600) {
        const asteroids = [];

        // Size distribution based on difficulty
        const sizeDistribution = {
            easy: ['large', 'large', 'large', 'medium'],
            medium: ['large', 'large', 'medium', 'medium', 'small'],
            hard: ['large', 'medium', 'medium', 'small', 'small', 'small']
        };

        const sizes = sizeDistribution[difficulty] || sizeDistribution.medium;

        for (let i = 0; i < count; i++) {
            const size = sizes[i % sizes.length];
            const asteroid = Asteroid.createRandom(
                playerPosition,
                size,
                screenWidth,
                screenHeight,
                120 // Safe distance
            );
            asteroids.push(asteroid);
        }

        return asteroids;
    }

    /**
     * Get asteroid configuration for serialization
     * @returns {Object} Asteroid configuration
     */
    getConfig() {
        return {
            position: { x: this.position.x, y: this.position.y },
            velocity: { x: this.velocity.x, y: this.velocity.y },
            rotation: this.rotation,
            angularVelocity: this.angularVelocity,
            size: this.size,
            color: this.color,
            vertices: this.vertices.map(v => ({ x: v.x, y: v.y })),
            isActive: this.isActive
        };
    }
}
