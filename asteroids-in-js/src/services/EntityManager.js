import { Asteroid } from '../models/Asteroid.js';
import { Projectile } from '../models/Projectile.js';
import { Particle } from '../models/Particle.js';

/**
 * EntityManager - Manages game object lifecycle and collections
 * Provides object pooling, entity tracking, and efficient collection management
 */
export class EntityManager {
    constructor(screenWidth = 800, screenHeight = 600) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        // Entity collections
        this.asteroids = [];
        this.projectiles = [];
        this.particles = [];

        // Object pools for performance optimization
        this.projectilePool = [];
        this.particlePool = [];
        this.maxPoolSize = 50;

        // Entity ID counter for unique identification
        this.nextEntityId = 1;

        // Performance tracking
        this.entitiesCreated = 0;
        this.entitiesDestroyed = 0;
        this.poolHits = 0;
        this.poolMisses = 0;
    }

    /**
     * Update all managed entities
     * @param {number} deltaTime Time elapsed since last frame
     */
    update(deltaTime) {
        // Update asteroids
        for (const asteroid of this.asteroids) {
            if (asteroid.isActive) {
                asteroid.update(deltaTime);
            }
        }

        // Update projectiles
        for (const projectile of this.projectiles) {
            if (projectile.isActive) {
                projectile.update(deltaTime);
            }
        }

        // Update particles
        for (const particle of this.particles) {
            if (particle.isActive) {
                particle.update(deltaTime);
            }
        }

        // Clean up inactive entities
        this.cleanupInactiveEntities();
    }

    /**
     * Create a new asteroid
     * @param {Object} options Asteroid creation options
     * @returns {Asteroid} Created asteroid instance
     */
    createAsteroid(options = {}) {
        const asteroid = new Asteroid({
            screenWidth: this.screenWidth,
            screenHeight: this.screenHeight,
            ...options
        });

        asteroid.id = this.nextEntityId++;
        this.asteroids.push(asteroid);
        this.entitiesCreated++;

        return asteroid;
    }

    /**
     * Create multiple asteroids for a level
     * @param {number} count Number of asteroids
     * @param {Object} playerPosition Player position to avoid
     * @param {string} difficulty Difficulty level
     * @returns {Array<Asteroid>} Created asteroids
     */
    createAsteroidField(count, playerPosition, difficulty = 'medium') {
        const asteroids = Asteroid.createField(
            count,
            playerPosition,
            difficulty,
            this.screenWidth,
            this.screenHeight
        );

        for (const asteroid of asteroids) {
            asteroid.id = this.nextEntityId++;
            this.asteroids.push(asteroid);
            this.entitiesCreated++;
        }

        return asteroids;
    }

    /**
     * Create a projectile (with object pooling)
     * @param {Object} options Projectile creation options
     * @returns {Projectile} Created or pooled projectile instance
     */
    createProjectile(options = {}) {
        let projectile;

        // Try to get from pool first
        if (this.projectilePool.length > 0) {
            projectile = this.projectilePool.pop();

            // Reset projectile properties
            projectile.position.set(options.position.x, options.position.y);
            projectile.velocity.set(options.velocity.x, options.velocity.y);
            projectile.age = 0;
            projectile.isActive = true;

            this.poolHits++;
        } else {
            // Create new projectile
            projectile = new Projectile({
                screenWidth: this.screenWidth,
                screenHeight: this.screenHeight,
                ...options
            });
            projectile.id = this.nextEntityId++;
            this.entitiesCreated++;
            this.poolMisses++;
        }

        this.projectiles.push(projectile);
        return projectile;
    }

    /**
     * Create particle effects (with object pooling)
     * @param {string} type Type of particle effect
     * @param {Object} options Particle creation options
     * @returns {Array<Particle>} Created particle instances
     */
    createParticleEffect(type, options = {}) {
        const particles = [];

        switch (type) {
            case 'explosion':
                particles.push(...this.createExplosionParticles(options));
                break;
            case 'debris':
                particles.push(...this.createDebrisParticles(options));
                break;
            case 'sparks':
                particles.push(...this.createSparkParticles(options));
                break;
            default:
                console.warn('Unknown particle effect type:', type);
        }

        return particles;
    }

    /**
     * Create explosion particle effect
     * @param {Object} options Explosion options
     * @returns {Array<Particle>} Explosion particles
     */
    createExplosionParticles(options) {
        const {
            position,
            color = '#FFFFFF',
            count = 8,
            speed = 100
        } = options;

        const particles = Particle.createExplosion(position, color, count, { speed });

        for (const particle of particles) {
            particle.id = this.nextEntityId++;
            this.particles.push(particle);
            this.entitiesCreated++;
        }

        return particles;
    }

    /**
     * Create debris particle effect
     * @param {Object} options Debris options
     * @returns {Array<Particle>} Debris particles
     */
    createDebrisParticles(options) {
        const {
            position,
            velocity,
            color = '#888888',
            count = 6
        } = options;

        const particles = Particle.createDebris(position, velocity, color, count);

        for (const particle of particles) {
            particle.id = this.nextEntityId++;
            this.particles.push(particle);
            this.entitiesCreated++;
        }

        return particles;
    }

    /**
     * Create spark particle effect
     * @param {Object} options Spark options
     * @returns {Array<Particle>} Spark particles
     */
    createSparkParticles(options) {
        const {
            position,
            direction,
            color = '#FFFF00',
            count = 5
        } = options;

        const particles = Particle.createSparks(position, direction, color, count);

        for (const particle of particles) {
            particle.id = this.nextEntityId++;
            this.particles.push(particle);
            this.entitiesCreated++;
        }

        return particles;
    }

    /**
     * Handle asteroid destruction and splitting
     * @param {Asteroid} asteroid Asteroid to destroy
     * @returns {Array<Asteroid>} New asteroid fragments
     */
    destroyAsteroid(asteroid) {
        // Create particle effects
        this.createParticleEffect('explosion', {
            position: asteroid.position,
            color: asteroid.color,
            count: 6 + Math.floor(asteroid.radius / 10)
        });

        // Create fragments if asteroid splits (asteroid.split() handles isActive check)
        const fragments = asteroid.split();

        for (const fragment of fragments) {
            fragment.id = this.nextEntityId++;
            this.asteroids.push(fragment);
            this.entitiesCreated++;
        }

        // Mark original asteroid as inactive
        asteroid.isActive = false;
        this.entitiesDestroyed++;

        return fragments;
    }

    /**
     * Destroy a projectile
     * @param {Projectile} projectile Projectile to destroy
     */
    destroyProjectile(projectile) {
        if (!projectile.isActive) return;

        // Create small spark effect
        this.createParticleEffect('sparks', {
            position: projectile.position,
            direction: projectile.velocity.normalized(),
            count: 3
        });

        projectile.isActive = false;
        this.entitiesDestroyed++;
    }

    /**
     * Get all active entities for rendering/physics
     * @returns {Array} All active entities
     */
    getAllActiveEntities() {
        const entities = [];

        // Add active asteroids
        for (const asteroid of this.asteroids) {
            if (asteroid.isActive) {
                entities.push(asteroid);
            }
        }

        // Add active projectiles
        for (const projectile of this.projectiles) {
            if (projectile.isActive) {
                entities.push(projectile);
            }
        }

        return entities;
    }

    /**
     * Get entities by type
     * @param {string} type Entity type to filter
     * @returns {Array} Entities of specified type
     */
    getEntitiesByType(type) {
        switch (type) {
            case 'asteroid':
                return this.asteroids.filter(e => e.isActive);
            case 'projectile':
                return this.projectiles.filter(e => e.isActive);
            case 'particle':
                return this.particles.filter(e => e.isActive);
            default:
                return [];
        }
    }

    /**
     * Clean up inactive entities and return them to pools
     */
    cleanupInactiveEntities() {
        // Clean up asteroids
        this.asteroids = this.asteroids.filter(asteroid => {
            if (!asteroid.isActive) {
                return false; // Remove from array
            }
            return true;
        });

        // Clean up projectiles and return to pool
        this.projectiles = this.projectiles.filter(projectile => {
            if (!projectile.isActive) {
                // Return to pool if there's space
                if (this.projectilePool.length < this.maxPoolSize) {
                    this.projectilePool.push(projectile);
                }
                return false; // Remove from active array
            }
            return true;
        });

        // Clean up particles and return to pool
        this.particles = this.particles.filter(particle => {
            if (!particle.isActive) {
                // Return to pool if there's space
                if (this.particlePool.length < this.maxPoolSize) {
                    this.particlePool.push(particle);
                }
                return false; // Remove from active array
            }
            return true;
        });
    }

    /**
     * Clear all entities (for game reset)
     */
    clearAllEntities() {
        // Mark all entities as inactive
        this.asteroids.forEach(asteroid => asteroid.isActive = false);
        this.projectiles.forEach(projectile => projectile.isActive = false);
        this.particles.forEach(particle => particle.isActive = false);

        // Clear arrays
        this.asteroids = [];
        this.projectiles = [];
        this.particles = [];

        // Reset pools
        this.projectilePool = [];
        this.particlePool = [];
    }

    /**
     * Get entity count statistics
     * @returns {Object} Entity count data
     */
    getEntityCounts() {
        return {
            asteroids: this.asteroids.filter(e => e.isActive).length,
            projectiles: this.projectiles.filter(e => e.isActive).length,
            particles: this.particles.filter(e => e.isActive).length,
            total: this.getAllActiveEntities().length,
            pooled: {
                projectiles: this.projectilePool.length,
                particles: this.particlePool.length
            }
        };
    }


    /**
     * Set screen dimensions for entity creation
     * @param {number} width Screen width
     * @param {number} height Screen height
     */
    setScreenDimensions(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
    }
}
