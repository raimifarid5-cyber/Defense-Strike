// Defense Strike Game - Complete Game Logic
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let gameRunning = false;
let gamePaused = false;
let score = 0;
let health = 100;
let wave = 1;
let currentWeapon = 'Laser';
let touchStartX = 0;
let touchEndX = 0;

// Player
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    width: 40,
    height: 50,
    speed: 6,
    dx: 0,
    health: 100
};

// Bullets
let bullets = [];
const bulletTypes = {
    Laser: { speed: 8, size: 5, color: '#00ff00', damage: 10 },
    Missile: { speed: 6, size: 8, color: '#ffff00', damage: 25 },
    Plasma: { speed: 7, size: 6, color: '#ff00ff', damage: 15 }
};

// Enemies
let enemies = [];
let bosses = [];

// Power-ups
let powerUps = [];

// Input Handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === ' ') {
        e.preventDefault();
        shoot();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch Controls
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
    touchEndX = e.touches[0].clientX;
    handleTouchMove();
});

canvas.addEventListener('touchend', () => {
    shoot();
});

canvas.addEventListener('click', () => {
    if (gameRunning && !gamePaused) {
        shoot();
    }
});

function handleTouchMove() {
    const diff = touchEndX - touchStartX;
    if (diff > 10) {
        player.dx = player.speed; // Move right
    } else if (diff < -10) {
        player.dx = -player.speed; // Move left
    } else {
        player.dx = 0;
    }
}

// Button Controls
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('restartBtn').addEventListener('click', restartGame);

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gamePaused = false;
        document.getElementById('gameStatus').textContent = '🎮 Game Started! Defend the city!';
        document.getElementById('startBtn').textContent = 'RESUME';
        gameLoop();
    }
}

function togglePause() {
    if (gameRunning) {
        gamePaused = !gamePaused;
        document.getElementById('pauseBtn').textContent = gamePaused ? 'RESUME' : 'PAUSE';
        document.getElementById('gameStatus').textContent = gamePaused ? '⏸️ PAUSED' : '🎮 Game Started! Defend the city!';
        if (!gamePaused) gameLoop();
    }
}

function restartGame() {
    gameRunning = false;
    gamePaused = false;
    score = 0;
    health = 100;
    wave = 1;
    currentWeapon = 'Laser';
    player.x = canvas.width / 2;
    player.y = canvas.height - 60;
    bullets = [];
    enemies = [];
    bosses = [];
    powerUps = [];
    updateStats();
    document.getElementById('gameStatus').textContent = '🎮 Game Restarted! Click START to begin!';
    document.getElementById('startBtn').textContent = 'START GAME';
}

function updateStats() {
    document.getElementById('score').textContent = score;
    document.getElementById('health').textContent = health;
    document.getElementById('wave').textContent = wave;
    document.getElementById('weapon').textContent = currentWeapon;
}

function shoot() {
    if (!gameRunning || gamePaused) return;

    const bullet = {
        x: player.x + player.width / 2,
        y: player.y,
        ...bulletTypes[currentWeapon]
    };
    bullets.push(bullet);
}

function spawnEnemies() {
    const enemyCount = 3 + wave * 2;
    for (let i = 0; i < enemyCount; i++) {
        enemies.push({
            x: Math.random() * (canvas.width - 30),
            y: Math.random() * 100 + 20,
            width: 30,
            height: 30,
            speed: 2 + wave * 0.5,
            health: 20 + wave * 5,
            color: '#ff0000'
        });
    }

    // Spawn boss every 3 waves
    if (wave % 3 === 0) {
        bosses.push({
            x: canvas.width / 2 - 40,
            y: 30,
            width: 80,
            height: 60,
            speed: 2,
            health: 150 + wave * 50,
            maxHealth: 150 + wave * 50,
            color: '#ff6600'
        });
    }
}

function updatePlayer() {
    // Keyboard controls
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        player.dx = -player.speed;
    } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        player.dx = player.speed;
    } else {
        player.dx = 0;
    }

    player.x += player.dx;

    // Boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;

        // Remove off-screen bullets
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
}

function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;

        // Random horizontal movement
        enemy.x += Math.sin(Date.now() / 1000 + i) * 2;

        // Boundaries
        if (enemy.x < 0) enemy.x = 0;
        if (enemy.x + enemy.width > canvas.width) enemy.x = canvas.width - enemy.width;

        // Collision with player
        if (isColliding(player, enemy)) {
            health -= 5;
            enemies.splice(i, 1);
        }

        // Remove off-screen enemies
        if (enemy.y > canvas.height) {
            health -= 10;
            enemies.splice(i, 1);
        }
    }

    // Wave completion
    if (enemies.length === 0 && bosses.length === 0 && gameRunning) {
        wave++;
        spawnEnemies();
    }
}

function updateBosses() {
    for (let i = bosses.length - 1; i >= 0; i--) {
        const boss = bosses[i];
        boss.x += Math.sin(Date.now() / 1000) * 3;

        // Boundaries
        if (boss.x < 0) boss.x = 0;
        if (boss.x + boss.width > canvas.width) boss.x = canvas.width - boss.width;

        // Collision with player
        if (isColliding(player, boss)) {
            health -= 15;
            bosses.splice(i, 1);
        }

        // Remove if off-screen
        if (boss.y > canvas.height) {
            bosses.splice(i, 1);
        }
    }
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.y += 3;

        // Collision with player
        if (isColliding(player, powerUp)) {
            applyPowerUp(powerUp.type);
            powerUps.splice(i, 1);
        }

        // Remove off-screen
        if (powerUp.y > canvas.height) {
            powerUps.splice(i, 1);
        }
    }
}

function applyPowerUp(type) {
    switch (type) {
        case 'weapon':
            const weapons = ['Laser', 'Missile', 'Plasma'];
            const currentIndex = weapons.indexOf(currentWeapon);
            currentWeapon = weapons[(currentIndex + 1) % weapons.length];
            score += 50;
            break;
        case 'health':
            health = Math.min(100, health + 30);
            score += 30;
            break;
        case 'shield':
            health = Math.min(100, health + 50);
            score += 50;
            break;
    }
}

function checkCollisions() {
    // Bullet vs Enemy
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = enemies.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], enemies[j])) {
                enemies[j].health -= bullets[i].damage;
                bullets.splice(i, 1);

                if (enemies[j].health <= 0) {
                    score += 10 + wave * 5;

                    // Random power-up drop
                    if (Math.random() < 0.3) {
                        const types = ['weapon', 'health', 'shield'];
                        powerUps.push({
                            x: enemies[j].x,
                            y: enemies[j].y,
                            width: 20,
                            height: 20,
                            type: types[Math.floor(Math.random() * types.length)],
                            color: '#ffff00'
                        });
                    }

                    enemies.splice(j, 1);
                }
                break;
            }
        }
    }

    // Bullet vs Boss
    for (let i = bullets.length - 1; i >= 0; i--) {
        for (let j = bosses.length - 1; j >= 0; j--) {
            if (isColliding(bullets[i], bosses[j])) {
                bosses[j].health -= bullets[i].damage;
                bullets.splice(i, 1);

                if (bosses[j].health <= 0) {
                    score += 500 + wave * 100;
                    bosses.splice(j, 1);
                }
                break;
            }
        }
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw player (defender turret)
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = '#00dd00';
    ctx.fillRect(player.x + 15, player.y - 10, 10, 10);

    // Draw bullets
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

        // Health bar
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(enemy.x, enemy.y - 5, enemy.width, 3);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(enemy.x, enemy.y - 5, (enemy.health / (20 + wave * 5)) * enemy.width, 3);
    });

    // Draw bosses
    bosses.forEach(boss => {
        ctx.fillStyle = boss.color;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

        // Boss indicator
        ctx.fillStyle = '#ffff00';
        ctx.font = '16px Arial';
        ctx.fillText('BOSS', boss.x + boss.width / 2 - 20, boss.y + boss.height / 2);

        // Boss health bar
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(boss.x, boss.y - 10, boss.width, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(boss.x, boss.y - 10, (boss.health / boss.maxHealth) * boss.width, 5);
    });

    // Draw power-ups
    powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.color;
        ctx.beginPath();
        ctx.arc(powerUp.x + 10, powerUp.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();

        // Icon
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(powerUp.type[0].toUpperCase(), powerUp.x + 6, powerUp.y + 14);
    });
}

function gameOver() {
    gameRunning = false;
    document.getElementById('gameStatus').textContent = `💀 GAME OVER! Final Score: ${score} | Wave: ${wave}`;
    document.getElementById('startBtn').textContent = 'START GAME';
}

function gameLoop() {
    if (!gameRunning || gamePaused) return;

    updatePlayer();
    updateBullets();
    updateEnemies();
    updateBosses();
    updatePowerUps();
    checkCollisions();
    draw();
    updateStats();

    if (health <= 0) {
        gameOver();
        return;
    }

    if (enemies.length === 0 && bosses.length === 0) {
        spawnEnemies();
    }

    requestAnimationFrame(gameLoop);
}

// Initialize
updateStats();
document.getElementById('gameStatus').textContent = '🎮 Click START to begin!';
spawnEnemies();