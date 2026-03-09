// --- 1. Dynamic Data & Media Mapping ---
const tracks = [
    { id: 1, title: "Deep Sleep Soundscape", file: "audio1.mp3", mediaType: "video", mediaFile: "vedio2.mp4" },
    { id: 2, title: "Morning Clarity Meditation", file: "audio2.mp3", mediaType: "video", mediaFile: "vedio1.mp4" },
    // Fixed file extensions to .jpg below to match your uploads
    { id: 3, title: "Rain & Distant Thunder", file: "audio3.mp3", mediaType: "image", mediaFile: "image4.png" },
    { id: 4, title: "Ocean Waves for Focus", file: "audio4.mp3", mediaType: "image", mediaFile: "image1.png" },
    { id: 5, title: "Anxiety Relief Guide", file: "audio5.mp3", mediaType: "image", mediaFile: "image5.png" }
];

let currentTrackIndex = -1;
let favorites = JSON.parse(localStorage.getItem('reliefFavorites')) || [];

// DOM Elements
const mainAudio = document.getElementById('main-audio');
const playPauseBtn = document.getElementById('play-pause-btn');
const trackTitleDisplay = document.getElementById('track-title');
const playlistContainer = document.getElementById('playlist-container');
const favBtn = document.getElementById('fav-btn');
const progressBar = document.getElementById('progress-bar');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const volumeSlider = document.getElementById('volume-slider');
const loopBtn = document.getElementById('loop-btn');

// Background Media Elements
const bgVideo = document.getElementById('bg-video');
const bgImage = document.getElementById('bg-image');

// --- Set Default Welcoming Background on Load ---
window.addEventListener('DOMContentLoaded', () => {
    // Randomly pick between the moon and the zen stones
    const defaultImages = ["image2.png", "image3.png"];
    const randomImg = defaultImages[Math.floor(Math.random() * defaultImages.length)];
    
    bgImage.src = randomImg;
    bgImage.classList.add('visible'); // Makes the image visible initially
});

updateStreak(); 

function renderPlaylist() {
    playlistContainer.innerHTML = '';
    tracks.forEach((track, index) => {
        const isFav = favorites.includes(track.id);
        const li = document.createElement('li');
        li.innerHTML = `<span>${index + 1}. ${track.title}</span> <span class="fav-indicator">${isFav ? '★' : ''}</span>`;
        li.onclick = () => loadTrack(index);
        playlistContainer.appendChild(li);
    });
}

// --- 2. Enhanced Audio Player & Dynamic Backgrounds ---
function loadTrack(index) {
    currentTrackIndex = index;
    const track = tracks[index];
    
    // Update Audio
    mainAudio.src = track.file;
    trackTitleDisplay.innerText = track.title;
    
    // Switch between image and video
    if (track.mediaType === "video") {
        bgImage.style.opacity = '0'; // Hide image
        bgImage.classList.remove('visible');
        if (!bgVideo.src.includes(track.mediaFile)) {
            bgVideo.src = track.mediaFile;
        }
        bgVideo.play().catch(e => console.log("Video autoplay prevented:", e));
        bgVideo.style.opacity = '1'; // Show video
    } else {
        bgVideo.style.opacity = '0'; // Hide video
        bgVideo.pause(); // Stop playing video in the background
        bgImage.src = track.mediaFile;
        bgImage.style.opacity = '1'; // Show image
        bgImage.classList.add('visible');
    }
    
    favBtn.style.display = "inline-block";
    updateFavButtonStatus();
    renderPlaylist(); 
    
    mainAudio.play();
    playPauseBtn.innerText = 'Pause';
    
    initVisualizer(); 
    incrementStreakAction(); 
}

function togglePlay() {
    if (currentTrackIndex === -1) {
        alert("Please select a track from the library first.");
        return;
    }
    if (mainAudio.paused) {
        mainAudio.play();
        playPauseBtn.innerText = 'Pause';
        initVisualizer();
    } else {
        mainAudio.pause();
        playPauseBtn.innerText = 'Play';
    }
}

function playNext() {
    if (currentTrackIndex === -1) return;
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= tracks.length) nextIndex = 0; 
    loadTrack(nextIndex);
}

mainAudio.addEventListener('ended', playNext);

// --- 3. Loop Feature Logic ---
let isLooping = false;
function toggleLoop() {
    isLooping = !isLooping;
    mainAudio.loop = isLooping;
    if (isLooping) {
        loopBtn.innerText = 'Loop: On';
        loopBtn.classList.add('active');
        loopBtn.classList.remove('outline');
    } else {
        loopBtn.innerText = 'Loop: Off';
        loopBtn.classList.remove('active');
        loopBtn.classList.add('outline');
    }
}

// --- 4. Progress Bar & Volume ---
function formatTime(seconds) {
    let min = Math.floor(seconds / 60);
    let sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

mainAudio.addEventListener('timeupdate', () => {
    if (mainAudio.duration) {
        const progressPercent = (mainAudio.currentTime / mainAudio.duration) * 100;
        progressBar.value = progressPercent;
        currentTimeDisplay.innerText = formatTime(mainAudio.currentTime);
        durationDisplay.innerText = formatTime(mainAudio.duration);
    }
});

progressBar.addEventListener('input', () => {
    const seekTime = (progressBar.value / 100) * mainAudio.duration;
    mainAudio.currentTime = seekTime;
});

volumeSlider.addEventListener('input', () => {
    mainAudio.volume = volumeSlider.value / 100;
});

// --- 5. Favorites System ---
function toggleFavorite() {
    const track = tracks[currentTrackIndex];
    const indexInFavs = favorites.indexOf(track.id);
    if (indexInFavs > -1) favorites.splice(indexInFavs, 1);
    else favorites.push(track.id);
    
    localStorage.setItem('reliefFavorites', JSON.stringify(favorites));
    updateFavButtonStatus();
    renderPlaylist();
}

function updateFavButtonStatus() {
    const track = tracks[currentTrackIndex];
    favBtn.innerText = favorites.includes(track.id) ? '💛' : '🤍';
}

renderPlaylist();

// --- 6. Audio Visualizer (Web Audio API) ---
let audioCtx, analyser, source;
const canvas = document.getElementById('visualizer');
const canvasCtx = canvas.getContext('2d');

function initVisualizer() {
    if(audioCtx) return; 
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(mainAudio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 64; 
    drawVisualizer();
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for(let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 4; 
        canvasCtx.fillStyle = `rgba(56, 189, 248, ${barHeight/50})`; 
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
    }
}

// --- 7. Sleep Timer with Fade Out ---
let sleepTimerId;
let fadeIntervalId;

document.getElementById('sleep-timer').addEventListener('change', (e) => {
    clearTimeout(sleepTimerId);
    clearInterval(fadeIntervalId);
    mainAudio.volume = volumeSlider.value / 100;

    const minutes = parseInt(e.target.value);
    if(minutes > 0) {
        const ms = minutes * 60 * 1000;
        const fadeDuration = 30000; 
        
        sleepTimerId = setTimeout(() => {
            startFadeOut();
        }, Math.max(0, ms - fadeDuration));
    }
});

function startFadeOut() {
    const steps = 30; 
    const volumeStep = mainAudio.volume / steps;
    
    fadeIntervalId = setInterval(() => {
        if(mainAudio.volume - volumeStep > 0) {
            mainAudio.volume -= volumeStep;
        } else {
            mainAudio.volume = 0;
            mainAudio.pause();
            playPauseBtn.innerText = 'Play';
            document.getElementById('sleep-timer').value = "0"; 
            clearInterval(fadeIntervalId);
        }
    }, 1000);
}

// --- 8. Daily Streaks ---
function updateStreak() {
    let streak = parseInt(localStorage.getItem('reliefStreak')) || 0;
    document.getElementById('streak-display').innerText = `🔥 ${streak} Day${streak !== 1 ? 's' : ''}`;
}

function incrementStreakAction() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('reliefLastDate');
    let streak = parseInt(localStorage.getItem('reliefStreak')) || 0;

    if (lastDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate === yesterday.toDateString()) {
            streak++;
        } else {
            streak = 1;
        }
        
        localStorage.setItem('reliefLastDate', today);
        localStorage.setItem('reliefStreak', streak);
        updateStreak();
    }
}

// --- 9. Dynamic Breathing Modes ---
let breathInterval;
let isBreathing = false;
let phase = 0; 
let timeLeft = 0;

const breathConfig = {
    box: { times: [4, 4, 4, 4], text: ["Inhale...", "Hold...", "Exhale...", "Hold..."], desc: "Inhale (4s) • Hold (4s) • Exhale (4s) • Hold (4s)" },
    relax: { times: [4, 7, 8, 0], text: ["Inhale...", "Hold...", "Exhale...", ""], desc: "Inhale (4s) • Hold (7s) • Exhale (8s)" }
};

let currentMode = 'box';
const breathCircle = document.getElementById('breath-circle');
const breathText = document.getElementById('breath-text');
const breathTimerDisplay = document.getElementById('breath-timer');
const breathBtn = document.getElementById('breath-btn');
const breathDesc = document.getElementById('breath-desc');

function changeBreathMode() {
    currentMode = document.getElementById('breath-mode').value;
    breathDesc.innerText = breathConfig[currentMode].desc;
    if(isBreathing) toggleBreathing(); 
}

function toggleBreathing() {
    if (isBreathing) {
        clearInterval(breathInterval);
        isBreathing = false;
        breathBtn.innerText = "Start Exercise";
        breathText.innerText = "Ready";
        breathTimerDisplay.innerText = "";
        breathCircle.style.transform = "scale(1)";
        return;
    }
    
    isBreathing = true;
    breathBtn.innerText = "Stop Exercise";
    phase = 0;
    timeLeft = breathConfig[currentMode].times[0];
    
    incrementStreakAction(); 
    executeBreathStep(); 
    breathInterval = setInterval(executeBreathStep, 1000); 
}

function executeBreathStep() {
    if (timeLeft <= 0) {
        let nextPhase = phase;
        do {
            nextPhase = (nextPhase + 1) % 4;
        } while (breathConfig[currentMode].times[nextPhase] === 0);
        
        phase = nextPhase;
        timeLeft = breathConfig[currentMode].times[phase];
        
        if (phase === 0) { 
            breathCircle.style.transform = "scale(1.5)";
            breathCircle.style.background = "radial-gradient(circle at center, rgba(56, 189, 248, 0.4) 0%, transparent 70%)";
        } else if (phase === 2) { 
            breathCircle.style.transform = "scale(1)";
            breathCircle.style.background = "radial-gradient(circle at center, rgba(56, 189, 248, 0.2) 0%, transparent 70%)";
        }
    }
    
    breathText.innerText = breathConfig[currentMode].text[phase];
    breathTimerDisplay.innerText = timeLeft;
    timeLeft--;
}

window.addEventListener('keydown', (e) => {
    if (e.code === "Space" && e.target === document.body) {
        e.preventDefault(); 
        togglePlay();
    }
});

// --- 10. Full Screen Media Feature ---
function toggleFullScreen() {
    if (currentTrackIndex === -1) {
        alert("Please select a track first to view its background in full screen.");
        return;
    }
    
    const track = tracks[currentTrackIndex];
    const mediaElement = track.mediaType === "video" ? bgVideo : bgImage;
    
    if (!document.fullscreenElement) {
        mediaElement.requestFullscreen().catch(err => {
            alert(`Error attempting to enable fullscreen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
}