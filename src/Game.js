import { Player } from './entities/Player.js';
import { BulletPool } from './entities/BulletPool.js';
import { FirstStageObjective } from './entities/FirstStageObjective.js';
import { SecondStageManager } from './entities/SecondStageManager.js';
import { BULLET, OBJECTIVE, FRAME } from './constants.js';

const GameState = {
    FIRST_STAGE: 'FIRST_STAGE',
    TRANSITIONING: 'TRANSITIONING',
    SECOND_STAGE: 'SECOND_STAGE',
    WIN: 'WIN',
    LOSE: 'LOSE'
};

export class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.resizeCanvas();

        this.player = new Player(this.canvas.width, this.canvas.height);
        this.bulletPool = new BulletPool(BULLET.PLAYER.POOL_SIZE);
        
        // Initialize both stage managers
        //this.secondStageManager = new SecondStageManager();
        this.firstStageObjective = new FirstStageObjective();
        
        this.firstStageObjective.spawn(this.canvas.width, this.canvas.height);
        //this.secondStageManager.initialize();

        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastTime = 0;
        this.mouseDown = false;

        this.gameState = GameState.FIRST_STAGE;
        this.stateTransitionTime = 0;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // keyboard input
        window.addEventListener('keydown', e => this.keys[e.key] = true);
        window.addEventListener('keyup', e => this.keys[e.key] = false);

        // mouse input
        window.addEventListener('mousemove', e => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // shoot bullet
        window.addEventListener('mousedown', e => {
            if (e.button === 0) {
                this.mouseDown = true;
            }
        });

        window.addEventListener('mouseup', e => {
            if (e.button === 0) {
                this.mouseDown = false;
            }
        });

        // resize canvas
        window.addEventListener('resize', () => this.resizeCanvas());

        this.canvas.addEventListener('click', () => this.handleClick());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(deltaTime) {
        if (!this.player.alive) return;

        this.player.update(
            this.keys,
            this.mouseX,
            this.mouseY,
            deltaTime,
            this.canvas.width,
            this.canvas.height
        );

        if (this.mouseDown) {
            this.bulletPool.shoot(this.player, Date.now());
        }

        this.bulletPool.update(this.canvas.width, this.canvas.height);
        
        switch (this.gameState) {
            case GameState.FIRST_STAGE:
                this.updateFirstStage(deltaTime);
                break;
                
            case GameState.TRANSITIONING:
                this.updateTransition(deltaTime);
                break;
                
            case GameState.SECOND_STAGE:
                this.updateSecondStage(deltaTime);
                break;
        }
    }

    updateFirstStage(deltaTime) {
        this.firstStageObjective.update(deltaTime);

        if (this.gameState === GameState.FIRST_STAGE) {
           // Check player bullets hitting enemy bullets
            this.bulletPool.bullets.forEach(playerBullet => {
                if (!playerBullet.active) return;
                
                this.firstStageObjective.bulletPool.bullets.forEach(enemyBullet => {
                    if (!enemyBullet.active || !enemyBullet.isPink) return;
                    
                    const dx = playerBullet.x - enemyBullet.x;
                    const dy = playerBullet.y - enemyBullet.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= playerBullet.radius + enemyBullet.radius) {
                        enemyBullet.active = false;
                        playerBullet.active = false;
                        
                        this.firstStageObjective.destroyedPinkBullets++;
                        if (this.firstStageObjective.destroyedPinkBullets >= OBJECTIVE.HIT_ZONE.REQUIRED_PINK_HITS) {
                            this.firstStageObjective.hitZonesVisible = true;
                            this.firstStageObjective.hitZonesVisibleStartTime = Date.now();
                            this.firstStageObjective.destroyedPinkBullets = 0;
                        }
                    }
                });
            }); 
        }
        
        this.bulletPool.bullets.forEach(bullet => {
            if (this.firstStageObjective.checkCollision(bullet)) {
                bullet.active = false;
                if (this.firstStageObjective.destroyedEdges.every(edge => edge)) {
                    this.firstStageObjective.startStopping();
                    setTimeout(() => this.startTransition(), 1000); // Start transition after stopping
                }
            }
        });

        this.firstStageObjective.bulletPool.bullets.forEach(bullet => {
            if (this.player.checkCollision(bullet)) {
                this.gameState = GameState.LOSE;
                this.player.alive = false;
                bullet.active = false;
            }
        });
    }

    updateTransition(deltaTime) {
        const transitionDuration = 1000;
        const currentTime = Date.now();
        const elapsed = currentTime - this.stateTransitionTime;
        
        if (elapsed >= transitionDuration) {
            this.startSecondStage();
        }
    }

    updateSecondStage(deltaTime) {
        // Check if manager signals game end
        if (this.secondStageManager.update(this.player, deltaTime)) {
            this.gameState = GameState.WIN;
            return;
        }
        
        this.bulletPool.bullets.forEach(bullet => {
            if (this.secondStageManager.checkCollisions(bullet)) {
                bullet.active = false;
            }
        });

        if (this.secondStageManager.checkPlayerCollision(this.player)) {
            this.gameState = GameState.LOSE;
            this.player.alive = false;
        }
    }

    startTransition() {
        this.gameState = GameState.TRANSITIONING;
        this.stateTransitionTime = Date.now();
        
        // Debug log for first stage angle
        const finalAngle = this.firstStageObjective.angle;
        
        this.secondStageManager = new SecondStageManager();
        this.secondStageManager.initialize(finalAngle);
    }

    startSecondStage() {
        this.gameState = GameState.SECOND_STAGE;
        this.firstStageObjective = null;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.bulletPool.draw(this.ctx);
        this.player.draw(this.ctx);

        switch (this.gameState) {
            case GameState.FIRST_STAGE:
                this.firstStageObjective.draw(this.ctx);
                this.firstStageObjective.bulletPool.draw(this.ctx);
                break;
                
            case GameState.TRANSITIONING:
                const elapsed = Date.now() - this.stateTransitionTime;
                const progress = elapsed / 1000;
                
                this.ctx.save();
                this.ctx.globalAlpha = 1 - progress;
                this.firstStageObjective.draw(this.ctx);
                this.ctx.globalAlpha = progress;
                this.secondStageManager.draw(this.ctx);
                this.ctx.restore();
                break;
                
            case GameState.SECOND_STAGE:
                this.secondStageManager.draw(this.ctx);
                break;
        }

        if (this.gameState === GameState.WIN || this.gameState === GameState.LOSE) {
            this.drawGameEnd();
        }
    }

    drawGameEnd() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const message = this.gameState === GameState.WIN ? 'You Win!' : 'Game Over';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Click to restart', this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.restore();
    }

    handleClick() {
        if (this.gameState === GameState.WIN || this.gameState === GameState.LOSE) {
            this.restart();
        }
    }

    restart() {
        // For testing purposes, start directly in second stage
        this.gameState = GameState.SECOND_STAGE;
        this.secondStageManager = new SecondStageManager();
        this.secondStageManager.initialize();
        this.firstStageObjective = null;
        this.player.alive = true;
        this.bulletPool.bullets.forEach(bullet => bullet.active = false);
    }

    gameLoop(timestamp) {
        const deltaTime = Math.min(timestamp - this.lastTime, FRAME.TARGET_MS);
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }

    start() {
        this.gameLoop(0);
    }
} 