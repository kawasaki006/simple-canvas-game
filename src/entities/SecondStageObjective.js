import { OBJECTIVE, BULLET, SECOND_STAGE } from '../constants.js';
import { EnemyBulletPool } from './EnemyBulletPool.js';

const State = {
    TARGETING: 'TARGETING',
    DASHING: 'DASHING',
    RESTING: 'RESTING',
    STATIC: 'STATIC'
};

export class SecondStageObjective {
    constructor() {
        // Basic properties
        this.x = 0;
        this.y = 0;
        this.size = OBJECTIVE.SIZE * 0.5;
        this.angle = 0;
        this.active = true;
        this.state = State.TARGETING;
        this.bulletPool = new EnemyBulletPool(BULLET.ENEMY.POOL_SIZE);

        // State timing
        this.stateStartTime = Date.now();
        
        // Movement properties
        this.dashSpeed = SECOND_STAGE.DASH_SPEED; // pixels per second
        this.dashTarget = { x: 0, y: 0 };
        this.hitBoundary = false;

        // Vulnerability properties (managed by manager)
        this.isTrue = false;
        this.isVulnerable = false;
        this.hitCount = 0;
    }

    spawn(canvasWidth, canvasHeight, initialAngle = 0) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.angle = initialAngle;
        this.active = true;
        this.state = State.TARGETING;
        this.stateStartTime = Date.now();
    }

    update(player, deltaTime) {
        if (!this.active) return;

        const currentTime = Date.now();
        const stateTime = currentTime - this.stateStartTime;

        switch (this.state) {
            case State.TARGETING:
                if (stateTime > SECOND_STAGE.TARGETING_DURATION) { // 1 second targeting phase
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
                
                if (distance < 5 || this.hitBoundary) {
                    this.setState(State.RESTING);
                    this.hitBoundary = false;
                } else {
                    // Calculate movement with normalized direction
                    const dirX = dx / distance;
                    const dirY = dy / distance;
                    
                    // Apply movement scaled by deltaTime
                    const moveX = dirX * this.dashSpeed * (deltaTime / 1000);
                    const moveY = dirY * this.dashSpeed * (deltaTime / 1000);
                    
                    // Calculate new position
                    const newX = this.x + moveX;
                    const newY = this.y + moveY;
                    
                    // Check boundaries before applying movement
                    const padding = this.size;
                    if (newX >= padding && newX <= window.innerWidth - padding) {
                        this.x = newX;
                    } else {
                        this.hitBoundary = true;
                    }
                    if (newY >= padding && newY <= window.innerHeight - padding) {
                        this.y = newY;
                    } else {
                        this.hitBoundary = true;
                    }
                }
                break;

            case State.RESTING:
                if (stateTime > SECOND_STAGE.RESTING_DURATION) { // 2 second rest
                    this.setState(State.TARGETING);
                }
                break;

            case State.STATIC:
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

        // Set fill style based on vulnerability (managed by manager)
        ctx.fillStyle = this.isTrue ? 'darkred' : 'red';
        ctx.fill();

        // Draw hit zone if vulnerable
        if (this.isVulnerable && this.isTrue) {
            ctx.beginPath();
            ctx.arc(0, 0, BULLET.PLAYER.SIZE, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }

        ctx.restore();

        // Draw bullet pool
        this.bulletPool.draw(ctx);
    }

    getTrianglePoints() {
        return [
            { x: this.size, y: 0 },
            { 
                x: this.size * Math.cos(2.0944), 
                y: this.size * Math.sin(2.0944) 
            },
            { 
                x: this.size * Math.cos(4.1888), 
                y: this.size * Math.sin(4.1888) 
            }
        ];
    }

    checkCollision(bullet) {
        if (!this.active || !bullet.active) return false;
        
        const dx = bullet.x - this.x;
        const dy = bullet.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.isTrue && this.isVulnerable) {
            if (distance < BULLET.PLAYER.SIZE + bullet.radius) {
                this.hitCount++;
                if (this.hitCount >= 2) {
                    this.active = false;
                }
                return true;
            }
        }
        
        return distance < this.size + bullet.radius;
    }

    checkPlayerCollision(player) {
        if (!this.active) return false;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < this.size + player.size/2;
    }
}