import { EnemyBulletPool } from './EnemyBulletPool.js';
import { OBJECTIVE, BULLET } from '../constants.js';

export class Objective {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.size = OBJECTIVE.SIZE;
        this.angle = 0;
        this.hitZoneRadius = OBJECTIVE.HIT_ZONE.RADIUS; // hit zone radius
        this.rotationSpeed = OBJECTIVE.ROTATION_SPEED; // radians per frame (about 1.15 degrees)
        this.bulletPool = new EnemyBulletPool(BULLET.ENEMY.POOL_SIZE);
        this.lastShotTime = 0;
        this.waveCount = 0; // number of waves fired
        this.shootingInterval = OBJECTIVE.SHOOTING.INTERVAL; // Shoot every 1 second

        this.destroyedPinkBullets = 0;
        this.hitZonesVisible = false;
        this.hitZonesVisibleStartTime = 0;
        this.hitZonesVisibleDuration = OBJECTIVE.HIT_ZONE.VISIBLE_DURATION; // 5 seconds
        this.destroyedEdges = [false, false, false];
        this.originalSize = OBJECTIVE.SIZE; // original size of the objective
    }

    // get the points of the hit zone
    getHitZonePositions() {
        return [
            // first edge middle point
            { 
                x: this.x + Math.cos(this.angle) * (this.size / 2),
                y: this.y + Math.sin(this.angle) * (this.size / 2)
            },
            {
                // second edge middle point
                x: this.x + Math.cos(this.angle + OBJECTIVE.ANGLES.SECOND_POINT) * (this.size / 2),
                y: this.y + Math.sin(this.angle + OBJECTIVE.ANGLES.SECOND_POINT) * (this.size / 2)
            },
            {
                // third edge middle point
                x: this.x + Math.cos(this.angle + OBJECTIVE.ANGLES.THIRD_POINT) * (this.size / 2),
                y: this.y + Math.sin(this.angle + OBJECTIVE.ANGLES.THIRD_POINT) * (this.size / 2)
            },
        ];
    }

    spawn(canvasWidth, canvasHeight) {
        // spawn in the center of the screen
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.angle = Math.random() * Math.PI * 2;
        this.active = true;
    }

    checkCollision(bullet) {
        if (!bullet.active || !this.active || !this.hitZonesVisible) return false;
        
        const hitZones = this.getHitZonePositions();
        
        // Only check non-destroyed hit zones
        for (let i = 0; i < hitZones.length; i++) {
            if (this.destroyedEdges[i]) continue;
            const zone = hitZones[i];
            const dx = bullet.x - zone.x;
            const dy = bullet.y - zone.y;
            if (dx * dx + dy * dy <= this.hitZoneRadius * this.hitZoneRadius) {
                this.destroyedEdges[i] = true;
                this.hitZonesVisible = false; // Hide remaining zones after hit
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw remaining parts of the triangle
        ctx.beginPath();
        let points = [];
        const halfSize = this.size / 2;
        
        // Main triangle points - using full size for the points
        points.push({ x: this.size, y: 0 });
        points.push({ x: this.size * Math.cos(OBJECTIVE.ANGLES.SECOND_POINT), y: this.size * Math.sin(OBJECTIVE.ANGLES.SECOND_POINT) });
        points.push({ x: this.size * Math.cos(OBJECTIVE.ANGLES.THIRD_POINT), y: this.size * Math.sin(OBJECTIVE.ANGLES.THIRD_POINT) });
        
        // Draw the shape excluding destroyed corners
        ctx.beginPath();
        let firstPoint = true;
        for (let i = 0; i < 3; i++) {
            const currentPoint = points[i];
            const nextPoint = points[(i + 1) % 3];
            const prevPoint = points[(i - 1 + 3) % 3];
            
            if (this.destroyedEdges[i]) {
                // If this corner is destroyed, create cut-off points
                const cutoffRatio = OBJECTIVE.SHOOTING.CORNER_CUT_RATIO; // How much of the corner to cut off
                
                // Calculate cut points on both adjacent edges
                const cutPoint1 = {
                    x: currentPoint.x + (prevPoint.x - currentPoint.x) * cutoffRatio,
                    y: currentPoint.y + (prevPoint.y - currentPoint.y) * cutoffRatio
                };
                
                const cutPoint2 = {
                    x: currentPoint.x + (nextPoint.x - currentPoint.x) * cutoffRatio,
                    y: currentPoint.y + (nextPoint.y - currentPoint.y) * cutoffRatio
                };
                
                if (!firstPoint) {
                    ctx.lineTo(cutPoint1.x, cutPoint1.y);
                    ctx.lineTo(cutPoint2.x, cutPoint2.y);
                } else {
                    ctx.moveTo(cutPoint1.x, cutPoint1.y);
                    ctx.lineTo(cutPoint2.x, cutPoint2.y);
                    firstPoint = false;
                }
            } else {
                if (!firstPoint) {
                    ctx.lineTo(currentPoint.x, currentPoint.y);
                } else {
                    ctx.moveTo(currentPoint.x, currentPoint.y);
                    firstPoint = false;
                }
            }
        }
        ctx.closePath();
        ctx.fillStyle = 'green';
        ctx.fill();
        ctx.restore();

        // Draw visible hit zones
        if (this.hitZonesVisible) {
            const hitZones = this.getHitZonePositions();
            ctx.fillStyle = 'red';
            hitZones.forEach((zone, index) => {
                if (!this.destroyedEdges[index]) {
                    ctx.beginPath();
                    ctx.arc(zone.x, zone.y, this.hitZoneRadius, 0, 2 * Math.PI);
                    ctx.fill();
                }
            });
        }
    }

    update() {
        if (!this.active) return;

        // Check if hit zones should become invisible
        if (this.hitZonesVisible) {
            if (Date.now() - this.hitZonesVisibleStartTime > this.hitZonesVisibleDuration) {
                this.hitZonesVisible = false;
            }
        }

        this.angle += this.rotationSpeed;

        // Shooting logic
        const currentTime = Date.now();
        if (currentTime - this.lastShotTime > this.shootingInterval) {
            // Don't shoot if all edges are destroyed
            if (!this.destroyedEdges.every(edge => edge)) {
                const hitZones = this.getHitZonePositions();
                this.waveCount++;

                let pinkBulletZoneIndex = -1;  // Track which zone shot the pink bullet

                if (this.waveCount % OBJECTIVE.SHOOTING.PINK_BULLET_WAVE === 0) {
                    // Shoot pink bullet from first available zone
                    pinkBulletZoneIndex = this.destroyedEdges.findIndex(edge => !edge);
                    if (pinkBulletZoneIndex !== -1) {
                        const activeZone = hitZones[pinkBulletZoneIndex];
                        const angle = this.angle + Math.atan2(activeZone.y - this.y, activeZone.x - this.x);
                        const targetX = activeZone.x + Math.cos(angle) * BULLET.ENEMY.TARGET_DISTANCE;
                        const targetY = activeZone.y + Math.sin(angle) * BULLET.ENEMY.TARGET_DISTANCE;
                        this.bulletPool.shoot(activeZone.x, activeZone.y, targetX, targetY, true);
                    }
                }

                // Shoot red bullets from remaining non-destroyed zones
                hitZones.forEach((zone, index) => {
                    // Skip destroyed zones and the zone that just shot a pink bullet
                    if (!this.destroyedEdges[index] && index !== pinkBulletZoneIndex) {
                        const angle = this.angle + Math.atan2(zone.y - this.y, zone.x - this.x);
                        const targetX = zone.x + Math.cos(angle) * BULLET.ENEMY.TARGET_DISTANCE;
                        const targetY = zone.y + Math.sin(angle) * BULLET.ENEMY.TARGET_DISTANCE;
                        this.bulletPool.shoot(zone.x, zone.y, targetX, targetY, false);
                    }
                });
            }
            this.lastShotTime = currentTime;
        }

        this.bulletPool.update(window.innerWidth, window.innerHeight);
    }
} 