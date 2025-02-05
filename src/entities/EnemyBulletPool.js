import { BULLET } from "../constants.js";

export class EnemyBulletPool {
    constructor(size) {
        this.size = size;
        this.bullets = [];
        this.initPool();
    }

    initPool() {
        for (let i = 0; i < this.size; i++) {
            this.bullets.push({
                active: false,
                x: 0,
                y: 0,
                dx: 0,
                dy: 0,
                speed: BULLET.ENEMY.SPEED,
                radius: BULLET.ENEMY.SIZE,
                bounceCount: 0,    // Track number of bounces
                maxBounces: BULLET.ENEMY.MAX_BOUNCES,      // Maximum allowed bounces
                isPink: false       // pink bullet flag
            });
        }
    }

    shoot(x, y, targetX, targetY, isPink = false) {
        const bullet = this.bullets.find(b => !b.active);
        if (!bullet) return;

        bullet.active = true;
        bullet.x = x;
        bullet.y = y;
        bullet.bounceCount = 0;    // Reset bounce count for new bullet
        bullet.isPink = isPink;    // Set pink bullet flag

        // Calculate direction
        const angle = Math.atan2(targetY - y, targetX - x);
        bullet.dx = Math.cos(angle) * bullet.speed;
        bullet.dy = Math.sin(angle) * bullet.speed;
    }

    update(canvasWidth, canvasHeight) {
        this.bullets.forEach(bullet => {
            if (!bullet.active) return;

            // Update position
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;

            // Handle bouncing off left and right walls
            if (bullet.x - bullet.radius < 0 || bullet.x + bullet.radius > canvasWidth) {
                if (bullet.bounceCount >= bullet.maxBounces) {
                    bullet.active = false;
                    return;
                }
                bullet.dx = -bullet.dx * BULLET.ENEMY.BOUNCE_SPEED_MULTIPLIER;  // Reverse horizontal direction and reduce speed
                bullet.bounceCount++;
                // Adjust position to prevent sticking to walls
                bullet.x = bullet.x - bullet.radius < 0 ? bullet.radius : canvasWidth - bullet.radius;
            }

            // Handle bouncing off top and bottom walls
            if (bullet.y - bullet.radius < 0 || bullet.y + bullet.radius > canvasHeight) {
                if (bullet.bounceCount >= bullet.maxBounces) {
                    bullet.active = false;
                    return;
                }
                bullet.dy = -bullet.dy * BULLET.ENEMY.BOUNCE_SPEED_MULTIPLIER;  // Reverse vertical direction and reduce speed
                bullet.bounceCount++;
                // Adjust position to prevent sticking to walls
                bullet.y = bullet.y - bullet.radius < 0 ? bullet.radius : canvasHeight - bullet.radius;
            }
        });
    }

    draw(ctx) {
        this.bullets.forEach(bullet => {
            if (!bullet.active) return;
            
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
            ctx.fillStyle = bullet.isPink ? 'pink' : 'red';
            ctx.fill();
        });
    }
} 