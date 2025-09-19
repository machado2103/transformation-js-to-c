/**
 * Renderer - Canvas-based rendering pipeline with efficient drawing operations
 * Handles entity rendering, UI overlay, and visual effects with performance optimization
 */
export class Renderer {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;

        // Performance tracking
        this.frameCount = 0;
        this.lastFpsUpdate = 0;
        this.fps = 60;
        this.renderTime = 0;


        // Canvas state optimization
        this.lastFillStyle = null;
        this.lastStrokeStyle = null;
        this.lastLineWidth = null;
    }

    /**
     * Render complete game frame
     * @param {Object} renderData Data to render
     * @returns {Object} Render performance statistics
     */
    render(renderData) {
        const startTime = performance.now();

        const {
            entities = [],
            gameState = {},
            particles = [],
            ui = {}
        } = renderData;

        // Clear canvas
        this.clearCanvas();

        // Render in depth order
        this.renderBackground();
        this.renderEntities(entities);
        this.renderParticles(particles);
        this.renderUI(gameState, ui);


        // Update performance stats
        const renderTime = performance.now() - startTime;
        this.updatePerformanceStats(renderTime);

        return {
            entitiesRendered: entities.length,
            particlesRendered: particles.length,
            renderTime: renderTime,
            frameRate: this.fps
        };
    }

    /**
     * Clear the entire canvas
     */
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Render background (starfield or gradient)
     */
    renderBackground() {
        // Simple star field background
        this.context.fillStyle = '#000011';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Add subtle stars
        this.context.fillStyle = '#FFFFFF';
        this.context.globalAlpha = 0.3;

        // Generate consistent star positions using canvas dimensions as seed
        const starCount = 50;
        for (let i = 0; i < starCount; i++) {
            const x = (i * 137.5) % this.canvas.width; // Use golden ratio for distribution
            const y = (i * 219.8) % this.canvas.height;
            const size = (i % 3) + 1;

            this.context.beginPath();
            this.context.arc(x, y, size * 0.5, 0, Math.PI * 2);
            this.context.fill();
        }

        this.context.globalAlpha = 1.0;
    }

    /**
     * Render all game entities in proper order
     * @param {Array} entities Array of game entities
     */
    renderEntities(entities) {
        // Sort entities by type and size for proper depth ordering
        const sortedEntities = [...entities].sort((a, b) => {
            const order = { asteroid: 1, projectile: 2, ship: 3 };
            const aOrder = order[a.type] || 0;
            const bOrder = order[b.type] || 0;

            if (aOrder !== bOrder) {
                return aOrder - bOrder;
            }

            // Within same type, sort asteroids by size (larger first)
            if (a.type === 'asteroid' && b.type === 'asteroid') {
                const sizeOrder = { large: 3, medium: 2, small: 1 };
                return (sizeOrder[b.size] || 0) - (sizeOrder[a.size] || 0);
            }

            return 0;
        });

        // Render each entity
        for (const entity of sortedEntities) {
            if (entity.isActive === false) continue;

            try {
                if (entity.draw && typeof entity.draw === 'function') {
                    entity.draw(this.context);
                }

            } catch (error) {
                console.warn('Error rendering entity:', error, entity);
            }
        }
    }

    /**
     * Render particle effects
     * @param {Array} particles Array of particle objects
     */
    renderParticles(particles) {
        for (const particle of particles) {
            if (particle.isActive === false) continue;

            try {
                if (particle.draw && typeof particle.draw === 'function') {
                    particle.draw(this.context);
                }
            } catch (error) {
                console.warn('Error rendering particle:', error, particle);
            }
        }
    }

    /**
     * Render UI elements and overlays (HUD is handled by HTML)
     * @param {Object} gameState Current game state
     * @param {Object} ui UI configuration
     */
    renderUI(gameState, ui = {}) {
        // Set UI text properties
        this.context.font = ui.font || '20px "Courier New", monospace';
        this.context.textAlign = 'left';
        this.context.textBaseline = 'top';

        // Render HUD elements
        this.renderHUD(gameState);

        // Render game state overlays
        if (gameState.isPaused) {
            this.renderPauseOverlay(gameState);
        }

        if (gameState.isGameOver) {
            this.renderGameOverOverlay(gameState);
        }
    }

    /**
     * Render HUD (score, lives, level)
     * @param {Object} gameState Current game state
     */
    renderHUD(gameState) {
        const hudColor = '#00FF88';
        const hudShadowColor = '#004433';

        // Set text style with shadow effect
        this.context.fillStyle = hudShadowColor;
        this.context.fillText(`Score: ${gameState.score || 0}`, 11, 11);
        this.context.fillText(`Lives: ${gameState.lives || 3}`, 11, 36);

        this.context.fillStyle = hudColor;
        this.context.fillText(`Score: ${gameState.score || 0}`, 10, 10);
        this.context.fillText(`Lives: ${gameState.lives || 3}`, 10, 35);

        // Level display (center top)
        const levelText = `Level: ${gameState.level || 1}`;
        const levelWidth = this.context.measureText(levelText).width;
        const centerX = (this.canvas.width - levelWidth) / 2;

        this.context.fillStyle = hudShadowColor;
        this.context.fillText(levelText, centerX + 1, 11);
        this.context.fillStyle = hudColor;
        this.context.fillText(levelText, centerX, 10);
    }

    /**
     * Render pause overlay
     * @param {Object} gameState Current game state
     */
    renderPauseOverlay(gameState) {
        // Semi-transparent overlay
        this.context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Pause text
        this.context.font = '48px "Courier New", monospace';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Text shadow
        this.context.fillStyle = '#333333';
        this.context.fillText('PAUSED', centerX + 2, centerY + 2);

        // Main text
        this.context.fillStyle = '#FF8800';
        this.context.fillText('PAUSED', centerX, centerY);

        // Resume countdown if active
        if (gameState.resumeCountdown > 0) {
            this.context.font = '72px "Courier New", monospace';
            this.context.fillStyle = '#00FF88';
            this.context.fillText(
                Math.ceil(gameState.resumeCountdown / 1000).toString(),
                centerX,
                centerY + 80
            );
        } else {
            // Instructions
            this.context.font = '24px "Courier New", monospace';
            this.context.fillStyle = '#CCCCCC';
            this.context.fillText('Press P to resume', centerX, centerY + 60);
        }

        // Reset text alignment
        this.context.textAlign = 'left';
        this.context.textBaseline = 'top';
    }

    /**
     * Render game over overlay
     * @param {Object} gameState Current game state
     */
    renderGameOverOverlay(gameState) {
        // Semi-transparent overlay
        this.context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Game Over text
        this.context.font = '48px "Courier New", monospace';
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';

        // Text shadow
        this.context.fillStyle = '#330000';
        this.context.fillText('GAME OVER', centerX + 2, centerY - 38);

        // Main text
        this.context.fillStyle = '#FF0088';
        this.context.fillText('GAME OVER', centerX, centerY - 40);

        // Final score
        this.context.font = '32px "Courier New", monospace';
        this.context.fillStyle = '#00FF88';
        this.context.fillText(
            `Final Score: ${gameState.score || 0}`,
            centerX,
            centerY + 20
        );

        // Instructions
        this.context.font = '20px "Courier New", monospace';
        this.context.fillStyle = '#CCCCCC';
        this.context.fillText('Press ESC for menu', centerX, centerY + 80);

        // Reset text alignment
        this.context.textAlign = 'left';
        this.context.textBaseline = 'top';
    }


    /**
     * Optimize canvas state changes
     * @param {string} property Canvas property to set
     * @param {string} value Value to set
     */
    setCanvasProperty(property, value) {
        const lastValue = this[`last${property.charAt(0).toUpperCase() + property.slice(1)}`];
        if (lastValue !== value) {
            this.context[property] = value;
            this[`last${property.charAt(0).toUpperCase() + property.slice(1)}`] = value;
        }
    }


    /**
     * Resize canvas and update rendering context
     * @param {number} width New canvas width
     * @param {number} height New canvas height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;

        // Reset canvas state after resize
        this.lastFillStyle = null;
        this.lastStrokeStyle = null;
        this.lastLineWidth = null;
    }

}
