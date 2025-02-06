import { SecondStageObjective } from './SecondStageObjective.js';

export class SecondStageManager {
    constructor() {
        this.objectives = [];
        this.maxCopies = 5;
        this.spawnTimer = 0;
        this.spawnInterval = 3000; // 3 seconds between spawns (2s cycle + 1s spawn)
        this.trueObjectiveIndex = -1;
        // Add spawn animation progress tracking
        this.spawnProgress = 0;
        this.isSpawning = false;
    }

    update(player, deltaTime) {
        // Update all existing objectives
        this.objectives.forEach(objective => {
            if (objective.active) {
                objective.update(player, deltaTime);
            }
        });

        // Handle spawning based on timer
        if (this.objectives.length < this.maxCopies) {
            this.spawnTimer += deltaTime;
            
            // Start spawn animation at 2 seconds into the interval
            if (this.spawnTimer >= 2000 && !this.isSpawning) {
                this.isSpawning = true;
            }

            // Update spawn animation progress
            if (this.isSpawning) {
                this.spawnProgress = (this.spawnTimer - 2000) / 1000; // 1 second animation
            }

            // Spawn new copy at the end of the interval
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnNewCopy();
                this.spawnTimer = 0;
                this.spawnProgress = 0;
                this.isSpawning = false;
            }
        }
    }

    spawnNewCopy() {
        const newObjective = new SecondStageObjective();
        newObjective.x = window.innerWidth / 2;
        newObjective.y = window.innerHeight / 2;
        newObjective.angle = this.objectives[0].angle;
        newObjective.active = true;
        this.objectives.push(newObjective);

        // If we've reached max copies, choose the true objective
        if (this.objectives.length === this.maxCopies) {
            this.trueObjectiveIndex = Math.floor(Math.random() * this.objectives.length);
            this.objectives[this.trueObjectiveIndex].isTrue = true;
            this.objectives[this.trueObjectiveIndex].isVulnerable = true;
        }
    }

    draw(ctx) {
        // Draw all active objectives
        this.objectives.forEach(objective => {
            if (objective.active) {
                objective.draw(ctx);
            }
        });

        // Draw spawn animation if in progress
        if (this.isSpawning) {
            this.drawSpawnAnimation(ctx);
        }
    }

    drawSpawnAnimation(ctx) {
        ctx.save();
        ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
        ctx.rotate(this.objectives[0].angle);
        
        // Gradually increase opacity as the spawn progresses
        ctx.globalAlpha = Math.min(this.spawnProgress, 1);
        
        // Draw shadow copy
        ctx.beginPath();
        const size = this.objectives[0].size;
        ctx.moveTo(size, 0);
        ctx.lineTo(size * Math.cos(2.0944), size * Math.sin(2.0944));
        ctx.lineTo(size * Math.cos(4.1888), size * Math.sin(4.1888));
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fill();
        ctx.restore();
    }

    checkCollisions(bullet) {
        for (const objective of this.objectives) {
            if (objective.checkCollision(bullet)) {
                return true;
            }
        }
        return false;
    }

    checkPlayerCollision(player) {
        for (const objective of this.objectives) {
            if (objective.checkPlayerCollision(player)) {
                return true;
            }
        }
        return false;
    }

    initialize() {
        const initialObjective = new SecondStageObjective();
        initialObjective.spawn(window.innerWidth, window.innerHeight);
        this.objectives = [initialObjective];
        this.spawnTimer = 0;
    }
} 