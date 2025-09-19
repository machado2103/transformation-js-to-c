/**
 * Vector2D - Mathematical vector operations for 2D game physics
 * Provides position, velocity, and direction calculations with frame-rate independence
 */
export class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * Create a copy of this vector
     * @returns {Vector2D} New vector with same x, y values
     */
    clone() {
        return new Vector2D(this.x, this.y);
    }

    /**
     * Add another vector to this vector
     * @param {Vector2D} vector The vector to add
     * @returns {Vector2D} This vector for chaining
     */
    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    /**
     * Subtract another vector from this vector
     * @param {Vector2D} vector The vector to subtract
     * @returns {Vector2D} This vector for chaining
     */
    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    /**
     * Multiply this vector by a scalar value
     * @param {number} scalar The scalar to multiply by
     * @returns {Vector2D} This vector for chaining
     */
    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    /**
     * Divide this vector by a scalar value
     * @param {number} scalar The scalar to divide by
     * @returns {Vector2D} This vector for chaining
     */
    divide(scalar) {
        if (scalar !== 0) {
            this.x /= scalar;
            this.y /= scalar;
        }
        return this;
    }

    /**
     * Calculate the magnitude (length) of this vector
     * @returns {number} The magnitude of the vector
     */
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * Calculate the squared magnitude (avoids expensive sqrt operation)
     * @returns {number} The squared magnitude of the vector
     */
    magnitudeSquared() {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * Normalize this vector to unit length
     * @returns {Vector2D} This vector for chaining
     */
    normalize() {
        const mag = this.magnitude();
        if (mag > 0) {
            this.divide(mag);
        }
        return this;
    }

    /**
     * Get a normalized copy of this vector without modifying the original
     * @returns {Vector2D} New normalized vector
     */
    normalized() {
        return this.clone().normalize();
    }

    /**
     * Rotate this vector by an angle in radians
     * @param {number} angle Angle in radians
     * @returns {Vector2D} This vector for chaining
     */
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const newX = this.x * cos - this.y * sin;
        const newY = this.x * sin + this.y * cos;
        this.x = newX;
        this.y = newY;
        return this;
    }

    /**
     * Calculate the distance to another vector
     * @param {Vector2D} vector The other vector
     * @returns {number} Distance between vectors
     */
    distanceTo(vector) {
        const dx = vector.x - this.x;
        const dy = vector.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Calculate the squared distance to another vector (avoids sqrt)
     * @param {Vector2D} vector The other vector
     * @returns {number} Squared distance between vectors
     */
    distanceToSquared(vector) {
        const dx = vector.x - this.x;
        const dy = vector.y - this.y;
        return dx * dx + dy * dy;
    }

    /**
     * Calculate the dot product with another vector
     * @param {Vector2D} vector The other vector
     * @returns {number} Dot product
     */
    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    /**
     * Calculate the cross product with another vector (2D returns scalar)
     * @param {Vector2D} vector The other vector
     * @returns {number} Cross product scalar
     */
    cross(vector) {
        return this.x * vector.y - this.y * vector.x;
    }

    /**
     * Limit the magnitude of this vector to a maximum value
     * @param {number} max Maximum magnitude
     * @returns {Vector2D} This vector for chaining
     */
    limit(max) {
        const magSq = this.magnitudeSquared();
        if (magSq > max * max) {
            this.normalize().multiply(max);
        }
        return this;
    }

    /**
     * Set the magnitude of this vector
     * @param {number} magnitude New magnitude
     * @returns {Vector2D} This vector for chaining
     */
    setMagnitude(magnitude) {
        return this.normalize().multiply(magnitude);
    }

    /**
     * Linear interpolation between this vector and another
     * @param {Vector2D} vector Target vector
     * @param {number} t Interpolation factor (0-1)
     * @returns {Vector2D} This vector for chaining
     */
    lerp(vector, t) {
        this.x += (vector.x - this.x) * t;
        this.y += (vector.y - this.y) * t;
        return this;
    }

    /**
     * Get the angle of this vector in radians
     * @returns {number} Angle in radians
     */
    angle() {
        return Math.atan2(this.y, this.x);
    }

    /**
     * Check if this vector equals another vector (within tolerance)
     * @param {Vector2D} vector The other vector
     * @param {number} tolerance Floating point tolerance (default: 0.0001)
     * @returns {boolean} True if vectors are equal within tolerance
     */
    equals(vector, tolerance = 0.0001) {
        return Math.abs(this.x - vector.x) < tolerance &&
               Math.abs(this.y - vector.y) < tolerance;
    }

    /**
     * Set both x and y components
     * @param {number} x New x component
     * @param {number} y New y component
     * @returns {Vector2D} This vector for chaining
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Set this vector to zero
     * @returns {Vector2D} This vector for chaining
     */
    zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }

    /**
     * Convert to string representation
     * @returns {string} String representation
     */
    toString() {
        return `Vector2D(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    /**
     * Static method to create a vector from angle and magnitude
     * @param {number} angle Angle in radians
     * @param {number} magnitude Magnitude of the vector
     * @returns {Vector2D} New vector
     */
    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(
            Math.cos(angle) * magnitude,
            Math.sin(angle) * magnitude
        );
    }

    /**
     * Static method to create a random unit vector
     * @returns {Vector2D} Random unit vector
     */
    static random() {
        const angle = Math.random() * Math.PI * 2;
        return Vector2D.fromAngle(angle);
    }

    /**
     * Static method to calculate distance between two vectors
     * @param {Vector2D} a First vector
     * @param {Vector2D} b Second vector
     * @returns {number} Distance between vectors
     */
    static distance(a, b) {
        return a.distanceTo(b);
    }

    /**
     * Static method to create a vector pointing from one point to another
     * @param {Vector2D} from Starting point
     * @param {Vector2D} to Ending point
     * @returns {Vector2D} Direction vector
     */
    static direction(from, to) {
        return new Vector2D(to.x - from.x, to.y - from.y);
    }
}
