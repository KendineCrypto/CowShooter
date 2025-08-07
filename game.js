class CowShooterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.gameStarted = false;
        
        // Oyun nesneleri
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        
        // Images
        this.images = {
            cow: null,
            butcher: null
        };
        
        // Sound effects
        this.audioContext = null;
        this.sounds = {};
        
        // Background color changes
        this.backgroundColors = [
            {top: '#87CEEB', bottom: '#98FB98'}, // Blue-Green
            {top: '#FFB6C1', bottom: '#FFC0CB'}, // Pink
            {top: '#DDA0DD', bottom: '#E6E6FA'}, // Purple
            {top: '#F0E68C', bottom: '#F5DEB3'}, // Yellow-Brown
            {top: '#98FB98', bottom: '#90EE90'}, // Green
            {top: '#FFA07A', bottom: '#FFB6C1'}, // Orange-Pink
            {top: '#87CEEB', bottom: '#E0FFFF'}, // Blue-Light Blue
            {top: '#D8BFD8', bottom: '#F0F8FF'}  // Lavender
        ];
        this.currentBgIndex = 0;
        
        // Game settings
        this.enemySpawnRate = 2000; // ms
        this.lastEnemySpawn = 0;
        this.bulletSpeed = 15;
        this.enemySpeed = 1;
        this.gameTime = 0; // Game time
        this.speedIncreaseRate = 0.1; // Speed increase rate
        
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.setupEventListeners();
        this.createPlayer();
        this.loadImages();
        this.initAudio();
        this.showStartScreen();
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('No audio support');
        }
    }

    loadImages() {
        // Load images
        this.images.cow = new Image();
        this.images.cow.src = 'assets/images/cow.png';
        
        this.images.butcher = new Image();
        this.images.butcher.src = 'assets/images/butcher.png';
        
        // Use placeholder if image fails to load
        this.images.cow.onerror = () => {
            console.log('Cow image failed to load, using placeholder');
            this.images.cow = null;
        };
        
        this.images.butcher.onerror = () => {
            console.log('Butcher image failed to load, using placeholder');
            this.images.butcher = null;
        };
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Keyboard controls
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('menuButton').addEventListener('click', () => {
            this.showStartScreen();
        });
    }

    createPlayer() {
        this.player = {
            x: this.canvas.width / 2,
            y: 100,
            radius: 30,
            color: '#FFB6C1', // Pink udder color
            angle: 0,
            speed: 5,
            direction: 1, // 1: right, -1: left
            isMoving: false,
            animationFrame: 0,
            hitEffect: 0, // Hit effect duration
            keys: {
                up: false,
                down: false,
                left: false,
                right: false
            }
        };
    }

    showStartScreen() {
        this.gameStarted = false;
        this.gameRunning = false;
        document.getElementById('startScreen').style.display = 'block';
        document.getElementById('gameOver').style.display = 'none';
        this.clearGame();
    }

    startGame() {
        this.gameStarted = true;
        this.gameRunning = true;
        this.score = 0;
        this.lives = 3;
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.gameTime = 0;
        
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        
        this.updateUI();
        this.gameLoop();
    }

    restartGame() {
        this.startGame();
    }

    clearGame() {
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
    }

    handleKeyDown(e) {
        if (!this.gameRunning) return;
        
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.player.keys.up = true;
                break;
            case 's':
            case 'arrowdown':
                this.player.keys.down = true;
                break;
            case 'a':
            case 'arrowleft':
                this.player.keys.left = true;
                this.player.direction = -1; // Sola dönüş
                break;
            case 'd':
            case 'arrowright':
                this.player.keys.right = true;
                this.player.direction = 1; // Sağa dönüş
                break;
        }
    }

    handleKeyUp(e) {
        if (!this.gameRunning) return;
        
        switch(e.key.toLowerCase()) {
            case 'w':
            case 'arrowup':
                this.player.keys.up = false;
                break;
            case 's':
            case 'arrowdown':
                this.player.keys.down = false;
                break;
            case 'a':
            case 'arrowleft':
                this.player.keys.left = false;
                break;
            case 'd':
            case 'arrowright':
                this.player.keys.right = false;
                break;
        }
    }

    updatePlayer() {
        // Check movement state
        this.player.isMoving = this.player.keys.up || this.player.keys.down || 
                               this.player.keys.left || this.player.keys.right;
        
        // Update animation frame
        if (this.player.isMoving) {
            this.player.animationFrame += 0.2;
        } else {
            this.player.animationFrame = 0;
        }
        
        // Decrease hit effect duration
        if (this.player.hitEffect > 0) {
            this.player.hitEffect--;
        }
        
        // Player movement
        if (this.player.keys.up && this.player.y > this.player.radius) {
            this.player.y -= this.player.speed;
        }
        if (this.player.keys.down && this.player.y < this.canvas.height - this.player.radius) {
            this.player.y += this.player.speed;
        }
        if (this.player.keys.left && this.player.x > this.player.radius) {
            this.player.x -= this.player.speed;
        }
        if (this.player.keys.right && this.player.x < this.canvas.width - this.player.radius) {
            this.player.x += this.player.speed;
        }
    }

    handleClick(e) {
        if (!this.gameRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Süt fışkırtma efekti
        this.shootBullet(x, y);
        this.createMilkSpray();
        this.playMilkSound();
    }

    shootBullet(targetX, targetY) {
        const dx = targetX - this.player.x;
        const dy = targetY - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        const vx = (dx / distance) * this.bulletSpeed;
        const vy = (dy / distance) * this.bulletSpeed;
        
        // Süt damlası pozisyonu (meme ortasından çıkıyor)
        let startX = this.player.x;
        let startY = this.player.y;
        
        if (this.images.cow && this.images.cow.complete) {
            // Görsel varsa meme ortasından çıkıyor
            startY = this.player.y - this.player.radius * 0.5;
        } else {
            // Placeholder için meme ortasından
            startY = this.player.y - 5;
        }
        
        this.bullets.push({
            x: startX,
            y: startY,
            vx: vx,
            vy: vy,
            radius: 4,
            color: '#FFFFFF',
            life: 80, // Daha uzun yaşam süresi
            type: 'milk'
        });
    }

    createMilkSpray() {
        // Süt fışkırtma efekti için parçacıklar
        const sprayCount = 20; // Daha fazla parçacık
        
        for (let i = 0; i < sprayCount; i++) {
            const angle = (Math.PI * 2 * i) / sprayCount;
            const speed = 4 + Math.random() * 6;
            
            // Süt fışkırtma pozisyonu (meme ortasından)
            let startX = this.player.x;
            let startY = this.player.y;
            
            if (this.images.cow && this.images.cow.complete) {
                startY = this.player.y - this.player.radius * 0.5;
            } else {
                startY = this.player.y - 5;
            }
            
            this.particles.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 2 + Math.random() * 3,
                color: '#FFFFFF',
                life: 50 + Math.random() * 50,
                type: 'milk',
                alpha: 1.0
            });
        }
        
        // Ekstra büyük süt damlaları
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5;
            const speed = 6 + Math.random() * 4;
            
            let startX = this.player.x;
            let startY = this.player.y;
            
            if (this.images.cow && this.images.cow.complete) {
                startY = this.player.y - this.player.radius * 0.5;
            } else {
                startY = this.player.y - 5;
            }
            
            this.particles.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 5 + Math.random() * 3,
                color: '#F0F8FF',
                life: 60 + Math.random() * 40,
                type: 'milk_large',
                alpha: 1.0
            });
        }
    }

    spawnEnemy() {
        const side = Math.floor(Math.random() * 4); // 0: üst, 1: sağ, 2: alt, 3: sol
        let x, y;
        
        switch(side) {
            case 0: // üst
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // sağ
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // alt
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // sol
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
        }
        
        // Zamanla artan hız
        const currentSpeed = this.enemySpeed + (this.gameTime * this.speedIncreaseRate);
        
        this.enemies.push({
            x: x,
            y: y,
            radius: 20,
            color: '#FF4444', // Kırmızı kasap
            speed: currentSpeed + Math.random() * 0.5
        });
    }

    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Oyuncuya doğru hareket
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
            
            // Oyuncuya çok yaklaştıysa can kaybı
            if (distance < 50) {
                this.lives--;
                this.enemies.splice(i, 1);
                this.updateUI();
                
                // Vurulma efekti başlat
                this.player.hitEffect = 30; // 30 frame süre
                
                // Vurulma parçacık efekti
                this.createPlayerHitEffect();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        }
    }

    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            // Ekran dışına çıktıysa veya yaşam süresi bittiyse sil
            if (bullet.x < 0 || bullet.x > this.canvas.width || 
                bullet.y < 0 || bullet.y > this.canvas.height || 
                bullet.life <= 0) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Düşmanlarla çarpışma kontrolü
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < enemy.radius + bullet.radius) {
                    // Düşman vuruldu
                    this.enemies.splice(j, 1);
                    this.bullets.splice(i, 1);
                    this.score++;
                    this.updateUI();
                    this.createHitEffect(enemy.x, enemy.y);
                    break;
                }
            }
        }
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Süt parçacıkları için özel efektler
            if (particle.type === 'milk' || particle.type === 'milk_large') {
                particle.vy += 0.03; // Çok hafif yerçekimi
                particle.vx *= 0.99; // Hava direnci
                particle.vy *= 0.99;
                
                // Alpha değerini azalt (şeffaflık)
                particle.alpha = Math.max(0, particle.alpha - 0.02);
            } else if (particle.type === 'player_hit') {
                // Oyuncu vurulma parçacıkları
                particle.vy += 0.05; // Hafif yerçekimi
                particle.vx *= 0.95; // Hava direnci
                particle.vy *= 0.95;
                
                // Alpha değerini azalt (şeffaflık)
                particle.alpha = Math.max(0, particle.alpha - 0.03);
            } else {
                particle.vy += 0.1; // Normal yerçekimi
            }
            
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    createHitEffect(x, y) {
        // Vurulma efekti için parçacıklar
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 4 + Math.random() * 6;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 4 + Math.random() * 5,
                color: '#FFD700', // Altın sarısı
                life: 50 + Math.random() * 30,
                type: 'hit'
            });
        }
        
        // Arka plan renk değişimi
        this.changeBackground();
        
        // Ateş sesi efekti
        this.playShootSound();
    }

    changeBackground() {
        // Bir sonraki renk kombinasyonuna geç
        this.currentBgIndex = (this.currentBgIndex + 1) % this.backgroundColors.length;
    }

    playShootSound() {
        if (!this.audioContext) return;
        
        try {
            // Vurulma sesi (düşük frekans)
            const hitOscillator = this.audioContext.createOscillator();
            const hitGainNode = this.audioContext.createGain();
            
            hitOscillator.connect(hitGainNode);
            hitGainNode.connect(this.audioContext.destination);
            
            hitOscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            hitOscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
            
            hitGainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            hitGainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            hitOscillator.start(this.audioContext.currentTime);
            hitOscillator.stop(this.audioContext.currentTime + 0.2);
            
        } catch (e) {
            console.log('Ses çalınamadı:', e);
        }
    }

    playMilkSound() {
        if (!this.audioContext) return;
        
        try {
            // Süt fışkırtma sesi (yüksek frekans)
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.15);
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);
            
        } catch (e) {
            console.log('Süt sesi çalınamadı:', e);
        }
    }

    createPlayerHitEffect() {
        // Oyuncu vurulma parçacık efekti
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const speed = 3 + Math.random() * 4;
            
            this.particles.push({
                x: this.player.x,
                y: this.player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 3 + Math.random() * 3,
                color: '#FF0000', // Kırmızı
                life: 40 + Math.random() * 20,
                type: 'player_hit',
                alpha: 1.0
            });
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('time').textContent = Math.floor(this.gameTime);
    }

    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').style.display = 'block';
    }

    drawPlayer() {
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        
        // Yön animasyonu
        if (this.player.direction === -1) {
            this.ctx.scale(-1, 1); // Sola dönüş için yatay çevirme
        }
        
        // Koşma animasyonu (hafif yukarı-aşağı hareket)
        if (this.player.isMoving) {
            const bounce = Math.sin(this.player.animationFrame) * 2;
            this.ctx.translate(0, bounce);
        }
        
        // Vurulma efekti (kırmızı parıltı)
        if (this.player.hitEffect > 0) {
            const intensity = this.player.hitEffect / 30; // 0-1 arası
            this.ctx.shadowColor = '#FF0000';
            this.ctx.shadowBlur = 20 * intensity;
            this.ctx.globalAlpha = 0.8 + (0.2 * intensity);
        }
        
        if (this.images.cow && this.images.cow.complete) {
            // İnek görseli varsa onu kullan
            const size = this.player.radius * 2.5; // Biraz daha büyük
            this.ctx.drawImage(this.images.cow, -size/2, -size/2, size, size);
            
            // Süt fışkırtma noktası için küçük işaret (meme ortası)
            this.ctx.beginPath();
            this.ctx.arc(0, -size/2 * 0.5, 3, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FF1493';
            this.ctx.fill();
        } else {
            // Placeholder meme gövdesi (pembe daire)
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = this.player.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#FF69B4';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            // Meme ucu (küçük daire) - ortada
            this.ctx.beginPath();
            this.ctx.arc(0, -5, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = '#FF1493';
            this.ctx.fill();
        }
        
        // Vurulma efekti sıfırla
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
        
        this.ctx.restore();
    }

    drawEnemies() {
        this.enemies.forEach(enemy => {
            if (this.images.butcher && this.images.butcher.complete) {
                // Kasap görseli varsa onu kullan (düz, dönmüyor)
                const size = enemy.radius * 2.5; // Biraz daha büyük
                this.ctx.drawImage(this.images.butcher, enemy.x - size/2, enemy.y - size/2, size, size);
                
                // Tehlike efekti (kırmızı halka)
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            } else {
                // Placeholder kasap (kırmızı daire)
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = enemy.color;
                this.ctx.fill();
                this.ctx.strokeStyle = '#8B0000';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Kasap bıçağı efekti (düz)
                this.ctx.fillStyle = '#C0C0C0';
                this.ctx.fillRect(enemy.x - 15, enemy.y - 2, 30, 4);
            }
        });
    }

    drawBullets() {
        this.bullets.forEach(bullet => {
            // Süt damlası efekti
            this.ctx.save();
            this.ctx.translate(bullet.x, bullet.y);
            
            // Ana damla
            this.ctx.beginPath();
            this.ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = bullet.color;
            this.ctx.fill();
            
            // Parlaklık efekti
            this.ctx.beginPath();
            this.ctx.arc(-bullet.radius/3, -bullet.radius/3, bullet.radius/3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();
            
            // Dış halka
            this.ctx.beginPath();
            this.ctx.arc(0, 0, bullet.radius + 1, 0, Math.PI * 2);
            this.ctx.strokeStyle = '#F0F8FF';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }

    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            
            // Alpha değeri varsa kullan
            if (particle.alpha !== undefined) {
                this.ctx.globalAlpha = particle.alpha;
            }
            
            if (particle.type === 'milk' || particle.type === 'milk_large') {
                // Süt parçacıkları için özel çizim
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = particle.color;
                this.ctx.fill();
                
                // Parlaklık efekti
                this.ctx.beginPath();
                this.ctx.arc(particle.x - particle.radius/3, particle.y - particle.radius/3, particle.radius/3, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                this.ctx.fill();
                
                // Dış halka
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.radius + 1, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            } else {
                // Normal parçacıklar
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = particle.color;
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }

    draw() {
        // Dinamik gradyan arka plan
        const currentBg = this.backgroundColors[this.currentBgIndex];
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, currentBg.top);
        gradient.addColorStop(1, currentBg.bottom);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Oyun nesnelerini çiz
        this.drawParticles();
        this.drawBullets();
        this.drawEnemies();
        this.drawPlayer();
    }

    update() {
        if (!this.gameRunning) return;
        
        // Oyun süresini güncelle
        this.gameTime += 0.016; // ~60 FPS
        
        // Oyuncu güncelleme
        this.updatePlayer();
        
        // Düşman spawn
        const now = Date.now();
        if (now - this.lastEnemySpawn > this.enemySpawnRate) {
            this.spawnEnemy();
            this.lastEnemySpawn = now;
            
            // Zamanla spawn hızını artır
            this.enemySpawnRate = Math.max(500, this.enemySpawnRate - 10);
        }
        
        this.updateEnemies();
        this.updateBullets();
        this.updateParticles();
    }

    gameLoop() {
        this.update();
        this.draw();
        
        if (this.gameRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Oyunu başlat
window.addEventListener('load', () => {
    new CowShooterGame();
}); 