import React, { useEffect, useRef, useState } from 'react';
import { GamePhase, RealityMode, GameState, Wall, Language } from './types';
import { FaceService } from './services/gestureService'; 
import { AudioService } from './services/audioService';
import { translations } from './i18n';
import { Camera, Loader2, Brain, Play, RotateCcw, Skull, Target, AlertTriangle, LogOut, Plane, Heart, RefreshCw } from 'lucide-react';

// --- TUNING PARAMETERS ---
const PLAYER_SIZE_PCT = 12; // Increased for better mobile visibility
const BASE_SPEED = 0.25; 
const SPEED_INC = 0.01; 
const SPAWN_RATE = 40; 
const INVERT_CHANCE_SCORE = 8; 
const GAP_WIDTH_BASE = 40; 
const MIN_GAP_WIDTH = 15;
const DEADZONE = 0.03; 
const MAX_LIVES = 3;

// Practice Specifics
const PRACTICE_SPEED = 0.20; 
const PRACTICE_GAP = 45; 

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

  // --- REFS ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>(0);
  
  const playerRef = useRef<HTMLDivElement>(null);
  const wallsContainerRef = useRef<HTMLDivElement>(null);

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
    practiceProgress: 0
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

  const initGameState = (isPractice: boolean) => {
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
        practiceProgress: 0
    };
    setScore(0);
    setLives(MAX_LIVES);
    setModeUI(state.current.mode);
    setPracticeFeedback(null);
    setHitEffect(false);

    if (wallsContainerRef.current) wallsContainerRef.current.innerHTML = '';
  };

  const startGame = () => {
    cancelAnimationFrame(requestRef.current); // Ensure no double loops
    AudioService.getInstance().playStart();
    initGameState(false);
    setPhase(GamePhase.PLAYING);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const startPractice = () => {
    cancelAnimationFrame(requestRef.current);
    AudioService.getInstance().playStart();
    initGameState(true);
    setPhase(GamePhase.PRACTICE);
    requestRef.current = requestAnimationFrame(gameLoop);
  };

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

    // 3. WALLS
    updateWalls();

    // 4. RENDER
    renderFrame();

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  const updateWalls = () => {
    const s = state.current;
    const isPractice = phase === GamePhase.PRACTICE;

    // Spawn
    const lastWall = s.walls[s.walls.length - 1];
    if (!lastWall || lastWall.y > SPAWN_RATE) {
        let gapW = 0;
        
        if (isPractice) {
            gapW = PRACTICE_GAP;
        } else {
            // PROGRESSION LOGIC
            const baseGap = Math.max(MIN_GAP_WIDTH, GAP_WIDTH_BASE - (s.score * 0.8));
            
            // Scripted early game:
            // Score 3-4 (Walls 4 and 5): Force wider gap for inversion tutorial
            if (s.score >= 3 && s.score <= 5 && s.mode === RealityMode.INVERTED) {
                gapW = 55; 
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
        
        if (wall.y > playerY && !wall.passed) {
            // Collision Check
            const pLeft = s.playerX - (PLAYER_SIZE_PCT / 2);
            const pRight = s.playerX + (PLAYER_SIZE_PCT / 2);
            const gapLeft = wall.gapX - (wall.gapWidth / 2);
            const gapRight = wall.gapX + (wall.gapWidth / 2);
            const forgiveness = 1.0; 

            if (pLeft < gapLeft + forgiveness || pRight > gapRight - forgiveness) {
                // COLLISION
                if (isPractice) {
                    handlePracticeFail();
                    wall.passed = true;
                } else {
                    handlePlayerHit(wall);
                }
            } else {
                // SUCCESS
                wall.passed = true;
                if (isPractice) {
                    handlePracticeScore();
                } else {
                    handleGameScore();
                }
            }
        }

        if (wall.y > 110) {
            s.walls.splice(i, 1);
        }
    }
  };

  const handlePlayerHit = (wall: Wall) => {
    const s = state.current;
    
    // Damage logic
    s.lives -= 1;
    wall.passed = true; // Invulnerability for this specific wall after hit
    setLives(s.lives);

    if (s.lives <= 0) {
        gameOver();
    } else {
        AudioService.getInstance().playDamage();
        setHitEffect(true);
        setTimeout(() => setHitEffect(false), 300);
    }
  };

  const handleGameScore = () => {
    const s = state.current;
    s.score += 1;
    
    const speedInc = s.score < 10 ? 0.005 : SPEED_INC;
    s.speed += speedInc; 
    
    setScore(s.score);
    AudioService.getInstance().playTick();

    if (s.score === 3) {
        if (s.mode === RealityMode.NORMAL) switchMode();
    }
    else if (s.score === 6) {
        if (s.mode === RealityMode.INVERTED) switchMode();
    }
    else if (s.score > 8 && (s.score - s.lastModeSwitchScore) > 8) {
        if (Math.random() > 0.5) {
            switchMode();
        }
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
    setModeUI(s.mode);
    AudioService.getInstance().playStart();
  };

  const gameOver = () => {
    state.current.isGameOver = true;
    AudioService.getInstance().playFail();
    setPhase(GamePhase.GAME_OVER);
  };

  const renderFrame = () => {
    const s = state.current;

    // Render Player
    if (playerRef.current) {
        playerRef.current.style.left = `${s.playerX}%`;
        const rot = (s.playerX - 50) * 0.5;
        playerRef.current.style.transform = `translateX(-50%) rotate(${rot}deg)`;
    }

    // Render Walls
    if (wallsContainerRef.current) {
        const html = s.walls.map(w => {
            const isBlue = s.mode === RealityMode.NORMAL;
            const colorClass = isBlue ? 'bg-cyan-500' : 'bg-red-500';
            const shadowClass = isBlue ? 'shadow-cyan-500/50' : 'shadow-red-500/50';
            
            const leftW = w.gapX - (w.gapWidth/2);
            const rightW = 100 - (w.gapX + (w.gapWidth/2));
            
            return `
                <div class="absolute top-0 left-0 h-[5%] ${colorClass} shadow-[0_0_15px] ${shadowClass} transition-colors duration-300" 
                     style="width: ${leftW}%; top: ${w.y}%;"></div>
                <div class="absolute top-0 right-0 h-[5%] ${colorClass} shadow-[0_0_15px] ${shadowClass} transition-colors duration-300" 
                     style="width: ${rightW}%; top: ${w.y}%;"></div>
            `;
        }).join('');
        
        wallsContainerRef.current.innerHTML = html;
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

      {/* GAMEPLAY HUD (Shared for Playing & Practice) */}
      {(phase === GamePhase.PLAYING || phase === GamePhase.PRACTICE) && (
          <div className="absolute inset-0 z-10 pointer-events-none">
              
              {/* Practice Header & Controls (Top) */}
              {phase === GamePhase.PRACTICE && (
                  <>
                      <div className="absolute top-16 md:top-4 left-0 right-0 flex justify-center pointer-events-auto">
                           <div className="bg-red-600 text-white px-4 py-1 rounded-full font-bold tracking-widest text-xs animate-pulse border border-red-400 shadow-[0_0_15px_red]">
                               {t['practice.title']}
                           </div>
                      </div>
                      
                      {/* Exit Button - Pointer events auto to be clickable */}
                      <button 
                        onClick={exitPractice}
                        className="absolute top-safe-top left-safe-left mt-4 ml-4 z-50 bg-red-900/80 text-white px-3 py-2 md:px-4 md:py-2 rounded-lg border border-red-500 hover:bg-red-700 flex items-center gap-2 pointer-events-auto transition-colors"
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
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full text-center">
                      <div className="inline-block bg-red-600/90 text-white font-black text-2xl md:text-3xl px-6 py-4 md:px-8 md:py-4 rounded-xl rotate-[-5deg] border-4 border-white shadow-2xl animate-bounce">
                          <div className="flex items-center gap-2 justify-center">
                            <AlertTriangle size={24} className="md:w-8 md:h-8" />
                            {practiceFeedback}
                          </div>
                      </div>
                  </div>
              )}

              {/* GAME WORLD */}
              <div className="absolute inset-0 overflow-hidden perspective-1000">
                  <div ref={wallsContainerRef} className="w-full h-full" />
                  
                  {/* Player Cursor (Plane) */}
                  <div 
                    ref={playerRef}
                    className="absolute bottom-[20%] aspect-square"
                    style={{ left: '50%', width: `${PLAYER_SIZE_PCT}%`, marginLeft: `-${PLAYER_SIZE_PCT/2}%` }}
                  >
                      {/* Plane Icon */}
                      <div className={`w-full h-full ${themeColor} filter drop-shadow-[0_0_10px_currentColor] transition-colors duration-300`}>
                           <Plane className="w-full h-full rotate-[-45deg] fill-current/30" strokeWidth={2} />
                      </div>

                      {/* Engine Trails */}
                      <div className={`absolute bottom-[60%] left-[25%] w-0.5 h-[25vh] bg-gradient-to-t from-${isInverted?'red':'cyan'}-500/50 to-transparent`} />
                      <div className={`absolute bottom-[60%] right-[25%] w-0.5 h-[25vh] bg-gradient-to-t from-${isInverted?'red':'cyan'}-500/50 to-transparent`} />
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
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 italic">
                        MIND<span className="text-cyan-400">/</span>SHIFT
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
                  <div className="max-w-md w-full bg-gray-900 border border-gray-700 p-6 md:p-8 rounded-2xl shadow-2xl space-y-6">
                      <div className="space-y-4">
                          <div className="flex items-center gap-4">
                              <div className="bg-cyan-500/20 p-3 rounded-lg text-cyan-400 flex-shrink-0"><Brain size={24}/></div>
                              <div>
                                  <h3 className="font-bold text-white text-base md:text-lg">{t['rules.normal.title']}</h3>
                                  <p className="text-gray-400 text-xs md:text-sm">{t['rules.normal.desc']}</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="bg-red-500/20 p-3 rounded-lg text-red-500 flex-shrink-0"><RotateCcw size={24}/></div>
                              <div>
                                  <h3 className="font-bold text-white text-base md:text-lg">{t['rules.inverted.title']}</h3>
                                  <p className="text-gray-400 text-xs md:text-sm">{t['rules.inverted.desc']}</p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="space-y-3 pt-4">
                        <button 
                            onClick={startGame}
                            className="w-full bg-white text-black font-black py-4 rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            <Play size={20} fill="black" /> {t['btn.start']}
                        </button>
                        
                        <button 
                            onClick={startPractice}
                            className="w-full bg-gray-800 text-red-400 font-bold py-3 rounded-xl border border-red-900/50 hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
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
                          <Skull size={64} className="text-red-500 mx-auto mb-4 md:w-20 md:h-20" />
                          <div className="text-7xl md:text-8xl font-black text-white">{score}</div>
                      </div>
                      <div className="space-y-4 flex flex-col items-center">
                          {/* Restart Button - Standard Click */}
                          <button 
                            onClick={startGame}
                            className="group relative bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 px-12 rounded-full transition-all overflow-hidden shadow-lg shadow-cyan-500/20"
                          >
                             <span className="text-lg">{t['btn.retry']}</span>
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