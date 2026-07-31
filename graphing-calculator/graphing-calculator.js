let canvas = document.getElementById("graph");
canvas.width = window.innerWidth * 0.9;
canvas.height = window.innerHeight * 0.8;
let firstColor = getComputedStyle(document.documentElement).getPropertyValue('--firstColor');
let secondColor = getComputedStyle(document.documentElement).getPropertyValue('--secondColor');
let thirdColor = getComputedStyle(document.documentElement).getPropertyValue('--thirdColor');
let ctx = canvas.getContext('2d');
let textBox = document.getElementById("equation");

let zeroX = Math.floor(canvas.width / 2);
let zeroY = Math.floor(canvas.height / 2);

let scale = 50
let lineWidth = 3

function evaluate(x) {
    let equation = textBox.value;
    equation = equation.replaceAll(/\bsin\b/g, "Math.sin");
    equation = equation.replaceAll(/\bcos\b/g, "Math.cos");
    equation = equation.replaceAll(/\btan\b/g, "Math.tan");
    equation = equation.replaceAll(/\barcsin\b/g, "Math.asin");
    equation = equation.replaceAll(/\barccos\b/g, "Math.acos");
    equation = equation.replaceAll(/\barctan\b/g, "Math.atan");
    equation = equation.replaceAll(/\bcsc\b/g, "1/Math.sin");
    equation = equation.replaceAll(/\bsec\b/g, "1/Math.cos");
    equation = equation.replaceAll(/\bcot\b/g, "1/Math.tan");
    equation = equation.replaceAll(/\^/g, '**');
    equation = equation.replaceAll(/\blog\b/g, "Math.log10");
    equation = equation.replaceAll(/\bln\b/g, "Math.log");

    try {
        let result = Function("x", `return ${equation}`)(x);
        if (isNaN(result) || !isFinite(result)) return null;
        else return result;
    } catch {
        return null;
    }
}

function drawLine(x1, y1, x2, y2) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = secondColor;
    ctx.fillStyle = secondColor;
    ctx.alpha = 1
    ctx.beginPath();
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
}
function drawGrid(){
    ctx.lineWidth = 1
    ctx.strokeStyle = thirdColor;
    ctx.alpha = 1
    ctx.beginPath();
    ctx.moveTo(zeroX,0);
    ctx.lineTo(zeroX,canvas.height);
    ctx.stroke();
    ctx.beginPath()
    ctx.moveTo(0, zeroY);
    ctx.lineTo(canvas.width, zeroY)
    ctx.stroke()
}

function graph() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid()
    for (let x = -zeroX - 1; x <= zeroX; x++) {
        let y = evaluate(x / scale);
        if (y === null) continue;
        let pixelX = x + zeroX;
        let pixelY = -y * scale + zeroY;
        let nextY = evaluate((x + 1) / scale);
        if (nextY === null) continue;
        let nextPixelX = x + 1 + zeroX;
        let nextPixelY = -nextY * scale + zeroY;
        if (pixelY >= 0 && pixelY < canvas.height) {
            drawLine(pixelX, pixelY, nextPixelX, nextPixelY);
        }
    }
}

function setScale(s){
    scale = s
    graph()
}

textBox.addEventListener("input", () => graph());
graph();
