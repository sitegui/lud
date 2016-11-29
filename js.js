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
	// Bot size
	bL = 0.35,
	// Tenis ball radius
	tBR = 0.0651 / 2,
	// List of balls in the ground
	// Array of {x, y}
	balls = []

canvas.width = vW
canvas.height = vH

// Get scale to fit real in visual
let prop = Math.min(vW / rW, vH / rH)

// Transform to use meters as a unit and center at the center
cntxt.translate(vW / 2, vH / 2)
cntxt.scale(prop, -prop)

function draw() {
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

	// Draw bot
	cntxt.save()
	cntxt.translate(bX, bY)
	cntxt.rotate(bA)
	cntxt.beginPath()
	cntxt.moveTo(0, 0.75 * bL)
	cntxt.lineTo(-2 * bL, 0.3 * bL)
	cntxt.lineTo(-2 * bL, -0.3 * bL)
	cntxt.lineTo(0, -0.75 * bL)
	cntxt.lineTo(0, 0.75 * bL)
	cntxt.fillStyle = 'black'
	cntxt.fill()
	cntxt.restore()

	// Draw balls
	for (let ball of balls) {
		cntxt.beginPath()
		cntxt.arc(ball.x, ball.y, 2 * tBR, 0, 2 * Math.PI)
		cntxt.fillStyle = '#D6EC1B'
		cntxt.fill()
	}

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

	// Go for it
	if (bestBall) {
		if (bestDist < 0.1) {
			// Grab it
			balls.splice(balls.indexOf(bestBall), 1)
		} else {
			let ang = Math.atan2(bestBall.y - bY, bestBall.x - bX),
				v = Math.min(1, bestDist)
			bX += v * Math.cos(ang)
			bY += v * Math.sin(ang)
			bA = ang
		}
	}
}

setInterval(draw, 1e3)

canvas.onclick = event => {
	let targetRect = event.currentTarget.getBoundingClientRect(),
		left = event.clientX - targetRect.left,
		top = event.clientY - targetRect.top

	balls.push({
		x: (left - vW / 2) / prop,
		y: -(top - vH / 2) / prop
	})
}