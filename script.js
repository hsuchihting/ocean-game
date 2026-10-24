
    /* ========================================================
       1. 生物資料百科數據 (7 大淺海物種)
       ======================================================== */
    const SPECIES_DB = {
      clownfish: {
        id: 'clownfish',
        name: '眼斑小丑魚',
        sciName: 'Amphiprion ocellaris',
        icon: '🐠',
        tag: '共生精靈',
        desc: '天生帶有特殊黏液保護層，能毫髮無傷地在劇毒海葵中穿梭築巢。當遇到危險時會迅速鑽入海葵觸手深處。',
        color: '#ff7b25',
        unlocked: false
      },
      bluetang: {
        id: 'bluetang',
        name: '藍倒吊 (多莉)',
        sciName: 'Paracanthurus hepatus',
        icon: '🐟',
        tag: '珊瑚礁常客',
        desc: '湛藍色的身軀搭配鮮黃色尾鰭。尾柄兩側具有鋒利骨質棘刺，喜歡大群巡游並啃食礁石上的藻類，保持珊瑚健康。',
        color: '#1a73e8',
        unlocked: false
      },
      turtle: {
        id: 'turtle',
        name: '綠蠵龜',
        sciName: 'Chelonia mydas',
        icon: '🐢',
        tag: '悠游長壽',
        desc: '優雅地在淺海中划動如同翅膀般的前鰭，主食為鮮嫩海草。牠們肺活量驚人，能在淺灘下安靜休息數小時。',
        color: '#2e7d32',
        unlocked: false
      },
      jellyfish: {
        id: 'jellyfish',
        name: '海月水母',
        sciName: 'Aurelia aurita',
        icon: '🪼',
        tag: '夜光漂流者',
        desc: '體內含水量超過 95%，傘部有規律地收縮推動水流。在黑夜中能發出幽藍色生物螢光，如水下精靈。',
        color: '#00f2fe',
        unlocked: false
      },
      giantclam: {
        id: 'giantclam',
        name: '大硨磲貝',
        sciName: 'Tridacna gigas',
        icon: '🦪',
        tag: '貝類之王',
        desc: '雙殼外套膜內共生著數以百萬計的蟲黃藻，在陽光下呈現璀璨的藍綠孔雀光澤。受驚擾時會輕輕合上厚重外殼。',
        color: '#e0c3fc',
        unlocked: false
      },
      hermitcrab: {
        id: 'hermitcrab',
        name: '紅斑寄居蟹',
        sciName: 'Dardanus megistos',
        icon: '🦀',
        tag: '沙灘漫步家',
        desc: '柔軟的腹部背負著撿來的海螺殼，在細白的淺海沙底緩緩爬行尋找有機碎屑。一被碰觸就會迅速縮回殼內探頭觀察。',
        color: '#ff5252',
        unlocked: false
      },
      whaleshark: {
        id: 'whaleshark',
        name: '巨大鯨鯊',
        sciName: 'Rhincodon typus',
        icon: '🐋',
        tag: '溫柔巨人',
        desc: '海洋中現存體型最大的魚類，性格溫順無比。雖然體型龐大，但只以浮游生物和小魚為食，是海洋健康的象徵。',
        color: '#4fc3f7',
        unlocked: false
      }
    };

    /* ========================================================
       2. Web Audio API：純原生程式合成自然水音與海浪
       ======================================================== */
    class SeaAudio {
      constructor() {
        this.ctx = null;
        this.isMuted = true;
        this.ambientGain = null;
      }

      init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // 建立主環境音 Gain
        this.ambientGain = this.ctx.createGain();
        this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.ambientGain.connect(this.ctx.destination);

        // 啟動白噪音合成輕柔海浪拍岸聲
        this.startOceanWave();
      }

      startOceanWave() {
        // 生成 3 秒的 Pink Noise 緩衝區
        const bufferSize = this.ctx.sampleRate * 3;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2) * 0.1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // 低通濾波器模擬水深沉悶與流動感
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.ctx.currentTime);

        // 使用 LFO 調變頻率，創造出規律的潮起潮落 (約每 7 秒一個呼吸週期)
        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.14, this.ctx.currentTime); // ~7秒週期
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        whiteNoise.connect(filter);
        filter.connect(this.ambientGain);

        whiteNoise.start();
        lfo.start();
      }

      toggle() {
        if (!this.ctx) this.init();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }

        this.isMuted = !this.isMuted;
        const now = this.ctx.currentTime;
        if (!this.isMuted) {
          this.ambientGain.gain.setTargetAtTime(0.25, now, 0.5);
        } else {
          this.ambientGain.gain.setTargetAtTime(0.0001, now, 0.3);
        }
        return !this.isMuted;
      }

      // 水滴 / 水花散開的高頻清脆聲
      playWaterPlink(pitch = 800) {
        if (this.isMuted || !this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const now = this.ctx.currentTime;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(pitch, now);
          osc.frequency.exponentialRampToValueAtTime(pitch * 1.8, now + 0.12);

          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.15);
        } catch (e) {}
      }

      // 氣泡破裂啾聲
      playBubblePop() {
        if (this.isMuted || !this.ctx) return;
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const now = this.ctx.currentTime;

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(450, now);
          osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

          gain.gain.setValueAtTime(0.15, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.1);
        } catch (e) {}
      }

      // 貝殼打開或新發現生物時的空靈叮咚聲
      playDiscoverChime() {
        if (this.isMuted || !this.ctx) return;
        try {
          const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C (五度純音)
          notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime + idx * 0.07;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.5);
          });
        } catch (e) {}
      }
    }

    const soundManager = new SeaAudio();

    /* ========================================================
       3. 畫布環境與動態系統 (Canvas Engine)
       ======================================================== */
    const canvas = document.getElementById('seaCanvas');
    const ctx = canvas.getContext('2d');

    let width = 0;
    let height = 0;
    let dpr = 1;
    let timeMode = 'noon'; // noon, sunset, night
    let interactMode = 'inspect'; // inspect, feed

    // 環境色調配置
    const THEMES = {
      noon: {
        name: '正午陽光',
        waterTop: '#0ed2f7',
        waterBottom: '#006699',
        sandLight: '#fef9e7',
        sandDark: '#e3cf96',
        causticAlpha: 0.18,
        causticColor: '255, 255, 255',
        godRaysAlpha: 0.12,
        ambientGlow: 'rgba(255, 255, 255, 0.1)'
      },
      sunset: {
        name: '黃昏金暈',
        waterTop: '#ff7e5f',
        waterBottom: '#2b5876',
        sandLight: '#ffe5b4',
        sandDark: '#b36d38',
        causticAlpha: 0.22,
        causticColor: '255, 215, 120',
        godRaysAlpha: 0.18,
        ambientGlow: 'rgba(255, 180, 80, 0.15)'
      },
      night: {
        name: '靜謐夜光',
        waterTop: '#091c32',
        waterBottom: '#020b14',
        sandLight: '#18314f',
        sandDark: '#0e1d2f',
        causticAlpha: 0.08,
        causticColor: '0, 242, 254',
        godRaysAlpha: 0.04,
        ambientGlow: 'rgba(0, 240, 255, 0.25)'
      }
    };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }
    window.addEventListener('resize', resize);
    resize();

    /* ========================================================
       4. 實體定義：水波紋、氣泡、海草、珊瑚、飼料
       ======================================================== */
    const ripples = [];
    const bubbles = [];
    const seaweeds = [];
    const foodPellets = [];
    const ambientParticles = [];

    // 水面擴散波紋
    class WaterRipple {
      constructor(x, y, strength = 1.0) {
        this.x = x;
        this.y = y;
        this.radius = 2;
        this.maxRadius = 80 + strength * 70;
        this.alpha = 0.85;
        this.speed = 2.5 + strength * 1.5;
        this.strength = strength;
      }
      update() {
        this.radius += this.speed;
        this.alpha = Math.max(0, (1 - this.radius / this.maxRadius) * 0.8);
      }
      draw(c) {
        if (this.alpha <= 0) return;
        c.save();
        c.lineWidth = Math.max(1, 3.5 * (1 - this.radius / this.maxRadius));
        c.strokeStyle = timeMode === 'night' 
          ? `rgba(0, 242, 254, ${this.alpha * 0.9})` 
          : `rgba(255, 255, 255, ${this.alpha})`;
        
        // 雙環同心圓漣漪
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.stroke();

        if (this.radius > 15) {
          c.beginPath();
          c.lineWidth = Math.max(0.5, 1.5 * (1 - this.radius / this.maxRadius));
          c.arc(this.x, this.y, this.radius * 0.65, 0, Math.PI * 2);
          c.stroke();
        }
        c.restore();
      }
    }

    // 氣泡系統
    class Bubble {
      constructor(x, y, r, speed) {
        this.x = x;
        this.y = y;
        this.radius = r || (Math.random() * 4 + 2);
        this.speed = speed || (Math.random() * 1.5 + 0.8);
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
        this.alpha = Math.random() * 0.4 + 0.4;
      }
      update() {
        this.y -= this.speed;
        this.wobble += this.wobbleSpeed;
        this.x += Math.sin(this.wobble) * 0.4;
      }
      draw(c) {
        c.save();
        c.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.25})`;
        c.strokeStyle = `rgba(255, 255, 255, ${this.alpha * 0.8})`;
        c.lineWidth = 1;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        
        // 氣泡內部高光小點
        c.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.9})`;
        c.beginPath();
        c.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.25, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // 搖曳海草
    class Seaweed {
      constructor(x, y, segments = 6, height = 120) {
        this.x = x;
        this.baseY = y;
        this.segments = segments;
        this.height = height;
        this.offset = Math.random() * 100;
        this.width = Math.random() * 8 + 10;
        this.color = Math.random() > 0.5 ? '#2d6a4f' : '#40916c';
      }
      draw(c, time) {
        c.save();
        c.beginPath();
        let curX = this.x;
        let curY = this.baseY;
        c.moveTo(curX, curY);

        const segLen = this.height / this.segments;
        for (let i = 1; i <= this.segments; i++) {
          const wave = Math.sin(time * 0.002 + this.offset + i * 0.4) * (i * 3.5);
          const nextY = this.baseY - i * segLen;
          const nextX = this.x + wave;
          c.quadraticCurveTo(curX, curY - segLen * 0.5, nextX, nextY);
          curX = nextX;
          curY = nextY;
        }

        c.lineWidth = this.width;
        c.lineCap = 'round';
        c.strokeStyle = timeMode === 'night' ? '#1b4332' : this.color;
        c.stroke();
        c.restore();
      }
    }

    // 投擲之飼料碎片
    class FoodPellet {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vy = Math.random() * 0.8 + 0.4;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.radius = Math.random() * 2 + 2;
        this.color = '#f59e0b';
        this.life = 600; // 約10秒自動消散
      }
      update() {
        this.y += this.vy;
        this.x += this.vx;
        this.vy *= 0.99;
        this.vx *= 0.98;
        this.life--;
      }
      draw(c) {
        c.save();
        c.fillStyle = this.color;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    // 浮游微粒
    for (let i = 0; i < 40; i++) {
      ambientParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2
      });
    }

    // 初始化海底景觀植物
    function initSeafloor() {
      seaweeds.length = 0;
      const count = Math.floor(width / 75) + 6;
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width;
        const y = height + 10;
        const h = Math.random() * 100 + 100;
        seaweeds.push(new Seaweed(x, y, 6, h));
      }
    }
    initSeafloor();
    window.addEventListener('resize', initSeafloor);

    /* ========================================================
       5. 淺海生物族群邏輯 (Fish, Turtle, Jellyfish, Clam, Crab)
       ======================================================== */
    const fishes = [];
    const staticCreatures = [];
    let whaleSharkInstance = null;

    // 基礎可動生物抽象類
    class Swimmer {
      constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.angle = 0;
        this.targetAngle = 0;
        this.size = 20;
        this.scaredTimer = 0;
      }
      scare(sourceX, sourceY) {
        const dx = this.x - sourceX;
        const dy = this.y - sourceY;
        const dist = Math.hypot(dx, dy) || 1;
        this.vx = (dx / dist) * 7.5;
        this.vy = (dy / dist) * 7.5;
        this.scaredTimer = 60;
      }
    }

    // 熱帶小魚 (小丑魚、藍倒吊)
    class SchoolFish extends Swimmer {
      constructor(x, y, subType = 'clownfish') {
        super(x, y, subType);
        this.subType = subType; // clownfish or bluetang
        this.size = subType === 'clownfish' ? 18 : 22;
        this.maxSpeed = subType === 'clownfish' ? 2.2 : 2.8;
        this.tailAngle = 0;
        this.tailSpeed = 0.2;
      }

      update() {
        this.tailAngle += this.tailSpeed;

        // 若有飼料，被最近飼料吸引
        let attractedToFood = false;
        if (foodPellets.length > 0) {
          let closest = null;
          let minDist = 220;
          for (let p of foodPellets) {
            const d = Math.hypot(this.x - p.x, this.y - p.y);
            if (d < minDist) {
              minDist = d;
              closest = p;
            }
          }
          if (closest) {
            const angle = Math.atan2(closest.y - this.y, closest.x - this.x);
            this.vx += Math.cos(angle) * 0.15;
            this.vy += Math.sin(angle) * 0.15;
            attractedToFood = true;

            // 吞食飼料
            if (minDist < 12) {
              const idx = foodPellets.indexOf(closest);
              if (idx !== -1) {
                foodPellets.splice(idx, 1);
                // 產生小飽足氣泡
                spawnBubbles(this.x, this.y, 3);
                soundManager.playWaterPlink(1100);
              }
            }
          }
        }

        // 自然巡遊慣性
        if (!attractedToFood && this.scaredTimer <= 0) {
          if (Math.random() < 0.02) {
            this.vx += (Math.random() - 0.5) * 0.8;
            this.vy += (Math.random() - 0.5) * 0.6;
          }
        }

        if (this.scaredTimer > 0) {
          this.scaredTimer--;
          this.tailSpeed = 0.45;
        } else {
          this.tailSpeed = 0.18;
        }

        // 速度上限
        const curSpeed = Math.hypot(this.vx, this.vy);
        const limit = this.scaredTimer > 0 ? this.maxSpeed * 2.5 : this.maxSpeed;
        if (curSpeed > limit) {
          this.vx = (this.vx / curSpeed) * limit;
          this.vy = (this.vy / curSpeed) * limit;
        }

        this.x += this.vx;
        this.y += this.vy;

        // 螢幕邊界自然反彈
        const margin = 40;
        if (this.x < margin) this.vx += 0.2;
        if (this.x > width - margin) this.vx -= 0.2;
        if (this.y < margin) this.vy += 0.2;
        if (this.y > height - margin) this.vy -= 0.2;

        this.targetAngle = Math.atan2(this.vy, this.vx);
        // 平滑轉向
        let diff = this.targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * 0.12;
      }

      draw(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle);

        const tailWiggle = Math.sin(this.tailAngle) * 0.35;

        if (this.subType === 'clownfish') {
          // 小丑魚繪製 (鮮橙色 + 白色條紋)
          c.fillStyle = '#ff7315';
          c.beginPath();
          c.ellipse(0, 0, this.size, this.size * 0.55, 0, 0, Math.PI * 2);
          c.fill();

          // 白條紋
          c.fillStyle = '#ffffff';
          c.beginPath();
          c.rect(-this.size * 0.2, -this.size * 0.5, this.size * 0.22, this.size);
          c.fill();

          c.beginPath();
          c.rect(this.size * 0.25, -this.size * 0.42, this.size * 0.18, this.size * 0.84);
          c.fill();

          // 擺動尾鰭
          c.save();
          c.translate(-this.size * 0.85, 0);
          c.rotate(tailWiggle);
          c.fillStyle = '#ff7315';
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(-this.size * 0.6, -this.size * 0.45);
          c.lineTo(-this.size * 0.45, 0);
          c.lineTo(-this.size * 0.6, this.size * 0.45);
          c.closePath();
          c.fill();
          c.restore();

          // 眼睛
          c.fillStyle = '#000';
          c.beginPath();
          c.arc(this.size * 0.6, -this.size * 0.18, 2.2, 0, Math.PI * 2);
          c.fill();
        } else {
          // 藍倒吊繪製 (皇家藍 + 亮黃尾)
          c.fillStyle = '#1e6091';
          c.beginPath();
          c.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
          c.fill();

          // 黑色背部紋路
          c.fillStyle = '#101e33';
          c.beginPath();
          c.ellipse(-this.size * 0.1, -this.size * 0.2, this.size * 0.6, this.size * 0.25, 0, 0, Math.PI * 2);
          c.fill();

          // 亮黃色三角尾鰭
          c.save();
          c.translate(-this.size * 0.8, 0);
          c.rotate(tailWiggle);
          c.fillStyle = '#f9c74f';
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(-this.size * 0.65, -this.size * 0.5);
          c.lineTo(-this.size * 0.4, 0);
          c.lineTo(-this.size * 0.65, this.size * 0.5);
          c.closePath();
          c.fill();
          c.restore();

          // 眼睛
          c.fillStyle = '#f9c74f';
          c.beginPath();
          c.arc(this.size * 0.6, -this.size * 0.15, 3.2, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#000';
          c.beginPath();
          c.arc(this.size * 0.62, -this.size * 0.15, 1.8, 0, Math.PI * 2);
          c.fill();
        }

        // 夜光生物自發光光斑
        if (timeMode === 'night') {
          c.shadowBlur = 12;
          c.shadowColor = this.subType === 'clownfish' ? '#ff9900' : '#00b4d8';
          c.strokeStyle = 'rgba(255,255,255,0.4)';
          c.lineWidth = 1;
          c.stroke();
        }

        c.restore();
      }
    }

    // 綠蠵龜
    class SeaTurtle extends Swimmer {
      constructor(x, y) {
        super(x, y, 'turtle');
        this.size = 46;
        this.flipperAngle = 0;
        this.maxSpeed = 1.6;
      }

      update() {
        this.flipperAngle += 0.05;

        // 溫和緩慢前進
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.08;

        const spd = Math.hypot(this.vx, this.vy);
        const limit = this.scaredTimer > 0 ? 3.5 : this.maxSpeed;
        if (spd > limit) {
          this.vx = (this.vx / spd) * limit;
          this.vy = (this.vy / spd) * limit;
        }

        if (this.scaredTimer > 0) this.scaredTimer--;

        this.x += this.vx;
        this.y += this.vy;

        // 轉向
        this.targetAngle = Math.atan2(this.vy, this.vx);
        let diff = this.targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * 0.04;

        // 邊界回頭
        const pad = 80;
        if (this.x < pad) this.vx += 0.1;
        if (this.x > width - pad) this.vx -= 0.1;
        if (this.y < pad) this.vy += 0.1;
        if (this.y > height - pad) this.vy -= 0.1;
      }

      draw(c) {
        c.save();
        c.translate(this.x, this.y);
        c.rotate(this.angle + Math.PI / 2); // 龜首向前

        const flipperWave = Math.sin(this.flipperAngle) * 0.35;

        // 前雙大胸鰭 (如同翅膀般划動)
        c.fillStyle = '#2d6a4f';
        // 左鰭
        c.save();
        c.translate(-this.size * 0.45, -this.size * 0.15);
        c.rotate(-0.8 + flipperWave);
        c.beginPath();
        c.ellipse(0, -this.size * 0.45, this.size * 0.2, this.size * 0.55, 0.4, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // 右鰭
        c.save();
        c.translate(this.size * 0.45, -this.size * 0.15);
        c.rotate(0.8 - flipperWave);
        c.beginPath();
        c.ellipse(0, -this.size * 0.45, this.size * 0.2, this.size * 0.55, -0.4, 0, Math.PI * 2);
        c.fill();
        c.restore();

        // 後雙小腿鰭
        c.fillStyle = '#1b4332';
        c.beginPath();
        c.ellipse(-this.size * 0.3, this.size * 0.5, this.size * 0.12, this.size * 0.25, -0.3, 0, Math.PI * 2);
        c.ellipse(this.size * 0.3, this.size * 0.5, this.size * 0.12, this.size * 0.25, 0.3, 0, Math.PI * 2);
        c.fill();

        // 圓滑橢圓龜殼
        c.fillStyle = '#40916c';
        c.beginPath();
        c.ellipse(0, 0, this.size * 0.5, this.size * 0.65, 0, 0, Math.PI * 2);
        c.fill();

        // 龜殼盾板幾何花紋
        c.strokeStyle = '#1b4332';
        c.lineWidth = 2.5;
        c.stroke();
        c.beginPath();
        c.arc(0, 0, this.size * 0.25, 0, Math.PI * 2);
        c.stroke();

        // 圓圓的龜頭
        c.fillStyle = '#52b788';
        c.beginPath();
        c.ellipse(0, -this.size * 0.72, this.size * 0.22, this.size * 0.28, 0, 0, Math.PI * 2);
        c.fill();

        // 黑小眼
        c.fillStyle = '#081c15';
        c.beginPath();
        c.arc(-this.size * 0.12, -this.size * 0.8, 2, 0, Math.PI * 2);
        c.arc(this.size * 0.12, -this.size * 0.8, 2, 0, Math.PI * 2);
        c.fill();

        if (timeMode === 'night') {
          c.shadowBlur = 16;
          c.shadowColor = '#52b788';
          c.stroke();
        }

        c.restore();
      }
    }

    // 漂浮水母
    class Jellyfish extends Swimmer {
      constructor(x, y) {
        super(x, y, 'jellyfish');
        this.size = 28;
        this.pulse = 0;
        this.pulseSpeed = 0.04;
      }
      update() {
        this.pulse += this.pulseSpeed;
        const contraction = Math.sin(this.pulse);

        // 脈衝推進向上浮動
        if (contraction > 0.7) {
          this.vy -= 0.08;
        } else {
          this.vy += 0.02;
        }

        this.vx += (Math.random() - 0.5) * 0.05;
        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.98;
        this.vy *= 0.97;

        // 循環穿透螢幕上下
        if (this.y < -40) this.y = height + 30;
        if (this.y > height + 40) this.y = -30;
        if (this.x < 30) this.vx += 0.1;
        if (this.x > width - 30) this.vx -= 0.1;
      }

      draw(c) {
        c.save();
        c.translate(this.x, this.y);
        const squeeze = Math.sin(this.pulse) * 0.2;

        const isNight = timeMode === 'night';
        const bellGrad = c.createRadialGradient(0, 0, 2, 0, 0, this.size);
        if (isNight) {
          bellGrad.addColorStop(0, 'rgba(0, 255, 230, 0.85)');
          bellGrad.addColorStop(0.7, 'rgba(0, 160, 255, 0.4)');
          bellGrad.addColorStop(1, 'rgba(180, 0, 255, 0.1)');
          c.shadowBlur = 18;
          c.shadowColor = '#00f2fe';
        } else {
          bellGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
          bellGrad.addColorStop(0.8, 'rgba(180, 240, 255, 0.35)');
          bellGrad.addColorStop(1, 'rgba(100, 200, 255, 0.15)');
        }

        // 半球傘帽
        c.fillStyle = bellGrad;
        c.beginPath();
        c.ellipse(0, 0, this.size * (1 - squeeze), this.size * (0.8 + squeeze), 0, Math.PI, Math.PI * 2);
        c.closePath();
        c.fill();

        // 飄動觸鬚
        c.strokeStyle = isNight ? 'rgba(0, 242, 254, 0.6)' : 'rgba(255, 255, 255, 0.4)';
        c.lineWidth = 1.5;
        for (let i = -2; i <= 2; i++) {
          c.beginPath();
          const startX = i * (this.size * 0.28);
          c.moveTo(startX, 0);
          const tWave = Math.sin(this.pulse * 1.5 + i) * 6;
          c.quadraticCurveTo(startX + tWave, this.size * 0.8, startX - tWave, this.size * 1.6);
          c.stroke();
        }
        c.restore();
      }
    }

    // 底棲：開合大硨磲貝 (附珍珠)
    class GiantClam {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = 'giantclam';
        this.size = 36;
        this.isOpen = false;
        this.openProgress = 0; // 0 closed, 1 open
      }
      toggle() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
          soundManager.playDiscoverChime();
          spawnBubbles(this.x, this.y - 15, 6);
        } else {
          soundManager.playWaterPlink(600);
        }
      }
      update() {
        if (this.isOpen && this.openProgress < 1) {
          this.openProgress = Math.min(1, this.openProgress + 0.08);
        } else if (!this.isOpen && this.openProgress > 0) {
          this.openProgress = Math.max(0, this.openProgress - 0.1);
        }
      }
      draw(c) {
        c.save();
        c.translate(this.x, this.y);

        // 下貝殼底座
        c.fillStyle = '#d8d0c5';
        c.beginPath();
        c.ellipse(0, 4, this.size, this.size * 0.45, 0, 0, Math.PI);
        c.fill();

        // 內部孔雀色或螢光肉褶
        c.fillStyle = timeMode === 'night' ? '#00e5ff' : '#00b4d8';
        if (timeMode === 'night') {
          c.shadowBlur = 14;
          c.shadowColor = '#00f2fe';
        }
        c.beginPath();
        c.ellipse(0, 0, this.size * 0.85, (this.size * 0.3) * (0.3 + this.openProgress * 0.7), 0, 0, Math.PI * 2);
        c.fill();

        // 閃爍珍珠 (打開時展現)
        if (this.openProgress > 0.2) {
          const pearlScale = this.openProgress;
          c.fillStyle = '#ffffff';
          c.shadowBlur = 15;
          c.shadowColor = '#ffd700';
          c.beginPath();
          c.arc(0, -2 * pearlScale, 7 * pearlScale, 0, Math.PI * 2);
          c.fill();
        }

        // 上貝殼 (波浪扇形貝紋)
        c.shadowBlur = 0;
        c.fillStyle = '#ece5d8';
        c.strokeStyle = '#a89f91';
        c.lineWidth = 2;
        const liftY = -this.openProgress * 22;
        c.save();
        c.translate(0, liftY);
        c.beginPath();
        c.arc(0, 0, this.size, Math.PI, Math.PI * 2);
        c.closePath();
        c.fill();
        c.stroke();
        c.restore();

        c.restore();
      }
    }

    // 底棲：寄居蟹
    class HermitCrab {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = 'hermitcrab';
        this.size = 22;
        this.isHiding = false;
        this.hideTimer = 0;
        this.walkCycle = 0;
        this.speedX = 0.5;
      }
      scare() {
        this.isHiding = true;
        this.hideTimer = 180; // 隱藏3秒
        spawnBubbles(this.x, this.y, 4);
        soundManager.playBubblePop();
      }
      update() {
        if (this.hideTimer > 0) {
          this.hideTimer--;
          if (this.hideTimer <= 0) this.isHiding = false;
        } else {
          // 橫向在海底漫步
          this.x += this.speedX;
          this.walkCycle += 0.15;
          if (this.x < 50 || this.x > width - 50) {
            this.speedX *= -1;
          }
        }
      }
      draw(c) {
        c.save();
        c.translate(this.x, this.y);

        // 如果未縮殼，畫出紅紅小鉗與小眼睛
        if (!this.isHiding) {
          const legWave = Math.sin(this.walkCycle) * 3;
          c.fillStyle = '#e63946';

          // 爬行小腿
          c.fillRect(-this.size * 0.7, this.size * 0.1 + legWave, 6, 8);
          c.fillRect(-this.size * 0.3, this.size * 0.2 - legWave, 6, 8);
          c.fillRect(this.size * 0.2, this.size * 0.1 + legWave, 6, 8);

          // 探出之大螯爪
          c.beginPath();
          c.ellipse(this.speedX > 0 ? this.size * 0.6 : -this.size * 0.6, 0, 7, 5, 0, 0, Math.PI * 2);
          c.fill();

          // 靈動黑眼梗
          c.fillStyle = '#000';
          const eyeOff = this.speedX > 0 ? this.size * 0.4 : -this.size * 0.4;
          c.fillRect(eyeOff - 2, -10, 2, 6);
          c.fillRect(eyeOff + 3, -10, 2, 6);
        }

        // 螺殼
        c.fillStyle = '#d4a373';
        c.strokeStyle = '#bc6c25';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, -2, this.size * 0.75, this.size * 0.55, -0.2, 0, Math.PI * 2);
        c.fill();
        c.stroke();

        // 螺紋線圈
        c.beginPath();
        c.arc(-this.size * 0.2, -4, 5, 0, Math.PI * 1.5);
        c.stroke();

        c.restore();
      }
    }

    // 彩蛋巨獸：巡遊鯨鯊
    class WhaleShark {
      constructor() {
        this.type = 'whaleshark';
        this.x = -300;
        this.y = height * 0.45;
        this.vx = 1.3;
        this.size = 130;
        this.tailAngle = 0;
      }
      update() {
        this.x += this.vx;
        this.tailAngle += 0.04;
      }
      draw(c) {
        c.save();
        c.translate(this.x, this.y);
        const wave = Math.sin(this.tailAngle) * 0.2;

        // 鯨鯊巨大身軀 (寬廣平頭)
        c.fillStyle = '#2b4162';
        c.beginPath();
        c.ellipse(0, 0, this.size, this.size * 0.38, 0, 0, Math.PI * 2);
        c.fill();

        // 大寬嘴
        c.fillStyle = '#1e293b';
        c.fillRect(this.size * 0.75, -this.size * 0.15, this.size * 0.2, this.size * 0.3);

        // 巨大的左右胸鰭
        c.fillStyle = '#1e2b3e';
        c.beginPath();
        c.ellipse(this.size * 0.1, -this.size * 0.48, this.size * 0.2, this.size * 0.45, 0.4, 0, Math.PI * 2);
        c.ellipse(this.size * 0.1, this.size * 0.48, this.size * 0.2, this.size * 0.45, -0.4, 0, Math.PI * 2);
        c.fill();

        // 標誌性棋盤白點斑紋 (Polka dots)
        c.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let r = -3; r <= 3; r++) {
          for (let col = -3; col <= 2; col++) {
            c.beginPath();
            c.arc(col * 22, r * 10, 2.5, 0, Math.PI * 2);
            c.fill();
          }
        }

        // 大擺幅尾鰭
        c.save();
        c.translate(-this.size * 0.9, 0);
        c.rotate(wave);
        c.fillStyle = '#1e2b3e';
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(-this.size * 0.4, -this.size * 0.45);
        c.lineTo(-this.size * 0.25, 0);
        c.lineTo(-this.size * 0.4, this.size * 0.45);
        c.closePath();
        c.fill();
        c.restore();

        c.restore();
      }
    }

    // 產生氣泡群
    function spawnBubbles(x, y, count = 5) {
      for (let i = 0; i < count; i++) {
        bubbles.push(new Bubble(
          x + (Math.random() - 0.5) * 20,
          y + (Math.random() - 0.5) * 20,
          Math.random() * 3.5 + 2,
          Math.random() * 2 + 1
        ));
      }
    }

    // 建立初始生物生態群
    function seedEcosystem() {
      fishes.length = 0;
      staticCreatures.length = 0;

      // 魚群生成
      for (let i = 0; i < 7; i++) {
        fishes.push(new SchoolFish(Math.random() * width, Math.random() * height * 0.6 + 50, 'clownfish'));
      }
      for (let i = 0; i < 5; i++) {
        fishes.push(new SchoolFish(Math.random() * width, Math.random() * height * 0.6 + 80, 'bluetang'));
      }

      // 海龜
      fishes.push(new SeaTurtle(width * 0.3, height * 0.4));
      
      // 水母
      for (let i = 0; i < 4; i++) {
        fishes.push(new Jellyfish(Math.random() * width, Math.random() * height * 0.7 + 60));
      }

      // 底棲大硨磲貝 (配置在海底沙灘或珊瑚礁上)
      staticCreatures.push(new GiantClam(width * 0.75, height - 55));
      staticCreatures.push(new GiantClam(width * 0.2, height - 70));

      // 寄居蟹
      staticCreatures.push(new HermitCrab(width * 0.5, height - 30));
    }
    seedEcosystem();

    /* ========================================================
       6. 渲染引擎核心循環 (Render Loop & Caustics Shaders)
       ======================================================== */
    let lastTime = 0;

    function render(timestamp) {
      const theme = THEMES[timeMode];

      // 1. 水體背景清澈漸層
      const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
      waterGrad.addColorStop(0, theme.waterTop);
      waterGrad.addColorStop(1, theme.waterBottom);
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. 白沙灘底床 (柔和山丘曲線)
      ctx.save();
      const sandGrad = ctx.createLinearGradient(0, height - 120, 0, height);
      sandGrad.addColorStop(0, theme.sandLight);
      sandGrad.addColorStop(1, theme.sandDark);
      ctx.fillStyle = sandGrad;
      ctx.beginPath();
      ctx.moveTo(0, height - 80);
      ctx.quadraticCurveTo(width * 0.25, height - 120, width * 0.5, height - 75);
      ctx.quadraticCurveTo(width * 0.75, height - 40, width, height - 85);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 3. 水面焦散光影 (Water Caustics) 與陽光透射
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(${theme.causticColor}, ${theme.causticAlpha})`;
      
      // 疊加正弦光波網格
      const t = timestamp * 0.0015;
      const step = 45;
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          const w1 = Math.sin(x * 0.02 + t + y * 0.015);
          const w2 = Math.cos(y * 0.02 - t + x * 0.012);
          const intensity = Math.pow((w1 + w2) * 0.5, 2);
          if (intensity > 0.45) {
            ctx.beginPath();
            ctx.arc(x + w1 * 10, y + w2 * 10, 14 * intensity, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 陽光照射柱 (God Rays)
      if (theme.godRaysAlpha > 0) {
        const rayGrad = ctx.createLinearGradient(width * 0.3, 0, width * 0.6, height);
        rayGrad.addColorStop(0, `rgba(255, 255, 255, ${theme.godRaysAlpha * 1.5})`);
        rayGrad.addColorStop(0.5, `rgba(255, 255, 255, ${theme.godRaysAlpha * 0.6})`);
        rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = rayGrad;
        
        ctx.beginPath();
        ctx.moveTo(width * 0.1, 0);
        ctx.lineTo(width * 0.35, 0);
        ctx.lineTo(width * 0.75, height);
        ctx.lineTo(width * 0.4, height);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(width * 0.55, 0);
        ctx.lineTo(width * 0.75, 0);
        ctx.lineTo(width * 0.98, height);
        ctx.lineTo(width * 0.7, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // 4. 海底植物 (海草擺動)
      for (let s of seaweeds) {
        s.draw(ctx, timestamp);
      }

      // 5. 底棲固著生物 (大硨磲貝、寄居蟹)
      for (let sc of staticCreatures) {
        sc.update();
        sc.draw(ctx);
      }

      // 6. 投擲之飼料顆粒
      for (let i = foodPellets.length - 1; i >= 0; i--) {
        const p = foodPellets[i];
        p.update();
        p.draw(ctx);
        if (p.life <= 0 || p.y > height) {
          foodPellets.splice(i, 1);
        }
      }

      // 7. 巡游生物群 (小丑魚、藍倒吊、海龜、水母)
      for (let f of fishes) {
        f.update();
        f.draw(ctx);
      }

      // 8. 鯨鯊彩蛋更新與繪製
      if (whaleSharkInstance) {
        whaleSharkInstance.update();
        whaleSharkInstance.draw(ctx);
        if (whaleSharkInstance.x > width + 400) {
          whaleSharkInstance = null; // 游出螢幕
        }
      }

      // 9. 浮游微粒
      ctx.save();
      ctx.fillStyle = timeMode === 'night' ? 'rgba(0, 255, 200, 0.6)' : 'rgba(255, 255, 255, 0.45)';
      for (let p of ambientParticles) {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 10. 氣泡升騰更新
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.update();
        b.draw(ctx);
        if (b.y < -10) {
          bubbles.splice(i, 1);
        }
      }

      // 11. 水面點擊同心圓漣漪 (折射高光)
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.update();
        r.draw(ctx);
        if (r.alpha <= 0.01) {
          ripples.splice(i, 1);
        }
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    /* ========================================================
       7. 點擊與觸控互動機制 (Hit Detection & Modals)
       ======================================================== */
    function unlockSpecies(id) {
      if (SPECIES_DB[id] && !SPECIES_DB[id].unlocked) {
        SPECIES_DB[id].unlocked = true;
        soundManager.playDiscoverChime();
        showToast(`🎉 發現新物種：【${SPECIES_DB[id].name}】已收錄至圖鑑！`);
        updateJournalUI();
      }
    }

    function showCreatureCard(speciesId) {
      const data = SPECIES_DB[speciesId];
      if (!data) return;

      unlockSpecies(speciesId);

      document.getElementById('cardIcon').innerText = data.icon;
      document.getElementById('cardName').innerText = data.name;
      document.getElementById('cardTag').innerText = data.tag;
      document.getElementById('cardSciName').innerText = data.sciName;
      document.getElementById('cardDesc').innerText = data.desc;

      const card = document.getElementById('creatureCard');
      card.classList.remove('opacity-0', 'pointer-events-none', 'scale-95');
      card.classList.add('opacity-100', 'scale-100');
    }

    function hideCreatureCard() {
      const card = document.getElementById('creatureCard');
      card.classList.add('opacity-0', 'pointer-events-none', 'scale-95');
      card.classList.remove('opacity-100', 'scale-100');
    }

    document.getElementById('closeCardBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      hideCreatureCard();
    });

    // 點擊判定處理
    function handleInteract(clientX, clientY) {
      // 激起水波紋與音效
      ripples.push(new WaterRipple(clientX, clientY, 1.2));
      soundManager.playWaterPlink(650 + Math.random() * 200);

      // 如果處於「撒飼料」模式
      if (interactMode === 'feed') {
        for (let i = 0; i < 4; i++) {
          foodPellets.push(new FoodPellet(
            clientX + (Math.random() - 0.5) * 20,
            clientY + (Math.random() - 0.5) * 20
          ));
        }
        spawnBubbles(clientX, clientY, 3);
        return;
      }

      // 如果處於「觀察」模式：進行命中檢測
      let hit = false;

      // 檢查底棲生物
      for (let sc of staticCreatures) {
        const d = Math.hypot(clientX - sc.x, clientY - sc.y);
        if (d < sc.size + 15) {
          hit = true;
          if (sc.type === 'giantclam') {
            sc.toggle();
            showCreatureCard('giantclam');
          } else if (sc.type === 'hermitcrab') {
            sc.scare();
            showCreatureCard('hermitcrab');
          }
          break;
        }
      }

      // 檢查游動生物
      if (!hit) {
        for (let f of fishes) {
          const d = Math.hypot(clientX - f.x, clientY - f.y);
          if (d < f.size + 20) {
            hit = true;
            f.scare(clientX, clientY);
            spawnBubbles(f.x, f.y, 4);

            if (f.type === 'turtle') {
              showCreatureCard('turtle');
            } else if (f.type === 'jellyfish') {
              showCreatureCard('jellyfish');
            } else if (f.subType === 'clownfish') {
              showCreatureCard('clownfish');
            } else if (f.subType === 'bluetang') {
              showCreatureCard('bluetang');
            }
            break;
          }
        }
      }

      // 點擊鯨鯊
      if (!hit && whaleSharkInstance) {
        const d = Math.hypot(clientX - whaleSharkInstance.x, clientY - whaleSharkInstance.y);
        if (d < whaleSharkInstance.size + 30) {
          hit = true;
          showCreatureCard('whaleshark');
          spawnBubbles(clientX, clientY, 8);
        }
      }

      // 若沒點到任何生物，純粹撥動海水產生氣泡
      if (!hit) {
        spawnBubbles(clientX, clientY, 2);
      }
    }

    // 事件監聽 (支援滑鼠與觸控)
    canvas.addEventListener('pointerdown', (e) => {
      handleInteract(e.clientX, e.clientY);
    });

    // 滑鼠按住拖曳可撥動海水
    let isDragging = false;
    canvas.addEventListener('mousedown', () => isDragging = true);
    window.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mousemove', (e) => {
      if (isDragging && Math.random() < 0.25) {
        ripples.push(new WaterRipple(e.clientX, e.clientY, 0.4));
      }
    });

    // 觸控滑動支援
    canvas.addEventListener('touchmove', (e) => {
      if (Math.random() < 0.3) {
        const t = e.touches[0];
        ripples.push(new WaterRipple(t.clientX, t.clientY, 0.5));
      }
    }, { passive: true });

    /* ========================================================
       8. 工具列與時空切換系統
       ======================================================== */
    // 觀察 vs 餵食切換
    const modeInspectBtn = document.getElementById('modeInspectBtn');
    const modeFeedBtn = document.getElementById('modeFeedBtn');

    modeInspectBtn.addEventListener('click', () => {
      interactMode = 'inspect';
      modeInspectBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 text-white bg-white/30 shadow-sm';
      modeFeedBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 text-white/70 hover:text-white';
      showToast('已切換為【互動觀察模式】：點擊生物探索百科');
    });

    modeFeedBtn.addEventListener('click', () => {
      interactMode = 'feed';
      modeFeedBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 text-white bg-amber-500/40 shadow-sm';
      modeInspectBtn.className = 'px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 text-white/70 hover:text-white';
      showToast('已切換為【撒飼料模式】：點擊水面投擲美味碎屑');
    });

    // 光影切換 (正午 / 黃昏 / 夜光)
    const timeBtns = document.querySelectorAll('.time-btn');
    const timeBadge = document.getElementById('timeBadge');

    timeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = btn.dataset.time;
        timeMode = selected;
        timeBadge.innerText = THEMES[selected].name;

        timeBtns.forEach(b => {
          b.classList.remove('bg-white/30');
          b.classList.add('text-white/70');
        });
        btn.classList.add('bg-white/30');
        btn.classList.remove('text-white/70');

        showToast(`光影時空已轉換為：【${THEMES[selected].name}】`);
        soundManager.playWaterPlink(900);
      });
    });

    // 召喚新生物按鈕
    document.getElementById('summonBtn').addEventListener('click', () => {
      const choices = ['clownfish', 'bluetang', 'turtle', 'jellyfish'];
      const pick = choices[Math.floor(Math.random() * choices.length)];
      
      const spawnX = Math.random() * (width - 100) + 50;
      const spawnY = Math.random() * (height * 0.7) + 50;

      if (pick === 'turtle') {
        fishes.push(new SeaTurtle(spawnX, spawnY));
      } else if (pick === 'jellyfish') {
        fishes.push(new Jellyfish(spawnX, spawnY));
      } else {
        fishes.push(new SchoolFish(spawnX, spawnY, pick));
      }

      spawnBubbles(spawnX, spawnY, 8);
      ripples.push(new WaterRipple(spawnX, spawnY, 1.5));
      soundManager.playWaterPlink(1050);
      showToast('✨ 一隻新的海洋生物進入了這片淺海！');
    });

    // 音效開關按鈕
    const soundBtn = document.getElementById('soundToggleBtn');
    const soundIcon = document.getElementById('soundIcon');
    soundBtn.addEventListener('click', () => {
      const active = soundManager.toggle();
      if (active) {
        soundIcon.className = 'fa-solid fa-volume-high text-cyan-300';
        showToast('🔊 自然海洋白噪音與水聲已開啟');
      } else {
        soundIcon.className = 'fa-solid fa-volume-xmark text-white/60';
        showToast('🔈 音效已靜音');
      }
    });

    /* ========================================================
       9. 淺海生態圖鑑系統 (Discovery Journal & Easter Egg)
       ======================================================== */
    const journalModal = document.getElementById('journalModal');
    const journalBtn = document.getElementById('journalBtn');
    const closeJournalBtn = document.getElementById('closeJournalBtn');
    const journalGrid = document.getElementById('journalGrid');
    const journalCountBadge = document.getElementById('journalCountBadge');
    const journalProgressText = document.getElementById('journalProgressText');
    const journalProgressBar = document.getElementById('journalProgressBar');
    const eggSummonBtn = document.getElementById('eggSummonBtn');

    function updateJournalUI() {
      const total = Object.keys(SPECIES_DB).length;
      const unlockedCount = Object.values(SPECIES_DB).filter(s => s.unlocked).length;
      const pct = Math.round((unlockedCount / total) * 100);

      journalCountBadge.innerText = `${unlockedCount}/${total}`;
      journalProgressText.innerText = `${unlockedCount} / ${total} (${pct}%)`;
      journalProgressBar.style.width = `${pct}%`;

      // 檢查彩蛋解鎖
      if (unlockedCount >= total - 1 && !SPECIES_DB.whaleshark.unlocked) {
        // 解鎖鯨鯊
        SPECIES_DB.whaleshark.unlocked = true;
        eggSummonBtn.classList.remove('hidden');
        showToast('🏆 恭喜！您已探索完淺海，鯨鯊圖鑑已解鎖！');
      }

      // 渲染卡片清單
      journalGrid.innerHTML = '';
      Object.values(SPECIES_DB).forEach(sp => {
        const item = document.createElement('div');
        item.className = `p-3 rounded-2xl flex items-center justify-between border transition-all ${
          sp.unlocked 
            ? 'bg-white/10 border-white/25 hover:bg-white/20 cursor-pointer' 
            : 'bg-black/30 border-white/5 opacity-50'
        }`;

        item.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
              sp.unlocked ? 'bg-cyan-500/20 text-white' : 'bg-white/5 text-white/30'
            }">
              ${sp.unlocked ? sp.icon : '<i class="fa-solid fa-lock text-xs"></i>'}
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-sm ${sp.unlocked ? 'text-white' : 'text-white/40'}">
                  ${sp.unlocked ? sp.name : '神秘未解鎖物種'}
                </span>
                ${sp.unlocked ? `<span class="text-[10px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-200">${sp.tag}</span>` : ''}
              </div>
              <p class="text-[11px] text-white/50 line-clamp-1">${sp.unlocked ? sp.desc : '在清澈水域中點擊尋找...'}</p>
            </div>
          </div>
          ${sp.unlocked ? '<i class="fa-solid fa-chevron-right text-xs text-white/40"></i>' : ''}
        `;

        if (sp.unlocked) {
          item.addEventListener('click', () => {
            journalModal.classList.add('opacity-0', 'pointer-events-none');
            showCreatureCard(sp.id);
          });
        }

        journalGrid.appendChild(item);
      });
    }

    journalBtn.addEventListener('click', () => {
      updateJournalUI();
      journalModal.classList.remove('opacity-0', 'pointer-events-none');
    });

    closeJournalBtn.addEventListener('click', () => {
      journalModal.classList.add('opacity-0', 'pointer-events-none');
    });

    // 點擊背景關閉 Modal
    journalModal.addEventListener('click', (e) => {
      if (e.target === journalModal) {
        journalModal.classList.add('opacity-0', 'pointer-events-none');
      }
    });

    // 召喚巨型鯨鯊彩蛋
    eggSummonBtn.addEventListener('click', () => {
      journalModal.classList.add('opacity-0', 'pointer-events-none');
      if (!whaleSharkInstance) {
        whaleSharkInstance = new WhaleShark();
        showToast('🐋 溫柔巨人·巡遊鯨鯊 正在穿過淺海！');
        soundManager.playDiscoverChime();
      } else {
        showToast('鯨鯊正在海面上優雅滑行中～');
      }
    });

    // Toast 通知浮動提示
    let toastTimer = null;
    function showToast(msg) {
      const toast = document.getElementById('toast');
      const toastMsg = document.getElementById('toastMsg');
      toastMsg.innerText = msg;
      toast.classList.remove('opacity-0', 'pointer-events-none');
      toast.classList.add('opacity-100');

      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
      }, 2600);
    }

    // 預設解鎖第一隻小丑魚給使用者引導探索
    setTimeout(() => {
      unlockSpecies('clownfish');
    }, 1200);

  
