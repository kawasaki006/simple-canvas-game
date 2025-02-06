import { SecondStageObjective } from './SecondStageObjective.js';

export class SecondStageManager {
    constructor() {
        this.objectives = [];
        this.maxCopies = 5;
        this.spawnTimer = 0;
        this.spawnInterval = 6000; // 6 seconds between spawns (4s cycle + 2s spawn)
        this.trueObjectiveIndex = -1;
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
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnNewCopy();
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