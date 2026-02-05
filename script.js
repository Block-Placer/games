const correctPassword = "CHEMISTREE";
function showPasswordModal() {
    const modal = document.getElementById('password-modal');
    const input = document.getElementById('pass-field');
    const errorMsg = document.getElementById('error-msg');
    modal.style.display = 'flex';
    input.value = '';
    errorMsg.style.display = 'none';
    input.classList.remove('error');
    input.focus();
    input.onkeyup = function(e) {
        if (e.key === "Enter") {
            validatePassword(input.value);
        }
    };
}
function validatePassword(inputVal) {
    const input = document.getElementById('pass-field');
    const errorMsg = document.getElementById('error-msg');
    if (inputVal.toUpperCase() === correctPassword) {
        document.getElementById('password-modal').style.display = 'none';
        initiateBreach();
    } else {
        errorMsg.style.display = 'block';
        input.classList.add('shake');
        input.classList.add('error');
        setTimeout(() => {
            input.classList.remove('shake');
        }, 500);
    }
}
function initiateBreach() {
    const body = document.body;
    const overlay = document.getElementById('hack-overlay');
    const hackText = document.getElementById('hack-text');
    overlay.style.display = 'flex';
    let steps = 0;
    const textInterval = setInterval(() => {
        steps++;
        if (steps === 1) hackText.innerText = "ACCESS GRANTED";
        if (steps === 2) hackText.innerText = "LOADING MODULES...";
        if (steps === 3) {
            hackText.innerText = "SYSTEM COMPROMISED";
            hackText.style.color = "black";
            hackText.style.backgroundColor = "white";
        }
        if (steps === 5) {
            clearInterval(textInterval);
            body.classList.add('mode-arcade');
            overlay.style.display = 'none';
            if (arcadeSystem.audioCtx.state === 'suspended') arcadeSystem.audioCtx.resume();
        }
    }, 400);
}
const arcadeSystem = {
    canvas: document.getElementById('game-canvas'),
    ctx: document.getElementById('game-canvas').getContext('2d'),
    overlay: document.getElementById('game-overlay'),
    titleEl: document.getElementById('game-title'),
    msgEl: document.getElementById('game-message'),
    scoreEl: document.getElementById('score-val'),
    currentGameId: null,
    activeGame: null,
    isPlaying: false,
    animationFrameId: null,
    audioCtx: new (window.AudioContext || window.webkitAudioContext)(),
    init: function() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        document.addEventListener('keydown', (e) => this.handleInput(e));
        document.addEventListener('keyup', (e) => {
             if (this.isPlaying && this.activeGame && this.activeGame.input) {
                this.activeGame.input(e);
            }
        });
    },
    resizeCanvas: function() {
        const aspect = 800/600;
        const h = window.innerHeight - 100;
        const w = h * aspect;
        if (w > window.innerWidth - 20) {
            this.canvas.style.width = (window.innerWidth - 40) + 'px';
            this.canvas.style.height = ((window.innerWidth - 40) / aspect) + 'px';
        } else {
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';
        }
    },
    loadGame: function(gameId) {
        this.stopGameLoop();
        document.getElementById('menu-screen').classList.remove('active-screen');
        document.getElementById('game-screen').classList.add('active-screen');
        this.currentGameId = gameId;
        this.activeGame = games[gameId];
        this.titleEl.innerText = this.activeGame.name;
        this.msgEl.innerHTML = this.activeGame.instructions;
        this.overlay.style.display = 'flex';
        this.scoreEl.innerText = '0';
        this.activeGame.init(this.ctx, this.canvas);
        this.activeGame.draw();
        this.playSound(440, 'square', 0.1);
    },
    startGame: function() {
        if (!this.activeGame) return;
        this.overlay.style.display = 'none';
        this.isPlaying = true;
        this.scoreEl.innerText = '0';
        this.activeGame.reset();
        this.gameLoop();
    },
    gameOver: function(finalScore) {
        this.isPlaying = false;
        this.overlay.style.display = 'flex';
        this.msgEl.innerHTML = `GAME OVER<br>SCORE: ${finalScore}`;
        this.playSound(150, 'sawtooth', 0.3);
    },
    returnToMenu: function() {
        this.stopGameLoop();
        this.isPlaying = false;
        this.activeGame = null;
        document.getElementById('game-screen').classList.remove('active-screen');
        document.getElementById('menu-screen').classList.add('active-screen');
    },
    stopGameLoop: function() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    },
    gameLoop: function() {
        if (!this.isPlaying) return;
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        const status = this.activeGame.update();
        this.activeGame.draw();
        this.scoreEl.innerText = this.activeGame.score;
        if (status === 'GAME_OVER') {
            this.gameOver(this.activeGame.score);
        } else {
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        }
    },
    handleInput: function(e) {
        if (this.isPlaying && this.activeGame) {
            if (e.code === 'Space') e.preventDefault();
            this.activeGame.input(e);
        }
    },
    playSound: function(freq, type, duration) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }
};
const games = {
    'snake': {
        name: "NEON SNAKE", instructions: "Arrows to Move. Eat green blocks. Don't hit walls or tail.",
        score: 0, grid: 20, snake: [], direction: 'RIGHT', nextDirection: 'RIGHT', food: {x:0,y:0}, timer: 0, speed: 5,
        init: function(ctx, canvas) { this.ctx = ctx; this.canvas = canvas; this.cols = canvas.width / this.grid; this.rows = canvas.height / this.grid; this.reset(); },
        reset: function() { this.snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}]; this.direction = 'RIGHT'; this.nextDirection = 'RIGHT'; this.score = 0; this.placeFood(); },
        placeFood: function() { this.food = {x:Math.floor(Math.random()*this.cols), y:Math.floor(Math.random()*this.rows)}; for(let p of this.snake) if(p.x === this.food.x && p.y === this.food.y) this.placeFood(); },
        input: function(e) { const k = e.key; if((k==='ArrowLeft'||k==='a')&&this.direction!=='RIGHT')this.nextDirection='LEFT'; if((k==='ArrowUp'||k==='w')&&this.direction!=='DOWN')this.nextDirection='UP'; if((k==='ArrowRight'||k==='d')&&this.direction!=='LEFT')this.nextDirection='RIGHT'; if((k==='ArrowDown'||k==='s')&&this.direction!=='UP')this.nextDirection='DOWN'; },
        update: function() { this.timer++; if(this.timer < 60/this.speed)return 'OK'; this.timer=0; this.direction=this.nextDirection; const h={...this.snake[0]}; if(this.direction==='LEFT')h.x--; if(this.direction==='UP')h.y--; if(this.direction==='RIGHT')h.x++; if(this.direction==='DOWN')h.y++; if(h.x<0||h.x>=this.cols||h.y<0||h.y>=this.rows)return 'GAME_OVER'; for(let p of this.snake)if(h.x===p.x&&h.y===p.y)return 'GAME_OVER'; this.snake.unshift(h); if(h.x===this.food.x&&h.y===this.food.y){this.score+=10;this.speed=Math.min(15,5+Math.floor(this.score/50));this.placeFood();}else this.snake.pop(); return 'OK'; },
        draw: function() { this.ctx.shadowBlur=15; this.ctx.shadowColor='#39ff14'; this.ctx.fillStyle='#39ff14'; this.ctx.fillRect(this.food.x*this.grid,this.food.y*this.grid,this.grid-2,this.grid-2); this.ctx.shadowBlur=10; this.ctx.shadowColor='#00ffff'; this.snake.forEach((p,i)=>{this.ctx.fillStyle=i===0?'#fff':'#00ffff';this.ctx.fillRect(p.x*this.grid,p.y*this.grid,this.grid-2,this.grid-2);}); this.ctx.shadowBlur=0; }
    },
    'shooter': {
        name: "CYBER SHOOTER", instructions: "Arrows to Move. Space to Shoot. Destroy enemies.",
        score: 0, player: {x:400,y:550,w:30,h:30}, bullets:[], enemies:[], enemyTimer:0, keys:{},
        init: function(ctx, canvas){this.ctx=ctx;this.canvas=canvas;this.reset();},
        reset: function(){this.score=0;this.player.x=this.canvas.width/2-15;this.bullets=[];this.enemies=[];this.keys={};},
        input: function(e){if(e.type==='keydown'){this.keys[e.key]=true;if(e.code==='Space')this.shoot();}if(e.type==='keyup')this.keys[e.key]=false;},
        shoot: function(){if(this.bullets.length<10)this.bullets.push({x:this.player.x+12,y:this.player.y,w:6,h:10});},
        update: function(){if(this.keys['ArrowLeft']&&this.player.x>0)this.player.x-=7;if(this.keys['ArrowRight']&&this.player.x<this.canvas.width-this.player.w)this.player.x+=7;this.bullets.forEach(b=>b.y-=10);this.bullets=this.bullets.filter(b=>b.y>-20);this.enemyTimer++;if(this.enemyTimer>40){this.enemyTimer=0;const s=30;this.enemies.push({x:Math.random()*(this.canvas.width-s),y:-s,w:s,h:s,speed:2+Math.random()*3});}for(let i=this.enemies.length-1;i>=0;i--){let e=this.enemies[i];e.y+=e.speed;for(let j=this.bullets.length-1;j>=0;j--){let b=this.bullets[j];if(b.x<e.x+e.w&&b.x+b.w>e.x&&b.y<e.y+e.h&&b.y+b.h>e.y){this.enemies.splice(i,1);this.bullets.splice(j,1);this.score+=100;break;}}if(e.y+e.h>this.player.y&&e.x<this.player.x+this.player.w&&e.x+e.w>this.player.x)return 'GAME_OVER';if(e.y>this.canvas.height)this.enemies.splice(i,1);}return 'OK';},
        draw: function(){this.ctx.shadowBlur=15;this.ctx.shadowColor='#ff00ff';this.ctx.fillStyle='#ff00ff';this.ctx.fillRect(this.player.x,this.player.y,this.player.w,this.player.h);this.ctx.shadowColor='#fff01f';this.ctx.fillStyle='#fff01f';this.bullets.forEach(b=>this.ctx.fillRect(b.x,b.y,b.w,b.h));this.ctx.shadowColor='#ff0000';this.ctx.fillStyle='#ff0000';this.enemies.forEach(e=>this.ctx.fillRect(e.x,e.y,e.w,e.h));this.ctx.shadowBlur=0;}
    },
    'runner': {
        name: "GRID RUNNER", instructions: "Space/Up to Jump. Avoid red pillars.",
        score: 0, player: {x:100,y:0,w:30,h:30,dy:0,grounded:true}, gravity:0.8, jumpPower:-15, obstacles:[], groundY:500, speed:6, frame:0,
        init: function(ctx, canvas){this.ctx=ctx;this.canvas=canvas;this.groundY=canvas.height-50;this.reset();},
        reset: function(){this.score=0;this.player.y=this.groundY-this.player.h;this.player.dy=0;this.obstacles=[];this.speed=6;this.frame=0;},
        input: function(e){if((e.code==='Space'||e.key==='ArrowUp')&&this.player.grounded){this.player.dy=this.jumpPower;this.player.grounded=false;}},
        update: function(){this.frame++;this.score++;this.player.dy+=this.gravity;this.player.y+=this.player.dy;if(this.player.y>this.groundY-this.player.h){this.player.y=this.groundY-this.player.h;this.player.dy=0;this.player.grounded=true;}if(this.frame%90===0||(Math.random()<0.01&&this.frame>100)){this.obstacles.push({x:this.canvas.width,y:this.groundY-40,w:30,h:40});this.speed+=0.1;}for(let i=this.obstacles.length-1;i>=0;i--){let o=this.obstacles[i];o.x-=this.speed;if(this.player.x<o.x+o.w&&this.player.x+this.player.w>o.x&&this.player.y<o.y+o.h&&this.player.y+this.player.h>o.y)return 'GAME_OVER';if(o.x+o.w<0)this.obstacles.splice(i,1);}return 'OK';},
        draw: function(){this.ctx.strokeStyle='#00ffff';this.ctx.lineWidth=2;this.ctx.beginPath();this.ctx.moveTo(0,this.groundY);this.ctx.lineTo(this.canvas.width,this.groundY);this.ctx.stroke();this.ctx.shadowBlur=10;this.ctx.shadowColor='#00ffff';this.ctx.fillStyle='#00ffff';this.ctx.fillRect(this.player.x,this.player.y,this.player.w,this.player.h);this.ctx.shadowColor='#ff0000';this.ctx.fillStyle='#ff0000';this.obstacles.forEach(o=>this.ctx.fillRect(o.x,o.y,o.w,o.h));this.ctx.shadowBlur=0;}
    },
    'dodger': {
        name: "VOID DODGER", instructions: "Arrows to move freely. Don't touch the debris.",
        score: 0, player: {x:400,y:300,r:10}, rocks:[], frame:0,
        init: function(ctx, canvas){this.ctx=ctx;this.canvas=canvas;this.reset();},
        reset: function(){this.score=0;this.player.x=this.canvas.width/2;this.player.y=this.canvas.height/2;this.rocks=[];this.frame=0;},
        input: function(e){const s=8;if(e.key==='ArrowUp')this.player.y-=s;if(e.key==='ArrowDown')this.player.y+=s;if(e.key==='ArrowLeft')this.player.x-=s;if(e.key==='ArrowRight')this.player.x+=s;this.player.x=Math.max(10,Math.min(this.canvas.width-10,this.player.x));this.player.y=Math.max(10,Math.min(this.canvas.height-10,this.player.y));},
        update: function(){this.frame++;if(this.frame%10===0)this.score++;if(this.frame%20===0){const side=Math.floor(Math.random()*4);let r=15+Math.random()*20;let x,y,dx,dy;const sp=3+(this.score/500);if(side===0){x=Math.random()*this.canvas.width;y=-r;dx=(Math.random()-0.5)*2;dy=sp;}else if(side===1){x=this.canvas.width+r;y=Math.random()*this.canvas.height;dx=-sp;dy=(Math.random()-0.5)*2;}else if(side===2){x=Math.random()*this.canvas.width;y=this.canvas.height+r;dx=(Math.random()-0.5)*2;dy=-sp;}else{x=-r;y=Math.random()*this.canvas.height;dx=sp;dy=(Math.random()-0.5)*2;}this.rocks.push({x,y,dx,dy,r});}for(let i=this.rocks.length-1;i>=0;i--){let rk=this.rocks[i];rk.x+=rk.dx;rk.y+=rk.dy;const dist=Math.hypot(this.player.x-rk.x,this.player.y-rk.y);if(dist<this.player.r+rk.r)return 'GAME_OVER';if(rk.x<-50||rk.x>this.canvas.width+50||rk.y<-50||rk.y>this.canvas.height+50)this.rocks.splice(i,1);}return 'OK';},
        draw: function(){this.ctx.shadowBlur=15;this.ctx.shadowColor='#fff';this.ctx.fillStyle='#fff';this.ctx.beginPath();this.ctx.arc(this.player.x,this.player.y,this.player.r,0,Math.PI*2);this.ctx.fill();this.ctx.shadowColor='#888';this.ctx.strokeStyle='#888';this.ctx.lineWidth=2;this.rocks.forEach(rk=>{this.ctx.beginPath();this.ctx.moveTo(rk.x,rk.y-rk.r);for(let i=0;i<6;i++){const a=(i*60*Math.PI)/180;const rad=rk.r*(0.8+Math.random()*0.4);const rx=rk.x+Math.cos(a)*rad;const ry=rk.y+Math.sin(a)*rad;this.ctx.lineTo(rx,ry);}this.ctx.closePath();this.ctx.stroke();});this.ctx.shadowBlur=0;}
    }
};
window.onload = function() { arcadeSystem.init(); };
