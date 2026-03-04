import React, { useEffect, useRef, useState } from 'react';
import { GamePhase, RealityMode, GameState, Wall, Language } from './types';
import { FaceService } from './services/gestureService'; 
import { AudioService } from './services/audioService';
import { translations } from './i18n';
import { Camera, Loader2, Brain, Play, RotateCcw, Target, AlertTriangle, LogOut, Heart, RefreshCw, Settings } from 'lucide-react';
import { isVerticalOverlap, collisionSide } from './services/collision';
import { ensureCanvasSize as ensureCanvasSizeUtil, drawWallsOnCanvas as drawWalls } from './services/rendering';
import { spawnShatter as spawnShatterUtil, spawnFullShatter as spawnFull, updateAndDrawParticles as updateParticles, Particle, Debris, spawnDebrisShatter, updateAndDrawDebris } from './services/particles';

// --- TUNING PARAMETERS ---
const PLAYER_SIZE_PCT = 12; // Increased for better mobile visibility
const BASE_SPEED = 0.20; // Slower start
const SPEED_INC = 0.02; // Step increase
const SPAWN_RATE = 45; // Slower spawn initially (larger gap between walls vertically too?)
const GAP_WIDTH_BASE = 50; // Wider start
const MIN_GAP_WIDTH = 20;
const DEADZONE = 0.03; 
const MAX_LIVES = 3;
const WALL_HEIGHT_PCT = 5;
const HIT_PIECE_WIDTH_PCT = 3;

// Inversion Settings
const INVERSION_WARNING_MS = 5000;
const INVERSION_DURATION_MS = 15000;
const FIRST_INVERSION_SCORE = 10;
const INVERSION_SCORE_INTERVAL = 15;

// Practice Specifics
const PRACTICE_SPEED = 0.20; 
const PRACTICE_GAP = 45; 

const PlaneIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 939 1280"
    fill="currentColor"
  >
    <path d="M463.2 4.7c-31.4 31.5-53 136.6-58.3 283.8l-1.1 31-3.2 3c-1.7 1.6-13.3 11.6-25.6 22.2-12.4 10.5-25.6 22-29.4 25.5l-6.8 6.3-.9 10c-.5 5.5-2.1 21.5-3.5 35.5s-5.2 53.1-8.4 86.9c-3.9 40.1-6.4 61.9-7.2 62.9-.7.8-40.4 36.2-88.3 78.6-47.8 42.4-99.1 87.8-114 100.9-14.8 13.2-40.5 35.9-57 50.6-16.4 14.6-35.3 31.4-42 37.2-6.6 5.8-13.1 11.8-14.5 13.3l-2.5 2.8-.3 37.1-.3 37.1 5.8 5.9c3.2 3.2 11.9 11.1 19.3 17.5 7.4 6.5 16.9 14.9 21 18.8 7.6 7.3 19.1 15.4 21.8 15.4 1.6 0 189.6 62.7 192.5 64.2 1.4.7 1.7 2.2 1.7 8.1v7.2l-13.2 12.8c-7.3 7.1-19.8 18.5-27.8 25.3-8 6.8-16.1 13.9-18.1 15.7-2 1.7-8.1 7-13.5 11.7-5.4 4.7-13.8 12.3-18.6 17l-8.8 8.5-.5 22c-.2 12.1-.7 30.8-1 41.5-.7 22.1-.3 23.8 5.5 25.2 3.1.8 33.2 10.4 63.5 20.3 5.5 1.8 11.6 3.6 13.5 4 1.9.4 4.9 1.5 6.5 2.3 1.7.9 3.5 1.6 4 1.7 2.5.3 7.4 1.8 11.7 3.7l4.7 2.1 4.3-2.7c11.4-7.1 17.2-12 45.7-38.6 9.1-8.6 22.7-20.9 30.2-27.5 7.4-6.6 18.9-16.8 25.6-22.7l12-10.6.8-26.9c.4-14.7 1-28.4 1.4-30.5l.6-3.6 14.7 8.4c8.2 4.6 15.2 8.4 15.7 8.4s8.7-3.8 18.2-8.5 17.7-8.5 18.1-8.5c.4 0 .8 15.3.8 34.1v34.1l5.8 6 5.8 6 5.7-6.1 5.7-6v-34c0-22.3.3-34.1 1-34.1.6 0 8.7 3.8 18 8.5s17.5 8.5 18.2 8.5c.7 0 7.8-3.8 15.8-8.4 8-4.6 14.8-8.1 15.2-7.8.4.4 1.2 14.2 1.8 30.7.9 26.2 1.3 30.2 2.8 31.6.9.9 22 19.4 46.8 41 24.8 21.7 49.5 43.2 54.8 47.9 5.4 4.7 10.5 8.8 11.4 9.2 1.1.5 21.9-5.8 56.7-17.1l55-17.9-.3-15.4c-1.5-64.6-1.8-69.6-4-71.5-1.2-1-23.5-21.4-49.7-45.3l-47.6-43.5.3-8 .3-8 39.5-13.4c21.7-7.3 67.1-22.6 100.9-33.8l61.3-20.6 29.9-26.4 29.9-26.5V855l-2.7-2.9c-1.6-1.6-32.5-29.1-68.8-61.2S789.6 722 775 709c-14.6-12.9-55.5-49.1-90.8-80.4-35.5-31.5-64.5-57.9-64.7-59-.3-1.2-2.8-26-5.5-55.1-2.8-29.2-6.4-66.5-8-83-1.7-16.5-3.5-35-4.1-41-.7-7.3-1.7-12-2.9-13.9-2.1-3.4-12.9-13.1-40.5-36.5-11.1-9.3-20.7-18.2-21.4-19.7-1.3-3-2-13.9-4.1-66.2-.6-15.1-1.5-30.8-2-35-.5-4.3-1.4-12.9-2-19.2-2.9-30.2-5.5-49.9-10.1-77-5.3-31.5-8-42.8-15.8-67.1-5.8-17.7-11-29-18.2-39.5C479.8 9.1 471 0 469 0c-.6 0-3.2 2.1-5.8 4.7z"/>
  </svg>
);

export default function App() {
  // --- REACT STATE (UI) ---
  const [phase, setPhase] = useState<GamePhase>(GamePhase.INIT);
  const [cameraError, setCameraError] = useState(false);
  const [score, setScore] = useState(0); 
  const [lives, setLives] = useState(MAX_LIVES);
  const [lang, setLang] = useState<Language>('zh');
  const [modeUI, setModeUI] = useState<RealityMode>(RealityMode.NORMAL); 
  const [practiceFeedback, setPracticeFeedback] = useState<string | null>(null);
  const [hitEffect, setHitEffect] = useState(false); 
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shakeFactor, setShakeFactor] = useState(1);     // 0.5 ~ 1.5
  const [densityFactor, setDensityFactor] = useState(1); // 0.5 ~ 1.5
  const [adaptivePerf, setAdaptivePerf] = useState(true);

  // --- REFS ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>(0);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const wallsContainerRef = useRef<HTMLDivElement>(null);
  const wallsCanvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameTime = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const debrisRef = useRef<Debris[]>([]);
  const worldRef = useRef<HTMLDivElement>(null);
  const shakeUntilRef = useRef<number>(0);
  const shakeAmpRef = useRef<number>(0);
  const perfScaleRef = useRef<number>(1);
  const inversionBarRef = useRef<HTMLDivElement>(null);
  const inversionWarningRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);

  // Mutable Game State
  const state = useRef<GameState>({
    playerX: 50, 
    headX: 0.5,
    headY: 0.5,
    score: 0,
    lives: MAX_LIVES,
    speed: BASE_SPEED,
    mode: RealityMode.NORMAL,
    walls: [],
    lastModeSwitchScore: 0,
    isGameOver: false,
    gameStartTime: 0,
    practiceProgress: 0,
    // Inversion System
    inversionState: 'NONE',
    inversionTimer: 0,
    inversionTotalTime: INVERSION_DURATION_MS,
    nextInversionScore: FIRST_INVERSION_SCORE
  });

  const t = translations[lang];

  // --- INIT ---
  useEffect(() => {
    startInitialization();
    
    // Keyboard listener for restart
    const handleKeyDown = (e: KeyboardEvent) => {
        if (state.current.isGameOver && e.code === 'Space') {
            startGame();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        cancelAnimationFrame(requestRef.current);
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleLanguage = () => setLang(p => p === 'en' ? 'zh' : 'en');
  const toggleSettings = () => setSettingsOpen(v => !v);

  /**
   * Initialize camera and load Face API models
   */
  const startInitialization = async () => {
    setPhase(GamePhase.CHECKING_CAMERA);
    setCameraError(false);
    try {
      // More robust constraints for mobile
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 640 }, 
          height: { ideal: 480 } 
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Promise handling for play() to catch autoplay blocks
        videoRef.current.play().catch(e => console.log("Autoplay blocked, waiting for interaction", e));
      }
      setPhase(GamePhase.LOADING_MODEL);
      await FaceService.getInstance().initialize();
      setPhase(GamePhase.RULES);
    } catch (err) {
      console.error("Camera failed", err);
      setCameraError(true);
    }
  };

  /**
   * Reset game state variables for a new session
   * @param isPractice - Whether to initialize in practice mode
   */
  const initGameState = (isPractice: boolean) => {
    // Reset game state
    state.current = {
        playerX: 50,
        headX: 0.5,
        headY: 0.5,
        score: 0,
        lives: MAX_LIVES,
        speed: isPractice ? PRACTICE_SPEED : BASE_SPEED,
        mode: isPractice ? RealityMode.INVERTED : RealityMode.NORMAL,
        walls: [],
        lastModeSwitchScore: 0,
        isGameOver: false,
        gameStartTime: performance.now(),
        practiceProgress: 0,
        invincibleUntil: 0,
        inversionShieldUntil: 0,
        // Inversion System
        inversionState: 'NONE',
        inversionTimer: 0,
        inversionTotalTime: INVERSION_DURATION_MS,
        nextInversionScore: FIRST_INVERSION_SCORE
    };
    setScore(0);
    setLives(MAX_LIVES);
    setModeUI(state.current.mode);
    setPracticeFeedback(null);
    setHitEffect(false);

    if (wallsContainerRef.current) wallsContainerRef.current.innerHTML = '';
    particlesRef.current = [];
    debrisRef.current = [];
    lastFrameTime.current = 0;
  };

  /**
   * Start the main game loop
   */
  const startGame = () => {
    cancelAnimationFrame(requestRef.current); // Ensure no double loops
    AudioService.getInstance().playStart();
    initGameState(false);
    setPhase(GamePhase.PLAYING);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  /**
   * Start the practice mode loop
   */
  const startPractice = () => {
    cancelAnimationFrame(requestRef.current);
    AudioService.getInstance().playStart();
    initGameState(true);
    setPhase(GamePhase.PRACTICE);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  /**
   * Exit practice mode and return to main menu
   */
  const exitPractice = () => {
    state.current.isGameOver = true; 
    setPhase(GamePhase.RULES);
  };

  // --- CORE LOOP ---
  const gameLoop = (time: number) => {
    // 1. INPUT (Always Run if video exists)
    if (videoRef.current) {
        const { x, y } = FaceService.getInstance().detect(videoRef.current);
        state.current.headX = x;
        state.current.headY = y;
    }

    // Stop if game is strictly over
    if (state.current.isGameOver) return; 
    
    // 2. INPUT MAPPING
    let deviation = state.current.headX - 0.5;
    if (Math.abs(deviation) < DEADZONE) {
        deviation = 0;
    } else {
        deviation = deviation > 0 ? deviation - DEADZONE : deviation + DEADZONE;
    }

    let targetX = deviation * -3 * 100 + 50; 
    if (state.current.mode === RealityMode.INVERTED) {
        targetX = 100 - targetX; 
    }
    
    state.current.playerX += (targetX - state.current.playerX) * 0.12;
    state.current.playerX = Math.max(0, Math.min(100, state.current.playerX));

    // INVERSION LOGIC (Time-based)
    const now = performance.now();
    const dt = lastFrameTime.current ? (now - lastFrameTime.current) : 16.7;
    
    if (state.current.inversionState === 'WARNING') {
        state.current.inversionTimer -= dt;
        if (state.current.inversionTimer <= 0) {
            switchMode();
            state.current.inversionState = 'ACTIVE';
            state.current.inversionTimer = INVERSION_DURATION_MS;
            state.current.inversionTotalTime = INVERSION_DURATION_MS;
        }
    } else if (state.current.inversionState === 'ACTIVE') {
        state.current.inversionTimer -= dt;
        if (state.current.inversionTimer <= 0) {
            switchMode();
            state.current.inversionState = 'NONE';
            state.current.nextInversionScore = state.current.score + INVERSION_SCORE_INTERVAL;
        }
    }

    // 3. WALLS
    updateWalls();

    // 4. RENDER
    renderFrame();

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const updateWalls = () => {
    const s = state.current;
    const isPractice = phase === GamePhase.PRACTICE;

    // Calculate player vertical bounds for accurate collision
    let playerTop = 74; // Fallback
    let playerBottom = 86;
    if (wallsContainerRef.current) {
        const h = wallsContainerRef.current.clientHeight;
        const w = wallsContainerRef.current.clientWidth;
        const pHeightPct = ((PLAYER_SIZE_PCT / 100) * w / h) * 100;
        playerBottom = 80; // Player is at bottom 20%
        playerTop = 80 - pHeightPct;
    }

    // Spawn
    const lastWall = s.walls[s.walls.length - 1];
    if (!lastWall || lastWall.y > SPAWN_RATE) {
        let gapW = 0;
        
        if (isPractice) {
            gapW = PRACTICE_GAP;
        } else {
            // PROGRESSION LOGIC
            const level = Math.floor(s.score / 3);
            const gapReduction = level * 5; // Reduce gap by 5% every 3 points
            const baseGap = Math.max(MIN_GAP_WIDTH, GAP_WIDTH_BASE - gapReduction);
            
            // Inversion Warning Phase: Force wide gap to prepare player
            if (s.inversionState === 'WARNING') {
                gapW = Math.max(baseGap, 40); // Ensure at least 40% gap during warning
            } else {
                gapW = baseGap;
            }
        }
        
        const safeMargin = 5;
        const minX = safeMargin + (gapW/2);
        const maxX = 100 - safeMargin - (gapW/2);
        const gapX = Math.random() * (maxX - minX) + minX;
        
        s.walls.push({
            id: Date.now() + Math.random(),
            y: -20, 
            gapX,
            gapWidth: gapW,
            passed: false
        });
    }

    // Move & Collide
    for (let i = s.walls.length - 1; i >= 0; i--) {
        const wall = s.walls[i];
        wall.y += s.speed;

        const playerY = 80;
        
        // 1. Continuous Collision Detection
        // Only check if the wall hasn't been "cleared" (passed) or already hit
        if (!wall.passed && !wall.hitSide && isVerticalOverlap(wall.y, WALL_HEIGHT_PCT, playerTop, playerBottom)) {
            const forgiveness = 2.0;
            const side = collisionSide(s.playerX, PLAYER_SIZE_PCT, wall.gapX, wall.gapWidth, forgiveness);
            
            if (side) {
                // Collision detected!
                if (isPractice) {
                    handlePracticeFail();
                    wall.passed = true;
                    wall.hitSide = side;
                    wall.hitTime = performance.now();
                    spawnShatterFull(wall);
                    triggerShake(Math.min(10, 5 + s.speed * 18));
                    AudioService.getInstance().playShatter();
                    AudioService.getInstance().playThump();
                } else {
                    // Check invincibility
                    if (Date.now() < (s.invincibleUntil || 0)) {
                        // Invincible hit - just visually ignore or maybe spark?
                        // For now, we don't mark it passed to allow potential "re-hit" if invincibility wears off? 
                        // No, usually hitting once while invincible should clear the threat to avoid annoyance.
                        wall.passed = true;
                        wall.hitSide = side;
                        wall.hitTime = performance.now();
                        spawnShatterFull(wall); // Visual feedback that we broke it
                        triggerShake(Math.min(10, 5 + s.speed * 18));
                        AudioService.getInstance().playShatter();
                        AudioService.getInstance().playThump();
                    } else {
                        handlePlayerHit(wall, side);
                    }
                }
            }
            // If side == null (in gap), we do NOTHING. 
            // We wait until the wall is fully passed to score.
        }

        // 2. Scoring / Passing Detection
        // If the wall has moved past the player (top of wall > player's bottom edge)
        // and it hasn't been marked passed yet.
        if (!wall.passed && !wall.hitSide && wall.y > playerBottom) {
             wall.passed = true;
             if (isPractice) {
                 handlePracticeScore();
             } else {
                 handleGameScore();
             }
        }

        if (wall.y > 110) {
            s.walls.splice(i, 1);
        }
    }
  };

  const handlePlayerHit = (wall: Wall, side: 'left' | 'right') => {
    const s = state.current;
    
    // Damage logic with brief invincibility to prevent stacked hits
    s.lives -= 1;
    s.invincibleUntil = Date.now() + 600;
    wall.passed = true; // Invulnerability for this specific wall after hit
    wall.hitSide = side;
    wall.hitTime = performance.now();
    spawnShatterFull(wall);
    triggerShake(Math.min(12, 6 + s.speed * 20));
    AudioService.getInstance().playShatter();
    AudioService.getInstance().playThump();
    setLives(s.lives);

    // Always play damage effect/sound, even if game over
    AudioService.getInstance().playDamage();
    setHitEffect(true);
    setTimeout(() => setHitEffect(false), 300);

    if (s.lives <= 0) {
        gameOver();
    }
  };

  const handleGameScore = () => {
    const s = state.current;
    s.score += 1;
    
    // Difficulty Curve: Every 3 levels (points), increase speed
    // Speed increases by SPEED_INC every 3 points.
    const level = Math.floor(s.score / 3);
    const speedBoost = level * SPEED_INC;
    const targetSpeed = BASE_SPEED + speedBoost;
    s.speed = Math.min(0.40, targetSpeed);
    
    setScore(s.score);
    AudioService.getInstance().playTick();

    // Inversion Trigger (Scheduled)
    if (s.inversionState === 'NONE' && s.score >= s.nextInversionScore) {
        s.inversionState = 'WARNING';
        s.inversionTimer = INVERSION_WARNING_MS;
        s.inversionTotalTime = INVERSION_WARNING_MS; // For warning countdown
    }
  };

  const handlePracticeScore = () => {
    const s = state.current;
    s.practiceProgress += 1;
    setScore(s.practiceProgress);
    AudioService.getInstance().playTick();
  };

  const handlePracticeFail = () => {
     AudioService.getInstance().playDamage();
     setPracticeFeedback(t['practice.hit']);
     setTimeout(() => setPracticeFeedback(null), 800);
  };

  const switchMode = () => {
    const s = state.current;
    s.mode = s.mode === RealityMode.NORMAL ? RealityMode.INVERTED : RealityMode.NORMAL;
    s.lastModeSwitchScore = s.score;
    
    // Grant 3 seconds of invincibility for ANY mode switch (Normal->Inverted OR Inverted->Normal)
    s.invincibleUntil = Date.now() + 3000;
    s.inversionShieldUntil = Date.now() + 3000;
    
    setModeUI(s.mode);
    AudioService.getInstance().playStart();
  };

  const gameOver = () => {
    state.current.isGameOver = true;
    AudioService.getInstance().playFail();
    setPhase(GamePhase.GAME_OVER);
  };

  const ensureCanvasSize = () => {
    const canvas = wallsCanvasRef.current;
    const wrapper = wallsContainerRef.current;
    if (!canvas || !wrapper) return;
    ensureCanvasSizeUtil(canvas, wrapper);
  };

  const drawWallsOnCanvas = (ctx: CanvasRenderingContext2D) => {
    const s = state.current;
    drawWalls(
      ctx,
      s.walls,
      s.mode,
      ctx.canvas.width,
      ctx.canvas.height,
      WALL_HEIGHT_PCT,
      HIT_PIECE_WIDTH_PCT
    );
  };

  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, dtMs: number) => {
    updateParticles(particlesRef.current, ctx, dtMs);
  };

  const spawnShatter = (w: Wall, side: 'left' | 'right') => {
    const canvas = wallsCanvasRef.current;
    const wrapper = wallsContainerRef.current;
    if (!canvas || !wrapper) return;
    spawnShatterUtil(
      particlesRef.current,
      w,
      side,
      state.current.mode,
      wrapper.clientWidth,
      wrapper.clientHeight,
      WALL_HEIGHT_PCT,
      HIT_PIECE_WIDTH_PCT
    );
  };

  const spawnShatterFull = (w: Wall) => {
    const canvas = wallsCanvasRef.current;
    const wrapper = wallsContainerRef.current;
    if (!canvas || !wrapper) return;
    const s = state.current;
    const paceScale = Math.min(1.6, 1 + (s.speed * 1.2));
    
    // Spawn debris chunks
    spawnDebrisShatter(
        debrisRef.current,
        w,
        state.current.mode,
        wrapper.clientWidth,
        wrapper.clientHeight,
        WALL_HEIGHT_PCT
    );

    // Also spawn some small particles for effect
    const perfScale = adaptivePerf ? perfScaleRef.current : 1;
    const densityScale = Math.max(0.4, Math.min(1.8, densityFactor * paceScale * perfScale));
    spawnFull(
      particlesRef.current,
      w,
      state.current.mode,
      wrapper.clientWidth,
      wrapper.clientHeight,
      WALL_HEIGHT_PCT,
      densityScale * 0.5 // Reduce small particles since we have debris
    );
  };

  const triggerShake = (amplitude: number) => {
    const perfScale = adaptivePerf ? perfScaleRef.current : 1;
    shakeUntilRef.current = performance.now() + 120;
    shakeAmpRef.current = amplitude * shakeFactor * perfScale;
  };

  const renderFrame = () => {
    const s = state.current;

    // Inversion UI Updates
    if (inversionWarningRef.current) {
        if (s.inversionState === 'WARNING') {
            inversionWarningRef.current.style.opacity = '1';
            const seconds = Math.ceil(s.inversionTimer / 1000);
            const textEl = inversionWarningRef.current.querySelector('.countdown-text');
            if (textEl) textEl.textContent = seconds.toString();
        } else {
            inversionWarningRef.current.style.opacity = '0';
        }
    }

    if (inversionBarRef.current) {
        if (s.inversionState === 'ACTIVE') {
            const p = Math.max(0, s.inversionTimer / s.inversionTotalTime);
            inversionBarRef.current.style.width = `${p * 100}%`;
        } else {
            inversionBarRef.current.style.width = '0%';
        }
    }

    // Render Player
    if (playerRef.current) {
        playerRef.current.style.left = `${s.playerX}%`;
        playerRef.current.style.transform = `translateX(-50%)`;
    }

    // Shield Update
    if (shieldRef.current) {
        if (Date.now() < (s.inversionShieldUntil || 0)) {
            shieldRef.current.style.opacity = '1';
        } else {
            shieldRef.current.style.opacity = '0';
        }
    }

    // Render Walls & Particles (Canvas)
    ensureCanvasSize();
    const canvas = wallsCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const now = performance.now();
        const dt = lastFrameTime.current ? (now - lastFrameTime.current) : 16.7;
        lastFrameTime.current = now;
        if (adaptivePerf) {
          const target = dt > 22 ? 0.7 : 1;
          const next = perfScaleRef.current + (target - perfScaleRef.current) * 0.05;
          perfScaleRef.current = Math.max(0.6, Math.min(1, next));
        } else {
          perfScaleRef.current = 1;
        }
        if (canvas) {
          (canvas.style as any).imageRendering = 'auto';
        }
        drawWallsOnCanvas(ctx);
        updateAndDrawDebris(debrisRef.current, ctx, dt);
        updateAndDrawParticles(ctx, dt);
      }
    }

    // Screen shake
    const world = worldRef.current;
    if (world) {
      const now = performance.now();
      if (now < shakeUntilRef.current) {
        const p = (shakeUntilRef.current - now) / 120;
        const amp = shakeAmpRef.current * p * p;
        const dx = (Math.random() * 2 - 1) * amp;
        const dy = (Math.random() * 2 - 1) * amp;
        world.style.transform = `translate(${dx}px, ${dy}px)`;
      } else {
        world.style.transform = '';
      }
    }
  };

  // --- VIEW HELPERS ---
  const isInverted = modeUI === RealityMode.INVERTED;
  const themeColor = isInverted ? 'text-red-500' : 'text-cyan-400';
  const bgColor = isInverted ? 'bg-red-950' : 'bg-gray-900';
  const borderColor = isInverted ? 'border-red-500' : 'border-cyan-500';

  return (
    <div className={`relative w-screen h-[100dvh] overflow-hidden font-sans transition-colors duration-700 ${bgColor}`}>
      
      {/* BACKGROUND VIDEO */}
      <div className="absolute inset-0 z-0 opacity-40">
        <video 
            ref={videoRef} 
            className="w-full h-full object-cover video-mirror grayscale mix-blend-screen" 
            playsInline 
            muted 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black scanlines" />
      </div>

      {/* Hit Effect Overlay */}
      <div className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-100 bg-red-600 ${hitEffect ? 'opacity-40' : 'opacity-0'}`} />

      {/* LANGUAGE */}
      <button 
        onClick={toggleLanguage}
        className="absolute top-safe-top right-safe-right mt-4 mr-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full border border-gray-600 text-xs hover:bg-white/10"
      >
        {lang === 'en' ? '中文' : 'EN'}
      </button>
      <button
        onClick={toggleSettings}
        className="absolute top-safe-top right-[calc(env(safe-area-inset-right)+4.5rem)] mt-4 z-50 bg-black/50 text-white px-3 py-1 rounded-full border border-gray-600 text-xs hover:bg-white/10 flex items-center gap-1"
      >
        <Settings size={14} /> 设置
      </button>
      {settingsOpen && (
        <div className="absolute top-14 right-4 z-50 p-4 w-64 pointer-events-auto bg-black/80 text-white rounded-xl border border-gray-700 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm opacity-80">性能自适应</span>
            <button onClick={()=>setAdaptivePerf(v=>!v)} className={`px-2 py-0.5 text-xs ${adaptivePerf?'bg-gray-200 text-black':'bg-gray-700'} rounded`}>{adaptivePerf?'ON':'OFF'}</button>
          </div>
          <div className="mb-3">
            <label className="text-xs opacity-80">
              震屏强度 {shakeFactor.toFixed(1)}
              <input type="range" min="0.5" max="1.5" step="0.1" value={shakeFactor} onChange={e=>setShakeFactor(parseFloat(e.target.value))} className="w-full" aria-label="Shake Factor" />
            </label>
          </div>
          <div>
            <label className="text-xs opacity-80">
              碎裂密度 {densityFactor.toFixed(1)}
              <input type="range" min="0.5" max="1.5" step="0.1" value={densityFactor} onChange={e=>setDensityFactor(parseFloat(e.target.value))} className="w-full" aria-label="Debris Density" />
            </label>
          </div>
        </div>
      )}

      {/* GAMEPLAY HUD (Shared for Playing & Practice) */}
      {(phase === GamePhase.PLAYING || phase === GamePhase.PRACTICE) && (
          <div className="absolute inset-0 z-10 pointer-events-none">
              
              {/* Practice Header & Controls (Top) */}
              {phase === GamePhase.PRACTICE && (
                  <>
                      <div className="absolute top-16 md:top-4 left-0 right-0 flex justify-center pointer-events-auto">
                           <div className="px-4 py-1 font-bold tracking-widest text-xs animate-pulse bg-red-600 text-white rounded-full border border-red-400 shadow-[0_0_15px_red]">
                               {t['practice.title']}
                           </div>
                      </div>
                      
                      {/* Exit Button - Pointer events auto to be clickable */}
                      <button 
                        onClick={exitPractice}
                        className="absolute top-safe-top left-safe-left mt-4 ml-4 z-50 flex items-center gap-2 pointer-events-auto transition-colors bg-red-900/80 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg border border-red-500 hover:bg-red-700"
                      >
                         <LogOut size={16} /> <span className="text-xs font-bold">{t['btn.exit_practice']}</span>
                      </button>
                  </>
              )}

              {/* LIVES (Top Left) */}
              {phase === GamePhase.PLAYING && (
                  <div className="absolute top-safe-top left-safe-left mt-4 ml-4 flex gap-1 z-20">
                      {[...Array(MAX_LIVES)].map((_, i) => (
                        <Heart 
                           key={i} 
                           size={24} 
                           className={`${i < lives ? 'fill-red-500 text-red-500' : 'fill-none text-gray-600'}`} 
                        />
                      ))}
                  </div>
              )}

              {/* Score */}
              <div className="absolute top-20 md:top-12 left-0 right-0 text-center">
                  <div className={`text-6xl md:text-6xl font-black font-mono tracking-tighter ${themeColor} drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]`}>
                    {score}
                  </div>
              </div>

              {/* Mode Indicator */}
              <div className={`absolute top-40 md:top-32 left-0 right-0 text-center transition-opacity duration-300 ${(score > 0 || phase === GamePhase.PRACTICE) ? 'opacity-100' : 'opacity-0'}`}>
                  <span className={`inline-block px-4 py-1 rounded border ${borderColor} ${themeColor} bg-black/60 font-bold tracking-[0.2em] text-sm ${phase === GamePhase.PRACTICE ? '' : 'animate-pulse'}`}>
                      {isInverted ? t['game.inverted'] : t['game.normal']}
                  </span>
              </div>
              
              {/* Collision Feedback */}
              {practiceFeedback && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center z-50">
                      <div className="inline-block bg-red-600/90 text-white font-black text-2xl md:text-3xl px-6 py-4 md:px-8 md:py-4 rounded-xl rotate-[-5deg] border-4 border-white shadow-2xl animate-bounce">
                          <div className="flex items-center gap-2 justify-center">
                            <AlertTriangle size={24} className="md:w-8 md:h-8" />
                            {practiceFeedback}
                          </div>
                      </div>
                  </div>
              )}

              {/* INVERSION UI (Managed via Refs for performance) */}
              <div 
                ref={inversionWarningRef}
                className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 text-center pointer-events-none opacity-0 transition-opacity duration-300 z-40"
              >
                  <div className="text-8xl font-black text-red-600 animate-pulse drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] tabular-nums countdown-text">5</div>
                  <div className="text-sm font-bold text-red-400 mt-2 tracking-[0.5em] uppercase">Reality Shift Incoming</div>
              </div>

              <div className="absolute bottom-safe-bottom left-0 right-0 h-3 bg-gray-900/50 backdrop-blur-sm z-40 border-t border-white/10">
                  <div 
                    ref={inversionBarRef}
                    className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500 w-0 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  />
              </div>

              {/* GAME WORLD */}
              <div ref={worldRef} className="absolute inset-0 overflow-hidden perspective-1000">
                  <div ref={wallsContainerRef} className="w-full h-full">
                    <canvas ref={wallsCanvasRef} className="w-full h-full" />
                  </div>
                  
                  {/* Player Cursor (Plane) */}
                  <div 
                    ref={playerRef}
                    className="absolute bottom-[20%] aspect-square"
                    style={{ left: '50%', width: `${PLAYER_SIZE_PCT}%`, marginLeft: `-${PLAYER_SIZE_PCT/2}%` }}
                  >
                      {/* Shield Effect */}
                      <div 
                          ref={shieldRef}
                          className="absolute inset-[-20%] rounded-full border-4 border-white/50 opacity-0 transition-opacity duration-300 pointer-events-none z-0"
                      />

                      {/* Plane Icon (Replaced with provided SVG) */}
                      <div className={`w-full h-full ${themeColor} filter drop-shadow-[0_0_10px_currentColor] transition-colors duration-300 relative`}>
                        {/* Width Indicators - Aligned with wingtips, shorter length to avoid tail */}
                        <div className="absolute top-0 left-[13.5%] w-0.5 h-[65%] bg-gradient-to-t from-transparent via-current to-transparent opacity-50" />
                        <div className="absolute top-0 right-[13.5%] w-0.5 h-[65%] bg-gradient-to-t from-transparent via-current to-transparent opacity-50" />
                        
                        <svg
                          className="w-full h-full relative z-10"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 939 1280"
                          fill="currentColor"
                        >
                          <path d="M463.2 4.7c-31.4 31.5-53 136.6-58.3 283.8l-1.1 31-3.2 3c-1.7 1.6-13.3 11.6-25.6 22.2-12.4 10.5-25.6 22-29.4 25.5l-6.8 6.3-.9 10c-.5 5.5-2.1 21.5-3.5 35.5s-5.2 53.1-8.4 86.9c-3.9 40.1-6.4 61.9-7.2 62.9-.7.8-40.4 36.2-88.3 78.6-47.8 42.4-99.1 87.8-114 100.9-14.8 13.2-40.5 35.9-57 50.6-16.4 14.6-35.3 31.4-42 37.2-6.6 5.8-13.1 11.8-14.5 13.3l-2.5 2.8-.3 37.1-.3 37.1 5.8 5.9c3.2 3.2 11.9 11.1 19.3 17.5 7.4 6.5 16.9 14.9 21 18.8 7.6 7.3 19.1 15.4 21.8 15.4 1.6 0 189.6 62.7 192.5 64.2 1.4.7 1.7 2.2 1.7 8.1v7.2l-13.2 12.8c-7.3 7.1-19.8 18.5-27.8 25.3-8 6.8-16.1 13.9-18.1 15.7-2 1.7-8.1 7-13.5 11.7-5.4 4.7-13.8 12.3-18.6 17l-8.8 8.5-.5 22c-.2 12.1-.7 30.8-1 41.5-.7 22.1-.3 23.8 5.5 25.2 3.1.8 33.2 10.4 63.5 20.3 5.5 1.8 11.6 3.6 13.5 4 1.9.4 4.9 1.5 6.5 2.3 1.7.9 3.5 1.6 4 1.7 2.5.3 7.4 1.8 11.7 3.7l4.7 2.1 4.3-2.7c11.4-7.1 17.2-12 45.7-38.6 9.1-8.6 22.7-20.9 30.2-27.5 7.4-6.6 18.9-16.8 25.6-22.7l12-10.6.8-26.9c.4-14.7 1-28.4 1.4-30.5l.6-3.6 14.7 8.4c8.2 4.6 15.2 8.4 15.7 8.4s8.7-3.8 18.2-8.5 17.7-8.5 18.1-8.5c.4 0 .8 15.3.8 34.1v34.1l5.8 6 5.8 6 5.7-6.1 5.7-6v-34c0-22.3.3-34.1 1-34.1.6 0 8.7 3.8 18 8.5s17.5 8.5 18.2 8.5c.7 0 7.8-3.8 15.8-8.4 8-4.6 14.8-8.1 15.2-7.8.4.4 1.2 14.2 1.8 30.7.9 26.2 1.3 30.2 2.8 31.6.9.9 22 19.4 46.8 41 24.8 21.7 49.5 43.2 54.8 47.9 5.4 4.7 10.5 8.8 11.4 9.2 1.1.5 21.9-5.8 56.7-17.1l55-17.9-.3-15.4c-1.5-64.6-1.8-69.6-4-71.5-1.2-1-23.5-21.4-49.7-45.3l-47.6-43.5.3-8 .3-8 39.5-13.4c21.7-7.3 67.1-22.6 100.9-33.8l61.3-20.6 29.9-26.4 29.9-26.5V855l-2.7-2.9c-1.6-1.6-32.5-29.1-68.8-61.2S789.6 722 775 709c-14.6-12.9-55.5-49.1-90.8-80.4-35.5-31.5-64.5-57.9-64.7-59-.3-1.2-2.8-26-5.5-55.1-2.8-29.2-6.4-66.5-8-83-1.7-16.5-3.5-35-4.1-41-.7-7.3-1.7-12-2.9-13.9-2.1-3.4-12.9-13.1-40.5-36.5-11.1-9.3-20.7-18.2-21.4-19.7-1.3-3-2-13.9-4.1-66.2-.6-15.1-1.5-30.8-2-35-.5-4.3-1.4-12.9-2-19.2-2.9-30.2-5.5-49.9-10.1-77-5.3-31.5-8-42.8-15.8-67.1-5.8-17.7-11-29-18.2-39.5C479.8 9.1 471 0 469 0c-.6 0-3.2 2.1-5.8 4.7z"/>
                        </svg>
                      </div>
                  </div>
              </div>

              <div className="absolute bottom-8 md:bottom-10 w-full text-center">
                   <p className="text-white/50 text-[10px] md:text-xs font-mono uppercase tracking-widest">{t['game.controls']}</p>
              </div>
          </div>
      )}

      {/* MENUS */}
      {phase !== GamePhase.PLAYING && phase !== GamePhase.PRACTICE && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              
              <div className="mb-8 text-center space-y-2">
                    <h1 className="flex items-center justify-center text-5xl md:text-6xl font-black tracking-tighter italic">
                        <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">MIND</span>
                        <span className="text-white mx-1 opacity-80 text-6xl md:text-7xl -mt-2 font-light">/</span>
                        <span className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">SHIFT</span>
                    </h1>
                    <p className="text-gray-400 tracking-[0.5em] text-[10px] md:text-xs uppercase">{t['app.subtitle']}</p>
              </div>

              {/* ERROR STATE */}
              {cameraError && (
                  <div className="text-red-400 flex flex-col items-center gap-6 text-center max-w-xs">
                      <AlertTriangle size={64} className="animate-pulse" />
                      <div>
                          <h2 className="text-xl font-bold mb-2">{t['error.camera.title']}</h2>
                          <p className="text-sm opacity-80">{t['error.camera.desc']}</p>
                      </div>
                      <button 
                         onClick={startInitialization}
                         className="bg-red-900/50 border border-red-500 text-white px-6 py-3 rounded-full hover:bg-red-800 transition flex items-center gap-2"
                      >
                         <RefreshCw size={18} /> {t['btn.retry_camera']}
                      </button>
                  </div>
              )}

              {/* PHASE: LOADING (No Error) */}
              {!cameraError && (phase === GamePhase.CHECKING_CAMERA || phase === GamePhase.LOADING_MODEL) && (
                  <div className="text-cyan-400 flex flex-col items-center gap-4 animate-pulse">
                      {phase === GamePhase.CHECKING_CAMERA ? <Camera size={48} /> : <Loader2 size={48} className="animate-spin" />}
                      <p className="text-sm">{phase === GamePhase.CHECKING_CAMERA ? t['phase.camera'] : t['phase.loading']}</p>
                  </div>
              )}

              {/* PHASE: RULES (MAIN MENU) */}
              {!cameraError && phase === GamePhase.RULES && (
                  <div className="max-w-md w-full p-6 md:p-8 space-y-6 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
                      <PlaneIcon className="text-cyan-400 mx-auto w-16 h-16 md:w-20 md:h-20 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                      
                      <div className="space-y-4">
                          <div className="flex items-center gap-4">
                              <div className="bg-cyan-500/20 text-cyan-400 p-3 rounded-lg flex-shrink-0"><Brain size={24}/></div>
                              <div>
                                  <h3 className="font-bold text-base md:text-lg text-white">{t['rules.normal.title']}</h3>
                                  <p className="text-gray-400 text-xs md:text-sm">{t['rules.normal.desc']}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="bg-red-500/20 text-red-500 p-3 rounded-lg flex-shrink-0"><RotateCcw size={24}/></div>
                              <div>
                                  <h3 className="font-bold text-base md:text-lg text-white">{t['rules.inverted.title']}</h3>
                                  <p className="text-gray-400 text-xs md:text-sm">{t['rules.inverted.desc']}</p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="space-y-3 pt-4">
                        <button 
                            onClick={startGame}
                            className="w-full py-4 flex items-center justify-center gap-2 bg-white text-black font-black rounded-xl hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <Play size={20} fill="black" /> {t['btn.start']}
                        </button>
                        
                        <button 
                            onClick={startPractice}
                            className="w-full py-3 flex items-center justify-center gap-2 bg-gray-800 text-red-400 font-bold border border-red-900/50 hover:bg-gray-700 transition-colors rounded-xl"
                        >
                            <Target size={18} /> {t['btn.practice']}
                        </button>
                      </div>
                  </div>
              )}

              {/* PHASE: GAME OVER */}
              {phase === GamePhase.GAME_OVER && (
                  <div className="text-center space-y-6 md:space-y-8 animate-in zoom-in duration-300">
                      <div className="relative">
                          <PlaneIcon className="text-red-500 mx-auto mb-4 w-16 h-16 md:w-20 md:h-20" />
                          <div className="text-7xl md:text-8xl font-black text-white">{score}</div>
                      </div>
                      <div className="space-y-4 flex flex-col items-center">
                          {/* Restart Button - Standard Click */}
                          <button 
                            onClick={startGame}
                            className="group relative py-4 px-12 transition-all overflow-hidden bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-full shadow-lg shadow-cyan-500/20"
                          >
                             <span className="text-lg font-bold">{t['btn.retry']}</span>
                          </button>
                          
                          <div className="pt-4">
                             <button 
                                onClick={() => setPhase(GamePhase.RULES)}
                                className="text-gray-500 hover:text-white text-sm py-2 px-4"
                             >
                                {t['btn.main_menu']}
                             </button>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
