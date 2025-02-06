import { OBJECTIVE, BULLET } from '../constants.js';
import { EnemyBulletPool } from './EnemyBulletPool.js';

const State = {
    TRANSITION: 'TRANSITION',
    TARGETING: 'TARGETING',
    DASHING: 'DASHING',
    RESTING: 'RESTING',
    SPAWNING_COPY: 'SPAWNING_COPY',
    VULNERABLE: 'VULNERABLE',
    DYING: 'DYING'
};

export class SecondStageObjective {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.size = OBJECTIVE.SIZE * 0.7; // Slightly smaller than first stage
        this.angle = 0;
        this.active = true;
        this.state = State.TRANSITION;
        this.bulletPool = new EnemyBulletPool(BULLET.ENEMY.POOL_SIZE);
        this.hitBoundary = false;

        // State-specific properties
        this.rotationSpeed = OBJECTIVE.ROTATION_SPEED;
        this.targetAngle = 0;
        this.dashSpeed = 0;
        this.dashTarget = { x: 0, y: 0 };
        this.stateStartTime = Date.now();
        this.hitZoneVisible = false;
        this.hitCount = 0;
        
        // Copy management
        this.copies = [];
        this.isTrue = false; // Whether this is the true enemy
        this.maxCopies = 5;

        // Additional properties for copy spawning and vulnerability
        this.spawnProgress = 0;
        this.isVulnerable = false;
        this.hitZoneRadius = BULLET.PLAYER.SIZE;
        this.flickerStart = 0;
        this.isDying = false;
    }

    update(player, deltaTime) {
        if (!this.active) return;

        const currentTime = Date.now();
        const stateTime = currentTime - this.stateStartTime;

        switch (this.state) {
            case State.TRANSITION:
                this.rotationSpeed *= 0.95; // Gradually slow down rotation
                this.angle += this.rotationSpeed;
                
                if (this.rotationSpeed < 0.001) {
                    this.setState(State.TARGETING);
                }
                break;

            case State.TARGETING:
                if (stateTime > 1000) { // 1 second targeting phase
                    this.prepareDash(player);
                    this.setState(State.DASHING);
                } else {
                    // Smooth rotation towards player
                    const targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
                    const angleDiff = targetAngle - this.angle;
                    this.angle += angleDiff * 0.1;
                }
                break;

            case State.DASHING:
                const dx = this.dashTarget.x - this.x;
                const dy = this.dashTarget.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 5 || this.hitBoundary) { // Close enough to target
                    if (this.copies.length < this.maxCopies) {
                        this.setState(State.SPAWNING_COPY);
                    } else {
                        this.setState(State.RESTING);
                    }
                    this.hitBoundary = false;
                } else {
                    // Calculate movement with normalized direction
                    const dirX = dx / distance;
                    const dirY = dy / distance;
                    
                    // Apply movement scaled by deltaTime (convert to seconds)
                    const moveX = dirX * this.dashSpeed * (deltaTime / 1000);
                    const moveY = dirY * this.dashSpeed * (deltaTime / 1000);
                    
                    // Calculate new position
                    const newX = this.x + moveX;
                    const newY = this.y + moveY;
                    
                    // Check boundaries before applying movement
                    const padding = this.size;
                    let hitBoundary = false;
                    if (newX >= padding && newX <= window.innerWidth - padding) {
                        this.x = newX;
                    } else {
                        hitBoundary = true;
                    }
                    if (newY >= padding && newY <= window.innerHeight - padding) {
                        this.y = newY;
                    } else {
                        hitBoundary = true;
                    }

                    if (hitBoundary) {
                        this.hitBoundary = true;
                    }
                }
                break;

            case State.RESTING:
                if (stateTime > 2000) { // 2 second rest
                    this.setState(State.TARGETING);
                }
                break;

            case State.SPAWNING_COPY:
                this.spawnProgress = Math.min(1, stateTime / 2000); // 2 second spawn
                if (this.spawnProgress >= 1) {
                    this.spawnCopy();
                    this.setState(State.RESTING);
                }
                break;

            case State.VULNERABLE:
                if (stateTime < 200 && !this.flickerStart) { // Initial flicker
                    this.flickerStart = currentTime;
                }
                break;

            case State.DYING:
                if (stateTime > 2000) { // 2 second death animation
                    this.active = false;
                }
                break;
        }

        this.bulletPool.update(window.innerWidth, window.innerHeight);
    }

    setState(newState) {
        this.state = newState;
        this.stateStartTime = Date.now();
    }

    prepareDash(player) {
        this.dashTarget = { x: player.x, y: player.y };
        const dx = this.dashTarget.x - this.x;
        const dy = this.dashTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Set a fixed dash speed instead of calculating based on distance
        this.dashSpeed = 300; // pixels per second
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Draw the triangle
        ctx.beginPath();
        const points = this.getTrianglePoints();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.closePath();

        // Set fill style based on state
        if (this.state === State.SPAWNING_COPY) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        } else if (this.state === State.VULNERABLE) {
            const flickerTime = Date.now() - this.flickerStart;
            ctx.fillStyle = flickerTime % 200 < 100 ? 'red' : 'white';
        } else if (this.state === State.DYING) {
            const progress = (Date.now() - this.stateStartTime) / 2000;
            ctx.globalAlpha = 1 - progress;
            ctx.fillStyle = 'red';
        } else {
            ctx.fillStyle = this.isTrue ? 'darkred' : 'red';
        }

        ctx.fill();

        // Draw hit zone if vulnerable
        if (this.isVulnerable && this.isTrue) {
            ctx.beginPath();
            ctx.arc(0, 0, this.hitZoneRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }

        ctx.restore();

        // Draw shadow copies
        if (this.state === State.SPAWNING_COPY) {
            this.drawShadowCopy(ctx);
        }

        // Draw bullet pool
        this.bulletPool.draw(ctx);
    }

    getTrianglePoints() {
        const points = [];
        points.push({ x: this.size, y: 0 });
        points.push({ 
            x: this.size * Math.cos(2.0944), 
            y: this.size * Math.sin(2.0944) 
        });
        points.push({ 
            x: this.size * Math.cos(4.1888), 
            y: this.size * Math.sin(4.1888) 
        });
        return points;
    }

    drawShadowCopy(ctx) {
        ctx.save();
        ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
        ctx.rotate(this.angle);
        ctx.globalAlpha = this.spawnProgress * 0.5;
        
        ctx.beginPath();
        const points = this.getTrianglePoints();
        ctx.moveTo(points[0].x, points[0].y);
        ctx.lineTo(points[1].x, points[1].y);
        ctx.lineTo(points[2].x, points[2].y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fill();
        ctx.restore();
    }

    spawnCopy() {
        const copy = new SecondStageObjective();
        copy.x = window.innerWidth / 2;
        copy.y = window.innerHeight / 2;
        copy.angle = this.angle;
        this.copies.push(copy);

        // Make one of the enemies the true one
        if (this.copies.length === this.maxCopies) {
            const trueEnemyIndex = Math.floor(Math.random() * (this.maxCopies + 1));
            if (trueEnemyIndex === this.maxCopies) {
                this.isTrue = true;
                this.isVulnerable = true;
            } else {
                this.copies[trueEnemyIndex].isTrue = true;
                this.copies[trueEnemyIndex].isVulnerable = true;
            }
        }
    }

    checkCollision(bullet) {
        if (!this.active || !bullet.active) return false;
        
        const dx = bullet.x - this.x;
        const dy = bullet.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.isTrue && this.isVulnerable) {
            if (distance < this.hitZoneRadius + bullet.radius) {
                this.hitCount++;
                if (this.hitCount >= 2) {
                    this.setState(State.DYING);
                }
                return true;
            }
        }
        
        return distance < this.size + bullet.radius;
    }

    spawn(canvasWidth, canvasHeight) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.angle = 0;
        this.active = true;
        this.state = State.TRANSITION;
        this.copies = [];
        this.isTrue = false;
        this.isVulnerable = false;
        this.hitCount = 0;
        this.spawnProgress = 0;
        this.stateStartTime = Date.now();
    }

    checkPlayerCollision(player) {
        if (!this.active) return false;

        // Check collision with this instance
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.size + player.size/2) {
            return true;
        }

        // Check collision with copies
        for (const copy of this.copies) {
            if (copy.active) {
                const copyDx = player.x - copy.x;
                const copyDy = player.y - copy.y;
                const copyDistance = Math.sqrt(copyDx * copyDx + copyDy * copyDy);
                
                if (copyDistance < copy.size + player.size/2) {
                    return true;
                }
            }
        }

        return false;
    }
} 