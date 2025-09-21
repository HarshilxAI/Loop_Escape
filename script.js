let showWarning = false;
let warningStartTime = 0;
let warningDuration = 2000; // 2 seconds

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");

const circle = {
    x: canvas.width/2,
    y: canvas.height/2,
    radius: 200,
    gapAngle: Math.PI/2, // 1/4 circle initially
    rotation: 0
};

let balls = [];
let escapedBalls = [];
let scorecards = [0,0,0];
let scoreActive = [true,false,false];
let escapeCount = 0;
let lastTime = 0;
let gameStarted = false;
let gamePaused = false;

// Countdown variables
let countdownNumber = 3;
let countdownActive = false;
let countdownStartTime = 0;

// Mouse control
let isDragging = false;
let previousMouseAngle = 0;

canvas.addEventListener("mousedown", e=>{
    if(!gameStarted || gamePaused) return;
    const rect = canvas.getBoundingClientRect();
    const dx = e.clientX - rect.left - circle.x;
    const dy = e.clientY - rect.top - circle.y;
    if(Math.sqrt(dx*dx + dy*dy) <= circle.radius){
        isDragging = true;
        previousMouseAngle = Math.atan2(dy,dx);
    }
});

canvas.addEventListener("mousemove", e=>{
    if(isDragging && !gamePaused){
        const rect = canvas.getBoundingClientRect();
        const dx = e.clientX - rect.left - circle.x;
        const dy = e.clientY - rect.top - circle.y;
        const angle = Math.atan2(dy,dx);
        circle.rotation += angle - previousMouseAngle;
        previousMouseAngle = angle;
    }
});

canvas.addEventListener("mouseup", ()=>isDragging=false);
canvas.addEventListener("mouseleave", ()=>isDragging=false);

// Start button
startBtn.addEventListener("click", ()=>{
    if(gameStarted || countdownActive) return;
    startBtn.style.display = "none";
    countdownNumber = 3;
    countdownActive = true;
    countdownStartTime = Date.now();
});

// Restart button
restartBtn.addEventListener("click", ()=>{
    balls = [];
    escapedBalls = [];
    scorecards = [0,0,0];
    scoreActive = [true,false,false];
    escapeCount = 0;
    lastTime = 0;
    gameStarted = false;
    countdownNumber = 3;
    countdownActive = false;
    countdownStartTime = 0;
    circle.gapAngle = Math.PI/2;
    gamePaused = false;

    // Update scoreboard display
    document.getElementById("score1").innerText = `Scorecard 1: 0s (1 ball)`;
    document.getElementById("score2").innerText = `Scorecard 2: 0s (2 balls)`;
    document.getElementById("score3").innerText = `Scorecard 3: 0s (3 balls)`;
    document.getElementById("ballsInside").innerText = "Balls Inside: 0";

    // Show start button
    startBtn.style.display = "inline-block";

    // Reset pause button
    pauseBtn.innerText = "🔒";
    pauseBtn.disabled = true;
});

// Pause button
pauseBtn.addEventListener("click", ()=>{
    if(balls.length >= 2){
        gamePaused = !gamePaused;
        pauseBtn.innerText = gamePaused ? "Resume" : "Pause";
    }
});

// Countdown draw
function drawCountdown(){
    if(!countdownActive) return;

    const elapsed = Date.now() - countdownStartTime;
    if(elapsed >= 1000){
        countdownNumber--;
        countdownStartTime = Date.now();
    }

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.font = "80px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    if(countdownNumber > 0){
        ctx.fillText(countdownNumber, circle.x, circle.y);
    } else if(countdownNumber === 0){
        ctx.fillText("Go!", circle.x, circle.y);
    } else {
        countdownActive = false;
        startGame();
    }
}

// Start the game
function startGame(){
    gameStarted = true;
    scoreActive[0] = true;
    lastTime = Date.now();
    balls.push(createBall(true));
    updatePauseButton();
}

// Create ball inside circle
function createBall(avoidGap=false){
    let angle;
    if(avoidGap){
        angle = Math.random() * (2*Math.PI - circle.gapAngle) + circle.rotation + circle.gapAngle/2;
    } else {
        angle = Math.random() * 2*Math.PI;
    }
    const speed = Math.random()*3 + 3;
    return {
        x: circle.x + Math.cos(angle)*(circle.radius/2),
        y: circle.y + Math.sin(angle)*(circle.radius/2),
        radius: 6, // smaller ball
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed
    };
}

// Normalize angles
function normalizeAngle(angle) {
    return (angle % (2*Math.PI) + 2*Math.PI) % (2*Math.PI);
}

// Check if angle is inside gap
function isAngleInGap(angle, gapStart, gapEnd){
    angle = normalizeAngle(angle);
    gapStart = normalizeAngle(gapStart);
    gapEnd = normalizeAngle(gapEnd);

    if (gapEnd < gapStart) {
        return (angle >= gapStart || angle <= gapEnd);
    }
    return angle >= gapStart && angle <= gapEnd;
}

// Draw circle with empty gap
function drawCircle(){
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, circle.rotation + circle.gapAngle, circle.rotation + 2*Math.PI);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.stroke();

    // Gap highlight
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, circle.rotation, circle.rotation+circle.gapAngle);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.stroke();
}

function drawBalls(){
    balls.forEach(ball=>{
        ctx.beginPath();
        ctx.arc(ball.x,ball.y,ball.radius,0,2*Math.PI);
        ctx.fillStyle="cyan";
        ctx.fill();
    });
    escapedBalls.forEach(ball=>{
        ctx.beginPath();
        ctx.arc(ball.x,ball.y,ball.radius,0,2*Math.PI);
        ctx.fillStyle="orange";
        ctx.fill();
    });
}

function updateBalls(){
    if(gamePaused) return;

    balls.forEach((ball,index)=>{
        ball.x += ball.vx;
        ball.y += ball.vy;

        const dx = ball.x - circle.x;
        const dy = ball.y - circle.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        let angle = Math.atan2(dy,dx);
        if(angle<0) angle+=2*Math.PI;

        const gapStart = circle.rotation;
        const gapEnd = circle.rotation+circle.gapAngle;

        if(dist+ball.radius>circle.radius){
            if(isAngleInGap(angle, gapStart, gapEnd)){
                // Ball escapes
                const escaped = balls.splice(index,1)[0];
                escapedBalls.push(escaped);
                balls.push(createBall());
                balls.push(createBall());
                escapeCount++;

                scoreActive[escapeCount-1] = false;
                if(escapeCount <= 3) scoreActive[escapeCount] = true;

                // SHRINK GAP AFTER ROUND
                if(escapeCount === 1){
                    circle.gapAngle = Math.PI/3;
                } else if(escapeCount === 2){
                    circle.gapAngle = Math.PI/4;
                }
            } else {
                // reflect off boundary with jitter
                const nx = dx/dist;
                const ny = dy/dist;
                const dot = ball.vx*nx + ball.vy*ny;
                ball.vx -= 2*dot*nx + (Math.random()*0.2 - 0.1);
                ball.vy -= 2*dot*ny + (Math.random()*0.2 - 0.1);
            }
        }
    });

    escapedBalls.forEach(ball=>{
        ball.x += ball.vx;
        ball.y += ball.vy;
    });

    updatePauseButton(); // update lock/unlock state
}

function updateScore(){
    const now = Date.now();
    scorecards.forEach((_,i)=>{
        if(scoreActive[i]){
            scorecards[i]+=(now-lastTime)/1000;
            document.getElementById(`score${i+1}`).innerText = `Scorecard ${i+1}: ${Math.floor(scorecards[i])}s`;
        }
    });
    lastTime = now;
    document.getElementById("ballsInside").innerText = "Balls Inside: "+balls.length;
}

// Update pause button state based on balls count
function updatePauseButton(){
    if(balls.length < 2){
        pauseBtn.innerText = "🔒";
        pauseBtn.disabled = true;
    } else {
        if(!gamePaused) pauseBtn.innerText = "Pause";
        pauseBtn.disabled = false;
    }
}

function gameLoop(){
    if(countdownActive){
        drawCountdown();
    } else if(gameStarted){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        drawCircle();
        drawBalls();
        updateBalls();
        updateScore();
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();
