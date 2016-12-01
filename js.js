/*global makeGrid*/
'use strict'

let canvas = document.getElementById('canvas'),
	// Visual size (in pixels)
	vW = window.innerWidth,
	vH = window.innerHeight,
	// Real size (in meters)
	rW = 25,
	rH = 12,
	oR = Math.sqrt(rW * rH) * 2 / 100,
	cntxt = canvas.getContext('2d'),
	// Bot position
	bX = -23.77 / 3,
	bY = 10.97 / 3,
	// Bot angle (radians)
	bA = 0,
	// Bot size (a trapezoid, with bases bDimB1, bDimB2 and height bDimH)
	bDimB1 = 0.4,
	bDimB2 = 0.5,
	bDimH = 0.75,
	bGC = -(2 * bDimB1 * bDimH + bDimB2 * bDimH) / (3 * (bDimB1 + bDimB2)),
	bR = 0.5,
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
	// {x,y r}
	obs = [],
	// Grid for paths calc
	grid = makeGrid(rW, rH, 0.25, rW / 2, rH / 2),
	// Cached path to follow
	path = null,
	// Cached original path to follow
	originalPath = null

canvas.width = vW
canvas.height = vH

// Get scale to fit real in visual
let prop = Math.min(vW / rW, vH / rH),
	lastFrame = Date.now()

// Transform to use meters as a unit and center at the center
cntxt.translate(vW / 2, vH / 2)
cntxt.scale(prop, -prop)

function draw() {
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

	// Draw obstacles
	grid.reset()
	for (let ob of obs) {
		cntxt.beginPath()
		cntxt.arc(ob.x, ob.y, 2 * ob.r, 0, 2 * Math.PI)
		cntxt.fillStyle = '#cccccc'
		cntxt.fill()

		grid.addObs(ob.x, ob.y, ob.r)
	}
	grid.addVerticalObs(0, -8.23 / 2, 8.23 / 2)

	grid.prepare(bR)

	// Draw balls
	for (let ball of balls) {
		cntxt.beginPath()
		cntxt.arc(ball.x, ball.y, 3 * tBR, 0, 2 * Math.PI)
		cntxt.fillStyle = '#d823d1'
		cntxt.fill()

		grid.addBall(ball.x, ball.y)
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

	grid.placeRobot(bX, bY)
	if (!path) {
		let [ballPos, newPath, newOriginalPath] = grid.astar()
		if (ballPos) {
			path = newPath
			originalPath = newOriginalPath
			if (path.length > 1) {
				path.shift()
			}
			let nextP = path.shift()
			bTX = nextP[0]
			bTY = nextP[1]
			bM = 'angle'
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
		if ((bX - bTX) * (bX - bTX) + (bY - bTY) * (bY - bTY) < ds * ds) {
			bX = bTX
			bY = bTY
		}
		if (Math.abs(ds) < 1e-4) {
			let nextP = path.shift()
			if (nextP) {
				bTX = nextP[0]
				bTY = nextP[1]
				bM = 'angle'
			} else {
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
					path = null
				}
				bM = 'stop'
			}
		}
	}

	lastFrame = now
	requestAnimationFrame(draw)
}

requestAnimationFrame(draw)

canvas.onclick = event => {
	let targetRect = event.currentTarget.getBoundingClientRect(),
		left = event.clientX - targetRect.left,
		topPos = event.clientY - targetRect.top
	if (!event.shiftKey) {
		balls.push({
			x: (left - vW / 2) / prop,
			y: -(topPos - vH / 2) / prop
		})
	} else {
		obs.push({
			x: (left - vW / 2) / prop,
			y: -(topPos - vH / 2) / prop,
			r: oR
		})
	}
	path = null
}