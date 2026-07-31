let grid = [];

let onMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)
let size
if (!onMobile) size = 25
else size = Math.max(Math.floor(document.getElementById("gameOfLife").width / 12), 50)

let running = false;
let animationFrameId = null;
let simulationSpeed = 500;
let lastUpdateTime = 0;

let game = document.getElementById("gameOfLife").getContext("2d");
let canvas = document.getElementById("gameOfLife");
document.getElementById("gameOfLife").width = (window.innerWidth * .9) - ((window.innerWidth * .9) % size)
document.getElementById("gameOfLife").height = ((window.innerHeight - canvas.getBoundingClientRect().top) * .95) - (((window.innerHeight - canvas.getBoundingClientRect().top) * .95) % size)
let width = canvas.width;
let height = canvas.height;

window.addEventListener('resize', () => resize());

function resize(){
    if (!onMobile) size = 25
    else size = Math.max(Math.floor(document.getElementById("gameOfLife").width / 12), 50)

    document.getElementById("gameOfLife").width = (window.innerWidth * 0.9) - ((window.innerWidth * 0.9) % size);
    document.getElementById("gameOfLife").height = ((window.innerHeight - canvas.getBoundingClientRect().top) * 0.95) - (((window.innerHeight - canvas.getBoundingClientRect().top) * 0.95) % size);

    width = canvas.width;
    height = canvas.height;
    grid[0] = gridInit(width / size, height / size, true, grid[0]);
    drawGrid();
}

function draw(xCoordinate, yCoordinate, style, squareWidth, squareHeight = squareWidth) {
    game.fillStyle = style;
    game.fillRect(xCoordinate, yCoordinate, squareWidth, squareHeight);
}

function gridInit(w, h, softReset = false, previousGrid= []) {
    let grid = [];
    for (let i = 0; i < w; i++) {
        grid[i] = [];
        for (let j = 0; j < h; j++) {
            if(softReset && (previousGrid[i] !== undefined && previousGrid[i][j] !== undefined)) grid[i][j] = previousGrid[i][j]
            else grid[i][j] = 1
        }
    }
    return grid;
}

function create() {
    grid[0] = gridInit(width / size, height / size);
    grid[1] = gridInit(width / size, height / size);
    drawGrid();
}

function drawGrid() {
    game.clearRect(0, 0, width, height);
    draw(0, 0, getComputedStyle(document.documentElement).getPropertyValue('--firstColor') , width);
    for (let x = 0; x < width / size; x++) {
        for (let y = 0; y < height / size; y++) {
            if (grid[0][x][y] === 0) {
                draw(x * size, y * size, getComputedStyle(document.documentElement).getPropertyValue('--secondColor'), size);
            }
        }
    }
    for (let x = 0; x < width / size; x++) {
        if(x !== 0) draw(x * size, 0, getComputedStyle(document.documentElement).getPropertyValue('--fourthColor'), 1, height);
    }
    for (let y = 0; y < height / size; y++) {
        if(y !== 0) draw(0, y * size, getComputedStyle(document.documentElement).getPropertyValue('--fourthColor'), width, 1);
    }
}

function simulate(timestamp) {
    if (!running) return;

    if (timestamp - lastUpdateTime >= simulationSpeed) {
        // Run simulation step
        drawGrid();

        for (let x = 0; x < width / size; x++) {
            for (let y = 0; y < height / size; y++) {
                grid[1][x][y] = updateCell(x, y);
            }
        }

        grid[0] = JSON.parse(JSON.stringify(grid[1]));
        lastUpdateTime = timestamp;
    }

    animationFrameId = requestAnimationFrame(simulate);
}

function updateCell(x, y) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            let nx = x + dx;
            let ny = y + dy;
            if (nx >= 0 && nx < width / size && ny >= 0 && ny < height / size) {
                if (grid[0][nx][ny] === 0) count++;
            }
        }
    }
    if (count === 2 && grid[0][x][y] === 0) return 0;
    if (count === 3) return 0;
    return 1;
}

canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const gridX = Math.floor(mouseX / size);
    const gridY = Math.floor(mouseY / size);

    grid[0][gridX][gridY] = grid[0][gridX][gridY] === 0 ? 1 : 0;

    drawGrid();
});

function startSimulation() {
    if (!running) {
        running = true;
        requestAnimationFrame(simulate);
    }
}

function stopSimulation() {
    running = false;
    cancelAnimationFrame(animationFrameId);
}

function resetGrid() {
    stopSimulation();
    create();
}

function setSimulationSpeed(speed) {
    simulationSpeed = speed;
    document.getElementById("speedValue").textContent = speed;
}

resize()
document.getElementById("speed").value = simulationSpeed
document.getElementById("speedValue").textContent = simulationSpeed;
create();
