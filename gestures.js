// gestures.js — Hand gesture recognition via MediaPipe Hands
// Detects: fist (zoom in), open hand (zoom out), swish left/right (page turn)

(function () {
    'use strict';

    // ── Configuration ────────────────────────────────────────────────────────────
    const COOLDOWN_ZOOM = 1500;      // ms between zoom actions
    const COOLDOWN_PAGE = 1000;      // ms between page turns
    const DEBOUNCE_HOLD = 300;       // ms gesture must be held before triggering
    const SWISH_VELOCITY = 0.035;    // lowered significantly for slow hand movement sensitivity
    const SWISH_FRAMES = 2;          // lowered to 2 for nearly instant response
    const DETECTION_FPS = 20;        // increased for smoother tracking

    // ── State ────────────────────────────────────────────────────────────────────
    let handLandmarker = null;
    let video = null;
    let running = false;
    let callbacks = {};
    let lastDetectionTime = 0;

    // Cooldown timestamps
    let lastZoomTime = 0;
    let lastPageTime = 0;

    // Debounce state
    let fistStartTime = 0;
    let openStartTime = 0;
    let fistTriggered = false;
    let openTriggered = false;

    // Swish tracking
    let wristHistory = [];           // [{x, t}, ...] last N frames

    // UI elements
    let camPreview = null;
    let gestureIcon = null;
    let toggleBtn = null;
    let camContainer = null;
    let handDetected = false;

    // ── Landmark helpers ─────────────────────────────────────────────────────────
    function dist(a, b) {
        const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z || 0) - (b.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function isFingerCurled(landmarks, tipIdx, mcpIdx) {
        const wrist = landmarks[0];
        const tip = landmarks[tipIdx];
        const mcp = landmarks[mcpIdx];
        return dist(tip, wrist) < dist(mcp, wrist) * 1.15;
    }

    function isFingerExtended(landmarks, tipIdx, mcpIdx) {
        const wrist = landmarks[0];
        const tip = landmarks[tipIdx];
        const mcp = landmarks[mcpIdx];
        return dist(tip, wrist) > dist(mcp, wrist) * 1.2;
    }

    // ── Gesture detection ────────────────────────────────────────────────────────
    function detectFist(landmarks) {
        // All 4 fingers curled + thumb curled
        const indexCurled = isFingerCurled(landmarks, 8, 5);
        const middleCurled = isFingerCurled(landmarks, 12, 9);
        const ringCurled = isFingerCurled(landmarks, 16, 13);
        const pinkyCurled = isFingerCurled(landmarks, 20, 17);
        // Thumb: tip closer to wrist than IP joint
        const thumbCurled = dist(landmarks[4], landmarks[0]) < dist(landmarks[3], landmarks[0]) * 1.1;
        return indexCurled && middleCurled && ringCurled && pinkyCurled && thumbCurled;
    }

    function detectOpenHand(landmarks) {
        // All 5 digits extended
        const indexExt = isFingerExtended(landmarks, 8, 5);
        const middleExt = isFingerExtended(landmarks, 12, 9);
        const ringExt = isFingerExtended(landmarks, 16, 13);
        const pinkyExt = isFingerExtended(landmarks, 20, 17);
        const thumbExt = isFingerExtended(landmarks, 4, 2);
        return indexExt && middleExt && ringExt && pinkyExt && thumbExt;
    }

    function detectTwoFingers(landmarks) {
        // Index and Middle fingers extended, others curled
        const indexExt = isFingerExtended(landmarks, 8, 5);
        const middleExt = isFingerExtended(landmarks, 12, 9);
        const ringCurled = isFingerCurled(landmarks, 16, 13);
        const pinkyCurled = isFingerCurled(landmarks, 20, 17);

        if (indexExt && middleExt && ringCurled && pinkyCurled) {
            // Relaxed tolerance so the gesture isn't dropped mid-swish if fingers spread slightly
            const tipDist = dist(landmarks[8], landmarks[12]);
            const mcpDist = dist(landmarks[12], landmarks[9]);
            return tipDist < mcpDist * 0.8;
        }
        return false;
    }

    let lastWristX = 0.5; // Normalized center

    function detectSwish(landmarks) {
        const now = performance.now();
        const wristX = landmarks[0].x; // Normalized 0-1 (flipped because of camera)
        
        // threshold values (normalized)
        const CENTER_ZONE_L = 0.4;
        const CENTER_ZONE_R = 0.6;
        
        let result = null;
        
        // Logic: Hand must start in center and cross a boundary
        if (lastWristX > CENTER_ZONE_L && lastWristX < CENTER_ZONE_R) {
            if (wristX < CENTER_ZONE_L) result = 'left';
            if (wristX > CENTER_ZONE_R) result = 'right';
        }
        
        lastWristX = wristX;
        return result;
    }

    // ── Process landmarks each frame ─────────────────────────────────────────────
    function processLandmarks(landmarks) {
        const now = performance.now();

        // Update hand-detected glow
        if (!handDetected) {
            handDetected = true;
            if (camContainer) camContainer.classList.add('hand-detected');
        }

        // ── Fist detection with debounce ──
        if (detectFist(landmarks)) {
            if (fistStartTime === 0) fistStartTime = now;
            if (!fistTriggered && now - fistStartTime >= DEBOUNCE_HOLD) {
                if (now - lastZoomTime >= COOLDOWN_ZOOM) {
                    fistTriggered = true;
                    lastZoomTime = now;
                    wristHistory = []; // Clear swish buffer
                    showGestureIndicator('✊');
                    if (callbacks.onFist) callbacks.onFist();
                }
            }
            // Reset state for other gestures
            openStartTime = 0;
            openTriggered = false;
            return; // Fist takes priority
        } else {
            fistStartTime = 0;
            fistTriggered = false;
        }

        // ── Swish detection (now prioritized when Index+Middle are together) ──
        if (detectTwoFingers(landmarks)) {
            const swish = detectSwish(landmarks);
            if (swish && now - lastPageTime >= COOLDOWN_PAGE) {
                lastPageTime = now;
                wristHistory = []; // Clear after trigger
                openStartTime = 0; // Reset open-hand debounce
                openTriggered = false;
                if (swish === 'right') {
                    showGestureIndicator('👉');
                    if (callbacks.onSwishRight) callbacks.onSwishRight();
                } else {
                    showGestureIndicator('👈');
                    if (callbacks.onSwishLeft) callbacks.onSwishLeft();
                }
                return;
            }
        } else {
            // Still track swish in history, but only trigger when gesture matches
            detectSwish(landmarks);
        }

        // ── Open hand detection with debounce (only if not swishing) ──
        if (detectOpenHand(landmarks)) {
            if (openStartTime === 0) openStartTime = now;
            if (!openTriggered && now - openStartTime >= DEBOUNCE_HOLD) {
                if (now - lastZoomTime >= COOLDOWN_ZOOM) {
                    openTriggered = true;
                    lastZoomTime = now;
                    wristHistory = []; // Clear swish buffer
                    showGestureIndicator('🖐');
                    if (callbacks.onOpenHand) callbacks.onOpenHand();
                }
            }
        } else {
            openStartTime = 0;
            openTriggered = false;
        }
    }

    // ── Visual feedback ──────────────────────────────────────────────────────────
    let iconTimeout = null;
    function showGestureIndicator(emoji) {
        if (!gestureIcon) return;
        gestureIcon.textContent = emoji;
        gestureIcon.style.opacity = '1';
        gestureIcon.style.transform = 'translate(-50%, -50%) scale(1.2)';
        clearTimeout(iconTimeout);
        setTimeout(() => {
            gestureIcon.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 150);
        iconTimeout = setTimeout(() => {
            gestureIcon.style.opacity = '0';
        }, 1200);
    }

    // ── Detection loop ───────────────────────────────────────────────────────────
    function detectLoop() {
        if (!running || !handLandmarker || !video || video.readyState < 2) {
            if (running) requestAnimationFrame(detectLoop);
            return;
        }

        const now = performance.now();
        // Throttle detection to target FPS
        if (now - lastDetectionTime < 1000 / DETECTION_FPS) {
            requestAnimationFrame(detectLoop);
            return;
        }
        lastDetectionTime = now;

        try {
            const results = handLandmarker.detectForVideo(video, now);
            if (results && results.landmarks && results.landmarks.length > 0) {
                processLandmarks(results.landmarks[0]);
            } else {
                // No hand detected
                if (handDetected) {
                    handDetected = false;
                    if (camContainer) camContainer.classList.remove('hand-detected');
                }
                fistStartTime = 0;
                fistTriggered = false;
                openStartTime = 0;
                openTriggered = false;
                wristHistory = [];
            }
        } catch (e) {
            // Silently ignore detection errors
        }

        requestAnimationFrame(detectLoop);
    }

    // ── Build UI elements ────────────────────────────────────────────────────────
    function buildUI() {
        // Camera container
        camContainer = document.createElement('div');
        camContainer.id = 'gesture-cam';
        camContainer.innerHTML = `
            <video id="gesture-video" autoplay playsinline muted></video>
            <div id="gesture-toggle" title="Toggle camera">🎥</div>
        `;
        document.body.appendChild(camContainer);

        // Gesture indicator
        gestureIcon = document.createElement('div');
        gestureIcon.id = 'gesture-indicator';
        document.body.appendChild(gestureIcon);

        video = document.getElementById('gesture-video');
        toggleBtn = document.getElementById('gesture-toggle');

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const v = document.getElementById('gesture-video');
            if (v.style.display === 'none') {
                v.style.display = 'block';
                camContainer.classList.add('cam-visible');
            } else {
                v.style.display = 'none';
                camContainer.classList.remove('cam-visible');
            }
        });

        // Inject styles
        const style = document.createElement('style');
        style.textContent = `
            #gesture-cam {
                position: fixed;
                bottom: 80px;
                left: 18px;
                z-index: 600;
                border-radius: 8px;
                overflow: hidden;
                background: rgba(10, 5, 0, 0.85);
                border: 1.5px solid rgba(243, 236, 217, 0.15);
                transition: border-color 0.4s, box-shadow 0.4s;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            #gesture-cam.cam-visible {
                padding-bottom: 0;
            }
            #gesture-cam.hand-detected {
                border-color: rgba(200, 170, 80, 0.6);
                box-shadow: 0 0 18px rgba(200, 170, 80, 0.25);
            }
            #gesture-cam video {
                width: 160px;
                height: 120px;
                object-fit: cover;
                display: block;
                opacity: 0.75;
                transform: scaleX(-1);
                border-radius: 6px 6px 0 0;
            }
            #gesture-toggle {
                padding: 4px 10px;
                cursor: pointer;
                font-size: 14px;
                color: #f3ecd9;
                opacity: 0.6;
                transition: opacity 0.2s;
                user-select: none;
                text-align: center;
                width: 100%;
            }
            #gesture-toggle:hover {
                opacity: 1;
            }
            #gesture-indicator {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(1);
                font-size: 64px;
                z-index: 700;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease, transform 0.15s ease;
                filter: drop-shadow(0 4px 20px rgba(0,0,0,0.7));
            }
        `;
        document.body.appendChild(style);
    }

    // ── Initialize ───────────────────────────────────────────────────────────────
    async function initGestures(cbs) {
        callbacks = cbs || {};
        buildUI();

        // Request webcam
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 320, height: 240, facingMode: 'user' }
            });
        } catch (err) {
            console.warn('[Gestures] Camera access denied or unavailable. Gesture control disabled.');
            if (camContainer) camContainer.style.display = 'none';
            return false;
        }

        video.srcObject = stream;
        await video.play();

        // Load MediaPipe
        try {
            // Poll for MediaPipeVision to be ready (it loads as a module in index.html)
            let attempts = 0;
            while (!window.MediaPipeVision && attempts < 20) {
                await new Promise(r => setTimeout(r, 100));
                attempts++;
            }

            if (!window.MediaPipeVision) throw new Error('MediaPipe loading timed out');

            const { HandLandmarker, FilesetResolver } = window.MediaPipeVision;

            const filesetResolver = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
            );

            handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
                    delegate: 'GPU'
                },
                runningMode: 'VIDEO',
                numHands: 1,
                minHandDetectionConfidence: 0.6,
                minHandPresenceConfidence: 0.6,
                minTrackingConfidence: 0.5
            });

            running = true;
            detectLoop();
            console.log('[Gestures] Hand gesture control initialized.');
            return true;
        } catch (err) {
            console.warn('[Gestures] MediaPipe failed to load. Gesture control disabled.', err);
            if (camContainer) {
                const errMsg = document.createElement('div');
                errMsg.style.cssText = 'padding:6px 10px;color:#f3ecd9;font-size:9px;opacity:0.5;font-family:sans-serif;text-align:center;';
                errMsg.textContent = 'Gesture detection unavailable';
                camContainer.insertBefore(errMsg, toggleBtn);
            }
            return false;
        }
    }

    function stopGestures() {
        running = false;
    }

    function startGestures() {
        if (handLandmarker && video) {
            running = true;
            detectLoop();
        }
    }

    function isGestureActive() {
        return running;
    }

    // ── Expose public API ────────────────────────────────────────────────────────
    window.GestureControl = {
        init: initGestures,
        start: startGestures,
        stop: stopGestures,
        isActive: isGestureActive
    };
})();
