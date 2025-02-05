import { PLAYER, FRAME } from '../constants.js';

export class Player {
    constructor(canvasWidth, canvasHeight) {
        this.x = canvasWidth / PLAYER.SPAWN_OFFSET;
        this.y = canvasHeight / PLAYER.SPAWN_OFFSET;
        this.size = PLAYER.INITIAL_SIZE;
        this.speed = PLAYER.SPEED;
        this.angle = 0;
        this.lastShootTime = 0;
        this.alive = true;
    }

    update(keys, mouseX, mouseY, deltaTime, canvasWidth, canvasHeight) {
        // consistent speed regardless of frame rate
        const speed = this.speed * (deltaTime / FRAME.TARGET_MS);
        
        // Movement
        if (keys['w'] && this.y - this.size/2 > 0) this.y -= speed;
        if (keys['s'] && this.y + this.size/2 < canvasHeight) this.y += speed;
        if (keys['a'] && this.x - this.size/2 > 0) this.x -= speed;
        if (keys['d'] && this.x + this.size/2 < canvasWidth) this.x += speed;

        // Rotation
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        this.angle = Math.atan2(dy, dx);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = 'blue';
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }

    checkCollision(bullet) {
        if (!this.alive || !bullet.active) return false;
        
        // Calculate distance between bullet and player center
        const dx = bullet.x - this.x;
        const dy = bullet.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if distance is less than player's radius (half the size)
        return distance <= this.size / 2;
    }
} 