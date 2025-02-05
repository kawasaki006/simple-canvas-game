import { Player } from './entities/Player.js';
import { BulletPool } from './entities/BulletPool.js';
import { Objective } from './entities/Objective.js';
import { BULLET, OBJECTIVE, FRAME } from './constants.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.resizeCanvas();

        this.player = new Player(this.canvas.width, this.canvas.height);
        this.bulletPool = new BulletPool(BULLET.PLAYER.POOL_SIZE);
        this.objective = new Objective();
        
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastTime = 0;

        this.setupEventListeners();
        this.objective.spawn(this.canvas.width, this.canvas.height);
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
                this.bulletPool.shoot(this.player, Date.now());
            }
        });

        // resize canvas
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(deltaTime) {
        if (!this.player.alive) return;

        this.player.update(this.keys, this.mouseX, this.mouseY, deltaTime, 
                          this.canvas.width, this.canvas.height);
        this.bulletPool.update(this.canvas.width, this.canvas.height);
        this.objective.update();

        // Check player bullets hitting enemy bullets
        this.bulletPool.bullets.forEach(playerBullet => {
            if (!playerBullet.active) return;
            
            this.objective.bulletPool.bullets.forEach(enemyBullet => {
                if (!enemyBullet.active || !enemyBullet.isPink) return;
                
                const dx = playerBullet.x - enemyBullet.x;
                const dy = playerBullet.y - enemyBullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= playerBullet.radius + enemyBullet.radius) {
                    enemyBullet.active = false;
                    playerBullet.active = false;
                    
                    this.objective.destroyedPinkBullets++;
                    if (this.objective.destroyedPinkBullets >= OBJECTIVE.HIT_ZONE.REQUIRED_PINK_HITS) {
                        this.objective.hitZonesVisible = true;
                        this.objective.hitZonesVisibleStartTime = Date.now();
                        this.objective.destroyedPinkBullets = 0;
                    }
                }
            });
        });

        // Check player bullets hitting objective
        this.bulletPool.bullets.forEach(bullet => {
            if (this.objective.checkCollision(bullet)) {
                this.objective.active = false;
                bullet.active = false;
            }
        });

        // Check enemy bullets hitting player
        this.objective.bulletPool.bullets.forEach(bullet => {
            if (this.player.checkCollision(bullet)) {
                //this.player.alive = false;
                //bullet.active = false;
            }
        });

        if (!this.objective.active) {
            this.objective.spawn(this.canvas.width, this.canvas.height);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // draw player and bullets
        if (this.player.alive) {
            this.player.draw(this.ctx);
        }
        this.bulletPool.draw(this.ctx);

        // draw objective and enemy bullets
        this.objective.draw(this.ctx);
        this.objective.bulletPool.draw(this.ctx);
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