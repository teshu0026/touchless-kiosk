import {
    HandLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

/**
 * Shared Kiosk Logic for Touchless Navigation
 * Handles MediaPipe initialization, gesture detection, cursor management, and interaction.
 */

export function initKiosk(options = {}) {
    const video = document.getElementById("webcam");
    const cursor = document.getElementById("cursor");
    const ringProgress = document.querySelector(".ring-progress");
    const notification = document.getElementById("notification");

    let handLandmarker = undefined;
    let webcamRunning = false;
    let lastVideoTime = -1;
    let results = undefined;

    // Interaction State
    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let targetX = cursorX;
    let targetY = cursorY;
    let isHovering = false;
    let hoverStartTime = 0;
    const HOVER_THRESHOLD_MS = 2000;
    let hoveredElement = null;
    let hasTriggeredOnElement = false;

    const createHandLandmarker = async () => {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });
        startWebcam();
    };

    const startWebcam = () => {
        if (!handLandmarker) return;
        const constraints = { video: { width: 1280, height: 720 } };
        navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predictWebcam);
            webcamRunning = true;
        });
    };

    async function predictWebcam() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (lastVideoTime !== video.currentTime) {
            lastVideoTime = video.currentTime;
            results = handLandmarker.detectForVideo(video, performance.now());
        }

        if (results.landmarks && results.landmarks.length > 0) {
            const landmark = results.landmarks[0][9]; // Middle Finger Base
            const x = (1 - landmark.x) * windowWidth;
            const y = landmark.y * windowHeight;
            targetX = x;
            targetY = y;
        }

        cursorX += (targetX - cursorX) * 0.1;
        cursorY += (targetY - cursorY) * 0.1;

        // Magnetic Snapping
        const interactiveElements = document.querySelectorAll(".interactive");
        let closestEl = null;
        let minDistance = 150;

        interactiveElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dist = Math.sqrt(Math.pow(cursorX - centerX, 2) + Math.pow(cursorY - centerY, 2));
            if (dist < minDistance) {
                minDistance = dist;
                closestEl = { x: centerX, y: centerY };
            }
        });

        if (closestEl) {
            cursorX += (closestEl.x - cursorX) * 0.1;
            cursorY += (closestEl.y - cursorY) * 0.1;
        }

        if (cursor) {
            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
        }

        checkInteractions();

        if (webcamRunning) {
            window.requestAnimationFrame(predictWebcam);
        }
    }

    function checkInteractions() {
        const interactiveElements = document.querySelectorAll(".interactive");
        let foundHover = false;

        interactiveElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (cursorX >= rect.left && cursorX <= rect.right && cursorY >= rect.top && cursorY <= rect.bottom) {
                foundHover = true;
                if (hoveredElement !== el) {
                    hoveredElement = el;
                    hoverStartTime = performance.now();
                    hasTriggeredOnElement = false;
                    el.classList.add("hovered");
                }
            } else {
                if (hoveredElement === el) {
                    el.classList.remove("hovered");
                    if (!foundHover) {
                        hoveredElement = null;
                        hasTriggeredOnElement = false;
                    }
                }
            }
        });

        if (!foundHover) {
            hoveredElement = null;
            isHovering = false;
            hasTriggeredOnElement = false;
            updateProgress(0);
        } else {
            isHovering = true;
            if (hasTriggeredOnElement) {
                updateProgress(1);
                return;
            }
            const elapsed = performance.now() - hoverStartTime;
            const progress = Math.min(elapsed / HOVER_THRESHOLD_MS, 1);
            updateProgress(progress);
            if (progress >= 1) {
                if (options.onTrigger) {
                    options.onTrigger(hoveredElement);
                }
                hasTriggeredOnElement = true;
            }
        }
    }

    function updateProgress(value) {
        const offset = 163 - (163 * value);
        if (ringProgress) ringProgress.style.strokeDashoffset = offset;
    }

    window.showNotification = function (msg) {
        if (!notification) return;
        notification.innerText = msg;
        notification.classList.remove("hidden");
        setTimeout(() => notification.classList.add("hidden"), 2000);
    };

    createHandLandmarker();
}
