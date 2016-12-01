'use strict'

let canvas = document.getElementById('canvas'),
	// Visual size (in pixels)
	vW = window.innerWidth,
	vH = window.innerHeight,
	// Real size (in meters)
	rW = 25,
	rH = 12,
	cntxt = canvas.getContext('2d'),
	// Bot position
	bX = 0,
	bY = 0,
	// Bot angle (radians)
	bA = 0,
	// Bot size (a trapezoid, with bases bDimB1, bDimB2 and height bDimH)
	bDimB1 = 0.4,
	bDimB2 = 0.5,
	bDimH = 0.75,
	bGC = -(2 * bDimB1 * bDimH + bDimB2 * bDimH) / (3 * (bDimB1 + bDimB2)),
	// Bot wheel max speed (m/s)
	bS = 1,
	// Bot target
	bTX = 0,
	bTY = 0,
	// Bot move type: stop, angle or position
	bM = 'stop',
	// Tenis ball radius
	tBR = 0.0651 / 2,
	// List of balls in the ground
	// Array of {x, y}
	balls = [],
	// Grid for paths calc
	grid = make_grid(rW, rH, bDimB1/3, rW/2, rH/2)

canvas.width = vW
canvas.height = vH

// Get scale to fit real in visual
let prop = Math.min(vW / rW, vH / rH),
	lastFrame = Date.now()

// Transform to use meters as a unit and center at the center
cntxt.translate(vW / 2, vH / 2)
cntxt.scale(prop, -prop)

function draw() {

	grid.reset()

	let now = Date.now(),
		dt = (Date.now() - lastFrame) / 1e3
	cntxt.fillStyle = '#A44C48'
	cntxt.fillRect(-100, 100, 200, -200)

	// Draw background
	cntxt.lineWidth = 0.05
	cntxt.strokeStyle = 'black'
	cntxt.strokeRect(-23.77 / 2, 10.97 / 2, 23.77, -10.97)
	cntxt.fillStyle = '#6A9D7E'
	cntxt.fillRect(-23.77 / 2, 10.97 / 2, 23.77, -10.97)
	cntxt.beginPath()
	cntxt.moveTo(-23.77 / 2, 8.23 / 2)
	cntxt.lineTo(23.77 / 2, 8.23 / 2)
	cntxt.moveTo(-23.77 / 2, -4.115)
	cntxt.lineTo(23.77 / 2, -4.115)
	cntxt.moveTo(-6.4, -4.115)
	cntxt.lineTo(-6.4, 4.115)
	cntxt.moveTo(6.4, -4.115)
	cntxt.lineTo(6.4, 4.115)
	cntxt.moveTo(6.4, 0)
	cntxt.lineTo(-6.4, 0)
	cntxt.moveTo(0, 10.97 / 2 + 0.914)
	cntxt.lineTo(0, -10.97 / 2 - 0.914)
	cntxt.strokeStyle = '#EEEEEE'
	cntxt.stroke()

	// Draw balls
	for (let ball of balls) {
		cntxt.beginPath()
		cntxt.arc(ball.x, ball.y, 2 * tBR, 0, 2 * Math.PI)
		cntxt.fillStyle = '#c5d823'
		cntxt.fill()

		grid.add_ball(ball.x, ball.y)
	}

	// Draw bot
	cntxt.save()
	cntxt.translate(bX, bY)
	cntxt.rotate(bA)
	cntxt.beginPath()
	cntxt.moveTo(-bGC, bDimB2 / 2)
	cntxt.lineTo(-bDimH - bGC, bDimB1 / 2)
	cntxt.lineTo(-bDimH - bGC, -bDimB1 / 2)
	cntxt.lineTo(-bGC, -bDimB2 / 2)
	cntxt.lineTo(-bGC, bDimB2 / 2)
	cntxt.fillStyle = '#333'
	cntxt.fill()
	cntxt.restore()

	grid.place_robot(bX,bY)
	var ballPos
	var path	
	[ballPos, path] = grid.astar()
	var nextP
	nextP = path.length > 1 ? path[1] : path[0]

	if (bTX != nextP[0] || bTY != nextP[1]){
		bTX = nextP[0]
		bTY = nextP[1]
		bM = 'angle'
	}

	if (bTX == bX && bTY == bY){
	// Find closest ball
       		let bestBall = null,
               	bestDist = Infinity
       		for (let ball of balls) {
               		let dx = bX - ball.x,
                       	dy = bY - ball.y,
                       	dist = Math.sqrt(dx * dx + dy * dy)
               		if (dist < bestDist) {
                      		 bestDist = dist
                       		bestBall = ball
               		}
       		}
       		if (bestBall) {
                       // Grab it
                       balls.splice(balls.indexOf(bestBall), 1)
		}
	}

	// Update bot
	if (bM === 'angle') {
		let ang = Math.atan2(bTY - bY, bTX - bX),
			deltaAng = ang - bA
		if (deltaAng > Math.PI) {
			deltaAng = deltaAng - 2 * Math.PI
		} else if (deltaAng < -Math.PI) {
			deltaAng = deltaAng + 2 * Math.PI
		}
		let maxStep = bS / bDimB2 * dt
		if (Math.abs(deltaAng) > maxStep) {
			deltaAng = Math.sign(deltaAng) * maxStep
		}
		bA += deltaAng
		if (Math.abs(deltaAng) < 1e-4) {
			bM = 'position'
		}
	} else if (bM === 'position') {
		let dx = bTX - bX,
			dy = bTY - bY,
			ang = Math.atan2(dy, dx),
			ds = Math.min(bS * dt, Math.sqrt(dx * dx + dy * dy))
		bX += ds * Math.cos(ang)
		bY += ds * Math.sin(ang)
	}

	lastFrame = now
	requestAnimationFrame(draw)
}

requestAnimationFrame(draw)

canvas.onclick = event => {
	let targetRect = event.currentTarget.getBoundingClientRect(),
		left = event.clientX - targetRect.left,
		top = event.clientY - targetRect.top

	balls.push({
		x: (left - vW / 2) / prop,
		y: -(top - vH / 2) / prop
	})
}
