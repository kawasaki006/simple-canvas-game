import { SecondStageObjective } from './SecondStageObjective.js';

export class SecondStageManager {
    constructor() {
        this.objectives = [];
        this.maxCopies = 5;
        this.spawnProgress = 0;
        this.spawnStartTime = 0;
        this.isSpawning = false;
        this.trueObjectiveIndex = -1;
    }

    update(player, deltaTime) {
        // Update all existing objectives
        this.objectives.forEach(objective => {
            if (objective.active) {
                objective.update(player, deltaTime);
            }
        });

        // Handle spawning logic
        if (this.isSpawning) {
            const currentTime = Date.now();
            const stateTime = currentTime - this.spawnStartTime;
            this.spawnProgress = Math.min(1, stateTime / 2000); // 2 second spawn

            if (this.spawnProgress >= 1) {
                this.finalizeSpawn();
            }
        }
    }

    startSpawning() {
        this.isSpawning = true;
        this.spawnStartTime = Date.now();
        this.spawnProgress = 0;
    }

    finalizeSpawn() {
        // Create new objective at center
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

        this.isSpawning = false;
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
        ctx.globalAlpha = this.spawnProgress * 0.5;
        
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
    }
} 