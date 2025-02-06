import { SecondStageObjective } from './SecondStageObjective.js';
import { BULLET } from '../constants.js';

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
        this.flickerStartTime = 0;
        this.isFlickering = false;
        // Add death sequence tracking
        this.isDying = false;
        this.deathStartTime = 0;
    }

    update(player, deltaTime) {
        // If in death sequence, check for timing
        if (this.isDying) {
            const deathElapsed = Date.now() - this.deathStartTime;
            if (deathElapsed >= 1000) { // 1 second delay before game end
                return true; // Signal to game that it should transition to win state
            }
            return false;
        }

        // Regular update logic
        this.objectives.forEach(objective => {
            if (objective.active) {
                objective.update(player, deltaTime);
            }
        });

        // Update flicker effect if active
        if (this.isFlickering) {
            const flickerElapsed = Date.now() - this.flickerStartTime;
            if (flickerElapsed >= 1000) {
                this.isFlickering = false;
                const trueObjective = this.objectives[this.trueObjectiveIndex];
                trueObjective.isVulnerable = true;
            }
        }

        // Handle spawning based on timer
        if (!this.isDying && this.objectives.length < this.maxCopies) {
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

        return false; // Game continues
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
            // Note: isVulnerable is not set here anymore
        }
    }

    draw(ctx) {
        // Draw all active objectives
        this.objectives.forEach((objective, index) => {
            if (!objective.active) return;

            ctx.save();
            ctx.translate(objective.x, objective.y);
            ctx.rotate(objective.angle);

            // Draw the triangle
            ctx.beginPath();
            const points = objective.getTrianglePoints();
            ctx.moveTo(points[0].x, points[0].y);
            ctx.lineTo(points[1].x, points[1].y);
            ctx.lineTo(points[2].x, points[2].y);
            ctx.closePath();

            // Set fill style based on state
            if (index === this.trueObjectiveIndex && this.isFlickering) {
                // Flicker effect
                const flickerTime = Date.now() - this.flickerStartTime;
                ctx.fillStyle = flickerTime % 200 < 100 ? 'red' : 'white';
            } else {
                ctx.fillStyle = 'red';
            }
            ctx.fill();

            ctx.restore();

            // Draw bullet pool
            objective.bulletPool.draw(ctx);
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
        for (let i = 0; i < this.objectives.length; i++) {
            const objective = this.objectives[i];
            if (!objective.active || !bullet.active) continue;

            const dx = bullet.x - objective.x;
            const dy = bullet.y - objective.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (i === this.trueObjectiveIndex) {
                if (!this.isFlickering && !objective.isVulnerable) {
                    if (distance < objective.size + bullet.radius) {
                        this.startFlicker();
                        return true;
                    }
                } else if (objective.isVulnerable) {
                    // Increased hit zone size to objective.size (same as regular collision)
                    if (distance < objective.size + bullet.radius) {
                        objective.hitCount++;
                        if (objective.hitCount >= 2) {
                            this.startDeathSequence();
                        }
                        return true;
                    }
                }
            }
            
            // Regular collision check comes last
            if (distance < objective.size + bullet.radius) {
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

    startFlicker() {
        this.isFlickering = true;
        this.flickerStartTime = Date.now();
    }

    startDeathSequence() {
        this.isDying = true;
        this.deathStartTime = Date.now();
        // Keep only the true objective
        this.objectives = [this.objectives[this.trueObjectiveIndex]];
        // Make it static
        const trueObjective = this.objectives[0];
        trueObjective.state = 'STATIC';
    }
} 