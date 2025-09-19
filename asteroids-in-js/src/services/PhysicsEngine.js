import { Vector2D } from '../lib/Vector2D.js';

/**
 * PhysicsEngine - Handles movement, collision detection, and physics simulation
 * Provides frame-rate independent physics with momentum, inertia, and screen wrapping
 */
export class PhysicsEngine {
    constructor(screenWidth = 800, screenHeight = 600) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        // Performance optimization: spatial grid for collision detection
        this.useSpacialGrid = true;
        this.gridCellSize = 100;
        this.spatialGrid = new Map();

        // Collision statistics for debugging
        this.collisionChecks = 0;
        this.actualCollisions = 0;
    }

    /**
     * Update physics for all entities
     * @param {Array} entities Array of game objects to update
     * @param {number} deltaTime Time elapsed since last frame (milliseconds)
     * @returns {Object} Update results
     */
    updateEntities(entities, deltaTime) {
        let entitiesUpdated = 0;
        let screenWraps = 0;

        for (const entity of entities) {
            if (entity.isActive === false) continue;

            const previousPosition = entity.position.clone();

            // Update entity physics
            entity.update(deltaTime);
            entitiesUpdated++;

            // Check if entity wrapped around screen
            if (this.hasWrappedScreen(previousPosition, entity.position)) {
                screenWraps++;
            }
        }

        return {
            entitiesUpdated,
            screenWraps,
            collisions: []
        };
    }

    /**
     * Detect collisions between all entities
     * @param {Array} entities Array of game objects
     * @returns {Object} Collision detection results
     */
    detectCollisions(entities) {
        const collisions = [];
        this.collisionChecks = 0;
        this.actualCollisions = 0;

        // Filter out inactive entities
        const activeEntities = entities.filter(entity => entity.isActive !== false);

        if (this.useSpacialGrid && activeEntities.length > 10) {
            // Use spatial grid optimization for large numbers of entities
            return this.detectCollisionsSpatial(activeEntities);
        } else {
            // Use brute force for smaller numbers
            return this.detectCollisionsBruteForce(activeEntities);
        }
    }

    /**
     * Brute force collision detection (O(n²))
     * @param {Array} entities Active entities
     * @returns {Object} Collision results
     */
    detectCollisionsBruteForce(entities) {
        const collisions = [];

        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const entityA = entities[i];
                const entityB = entities[j];

                this.collisionChecks++;

                if (this.checkCircleCollision(entityA, entityB)) {
                    collisions.push({
                        entityA,
                        entityB,
                        point: this.getCollisionPoint(entityA, entityB),
                        normal: this.getCollisionNormal(entityA, entityB)
                    });
                    this.actualCollisions++;
                }
            }
        }

        return { collisions };
    }

    /**
     * Spatial grid collision detection (O(n))
     * @param {Array} entities Active entities
     * @returns {Object} Collision results
     */
    detectCollisionsSpatial(entities) {
        const collisions = [];

        // Clear and populate spatial grid
        this.clearSpatialGrid();
        this.populateSpatialGrid(entities);

        // Check collisions only within same or adjacent grid cells
        const checkedPairs = new Set();

        for (const entity of entities) {
            const candidates = this.getNearbyEntities(entity);

            for (const candidate of candidates) {
                if (entity === candidate) continue;

                // Create unique pair identifier to avoid duplicate checks
                const pairId = entity.id < candidate.id ?
                    `${entity.id}-${candidate.id}` :
                    `${candidate.id}-${entity.id}`;

                if (checkedPairs.has(pairId)) continue;
                checkedPairs.add(pairId);

                this.collisionChecks++;

                if (this.checkCircleCollision(entity, candidate)) {
                    collisions.push({
                        entityA: entity,
                        entityB: candidate,
                        point: this.getCollisionPoint(entity, candidate),
                        normal: this.getCollisionNormal(entity, candidate)
                    });
                    this.actualCollisions++;
                }
            }
        }

        return { collisions };
    }

    /**
     * Check collision between two circular entities
     * @param {Object} entityA First entity
     * @param {Object} entityB Second entity
     * @returns {boolean} True if collision detected
     */
    checkCircleCollision(entityA, entityB) {
        const boundsA = entityA.getBounds();
        const boundsB = entityB.getBounds();

        const dx = boundsB.x - boundsA.x;
        const dy = boundsB.y - boundsA.y;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSum = boundsA.radius + boundsB.radius;

        return distanceSquared < (radiusSum * radiusSum);
    }

    /**
     * Get collision point between two entities
     * @param {Object} entityA First entity
     * @param {Object} entityB Second entity
     * @returns {Vector2D} Collision point
     */
    getCollisionPoint(entityA, entityB) {
        const boundsA = entityA.getBounds();
        const boundsB = entityB.getBounds();

        // Collision point is midway between entity centers
        const x = (boundsA.x + boundsB.x) / 2;
        const y = (boundsA.y + boundsB.y) / 2;

        return new Vector2D(x, y);
    }

    /**
     * Get collision normal vector
     * @param {Object} entityA First entity
     * @param {Object} entityB Second entity
     * @returns {Vector2D} Normalized collision normal
     */
    getCollisionNormal(entityA, entityB) {
        const boundsA = entityA.getBounds();
        const boundsB = entityB.getBounds();

        const normal = new Vector2D(
            boundsB.x - boundsA.x,
            boundsB.y - boundsA.y
        );

        return normal.normalize();
    }

    /**
     * Check if an entity has wrapped around screen edges
     * @param {Vector2D} previousPosition Previous position
     * @param {Vector2D} currentPosition Current position
     * @returns {boolean} True if entity wrapped
     */
    hasWrappedScreen(previousPosition, currentPosition) {
        const halfScreen = {
            x: this.screenWidth / 2,
            y: this.screenHeight / 2
        };

        // Check for large position changes that indicate wrapping
        const deltaX = Math.abs(currentPosition.x - previousPosition.x);
        const deltaY = Math.abs(currentPosition.y - previousPosition.y);

        return deltaX > halfScreen.x || deltaY > halfScreen.y;
    }

    /**
     * Apply physics forces to an entity
     * @param {Object} entity Entity to apply forces to
     * @param {Vector2D} force Force vector to apply
     * @param {number} deltaTime Time step
     */
    applyForce(entity, force, deltaTime) {
        if (!entity.velocity) return;

        const deltaSeconds = deltaTime / 1000;
        const acceleration = force.clone().multiply(deltaSeconds);
        entity.velocity.add(acceleration);
    }

    /**
     * Apply damping to an entity's velocity
     * @param {Object} entity Entity to apply damping to
     * @param {number} dampingFactor Damping factor (0-1)
     */
    applyDamping(entity, dampingFactor) {
        if (!entity.velocity) return;
        entity.velocity.multiply(dampingFactor);
    }

    /**
     * Resolve collision between two entities
     * @param {Object} collision Collision data
     */
    resolveCollision(collision) {
        const { entityA, entityB, normal } = collision;

        // Simple collision resolution - separate entities
        const boundsA = entityA.getBounds();
        const boundsB = entityB.getBounds();
        const overlap = (boundsA.radius + boundsB.radius) -
                       new Vector2D(boundsA.x, boundsA.y).distanceTo(new Vector2D(boundsB.x, boundsB.y));

        if (overlap > 0) {
            const separation = normal.clone().multiply(overlap / 2);

            if (entityA.position) {
                entityA.position.subtract(separation);
            }
            if (entityB.position) {
                entityB.position.add(separation);
            }
        }
    }

    /**
     * Clear spatial grid for collision optimization
     */
    clearSpatialGrid() {
        this.spatialGrid.clear();
    }

    /**
     * Populate spatial grid with entities
     * @param {Array} entities Entities to add to grid
     */
    populateSpatialGrid(entities) {
        for (const entity of entities) {
            const bounds = entity.getBounds();
            const gridX = Math.floor(bounds.x / this.gridCellSize);
            const gridY = Math.floor(bounds.y / this.gridCellSize);
            const key = `${gridX},${gridY}`;

            if (!this.spatialGrid.has(key)) {
                this.spatialGrid.set(key, []);
            }
            this.spatialGrid.get(key).push(entity);
        }
    }

    /**
     * Get nearby entities for spatial collision detection
     * @param {Object} entity Entity to find neighbors for
     * @returns {Array} Nearby entities
     */
    getNearbyEntities(entity) {
        const nearby = [];
        const bounds = entity.getBounds();
        const gridX = Math.floor(bounds.x / this.gridCellSize);
        const gridY = Math.floor(bounds.y / this.gridCellSize);

        // Check current and adjacent cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = `${gridX + dx},${gridY + dy}`;
                const cellEntities = this.spatialGrid.get(key);
                if (cellEntities) {
                    nearby.push(...cellEntities);
                }
            }
        }

        return nearby;
    }


    /**
     * Set screen dimensions
     * @param {number} width Screen width
     * @param {number} height Screen height
     */
    setScreenDimensions(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
    }
}
