import { BULLET } from "../constants.js";

export class BulletPool {
    constructor(maxBullets) {
        this.bulletSpeed = BULLET.PLAYER.SPEED;
        this.bulletSize = BULLET.PLAYER.SIZE;
        this.shootCooldown = BULLET.PLAYER.COOLDOWN;
        this.bullets = Array(maxBullets).fill().map(() => ({
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            bounceCount: 0 // number of times the bullet has bounced
        }));
    }

    update(canvasWidth, canvasHeight) {
        this.bullets.forEach(bullet => {
            if (!bullet.active) return;
            
            // Update bullet position
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;

            // Check for collision with the canvas edges
            if (bullet.x < 0 || bullet.x > canvasWidth) {
                if (bullet.bounceCount >= 0) {
                    bullet.active = false;
                    return;
                }
                bullet.vx = -bullet.vx; // reverse the direction
                bullet.bounceCount++;
            }
            
            if (bullet.y < 0 || bullet.y > canvasHeight) {
                if (bullet.bounceCount >= 0) {
                    bullet.active = false;
                    return;
                }
                bullet.vy = -bullet.vy; // reverse the direction
                bullet.bounceCount++;
            }
        });
    }

    shoot(player, currentTime) {
        if (currentTime - player.lastShootTime < this.shootCooldown) return;

        const bullet = this.bullets.find(b => !b.active);
        if (!bullet) return;

        const spawnDistance = player.size / BULLET.PLAYER.SPAWN_DISTANCE_RATIO;
        const spawnX = player.x + Math.cos(player.angle) * spawnDistance;
        const spawnY = player.y + Math.sin(player.angle) * spawnDistance;

        bullet.active = true;
        bullet.x = spawnX;
        bullet.y = spawnY;
        bullet.vx = Math.cos(player.angle) * this.bulletSpeed;
        bullet.vy = Math.sin(player.angle) * this.bulletSpeed;
        bullet.radius = this.bulletSize;
        bullet.bounceCount = 0; // reset bounce count

        player.lastShootTime = currentTime;
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        this.bullets.forEach(bullet => {
            if (!bullet.active) return;
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, this.bulletSize, 0, Math.PI * 2);
            ctx.fill();
        });
    }
} 