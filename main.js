import {
  HandLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";

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
const HOVER_THRESHOLD_MS = 1500; // Time to trigger click
let hoveredElement = null;

// Initialize MediaPipe HandLandmarker
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

// Enable Webcam
const startWebcam = () => {
  if (!handLandmarker) {
    console.log("Wait! objectDetector not loaded yet.");
    return;
  }

  const constraints = {
    video: {
      width: 1280,
      height: 720
    }
  };

  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
    webcamRunning = true;
  });
};

// Main Prediction Loop
async function predictWebcam() {
  // Update view dimensions
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime;
    results = handLandmarker.detectForVideo(video, performance.now());
  }

  if (results.landmarks && results.landmarks.length > 0) {
    // Get Index Finger Tip (Landmark 8)
    const indexTip = results.landmarks[0][8];
    
    // Convert to screen coordinates (Mirror functionality included)
    // MediaPipe x is 0 (left) to 1 (right). We mirror it by doing (1 - x).
    const x = (1 - indexTip.x) * windowWidth;
    const y = indexTip.y * windowHeight;

    // Smooth movement (Linear Interpolation)
    targetX = x;
    targetY = y;
  }
  
  // Apply smoothing
  cursorX += (targetX - cursorX) * 0.2;
  cursorY += (targetY - cursorY) * 0.2;

  // Update Cursor Position
  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`; // Centering handled in CSS translate(-50%, -50%) + absolute position logic? 
  // Wait, CSS says transform: translate(-50%, -50%); logic is handled there? 
  // No, we need to apply the position. 
  // Let's use left/top for position and transform for centering.
  cursor.style.left = `${cursorX}px`;
  cursor.style.top = `${cursorY}px`;

  checkInteractions();

  if (webcamRunning) {
    window.requestAnimationFrame(predictWebcam);
  }
}

// Interaction Logic (Collision Detection + Dwell)
function checkInteractions() {
  const interactiveElements = document.querySelectorAll(".interactive");
  let foundHover = false;

  interactiveElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    
    // Simple collision detection
    if (
      cursorX >= rect.left &&
      cursorX <= rect.right &&
      cursorY >= rect.top &&
      cursorY <= rect.bottom
    ) {
      foundHover = true;
      if (hoveredElement !== el) {
        // New hover
        hoveredElement = el;
        hoverStartTime = performance.now();
        el.classList.add("hovered");
      }
    } else {
      if (hoveredElement === el) {
        // Lost hover
        el.classList.remove("hovered");
        if (!foundHover) hoveredElement = null; // Only clear if we didn't find another one
      }
    }
  });

  if (!foundHover) {
    hoveredElement = null;
    isHovering = false;
    updateProgress(0);
  } else {
    isHovering = true;
    const elapsed = performance.now() - hoverStartTime;
    const progress = Math.min(elapsed / HOVER_THRESHOLD_MS, 1);
    
    updateProgress(progress);

    if (progress >= 1) {
      triggerClick(hoveredElement);
      hoverStartTime = performance.now(); // Reset to avoid rapid fire? Or stop?
      // For this demo, we'll reset but maybe we should wait until hover exit
      // To prevent multi-click, we can add a cooldown or require exit.
      // Simplest: just flash specific active class and reset
    }
  }
}

function updateProgress(value) {
  // max dash = 163
  const offset = 163 - (163 * value);
  ringProgress.style.strokeDashoffset = offset;
}

function triggerClick(el) {
    // Prevent rapid re-clicks
    if(el.classList.contains("active-click")) return;

    el.classList.add("active-click");
    setTimeout(() => el.classList.remove("active-click"), 200);

    const title = el.querySelector("h3").innerText;
    showNotification(`Opened ${title}`);
}

function showNotification(msg) {
  notification.innerText = msg;
  notification.classList.remove("hidden");
  setTimeout(() => {
    notification.classList.add("hidden");
  }, 2000);
}

// Kickoff
createHandLandmarker();
