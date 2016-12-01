'use strict'

let canvas = document.getElementById('canvas'),
	canvas2 = document.getElementById('canvas2'),
	video = document.createElement('video'),
	cntxt = canvas.getContext('2d'),
	cntxt2 = canvas2.getContext('2d'),
	A = [80, 80],
	B = [160, 80],
	C = [160, 160],
	D = [80, 160],
	anchors = [A, B, C, D],
	dragging = null,
	pixels = null,
	playing = true,
	img = new Image,
	useWebCam = true

img.src = 'canvas.jpeg'

if (useWebCam) {
	navigator.mediaDevices.getUserMedia({
		video: true
	}).then(stream => {
		video.srcObject = stream
		video.onloadedmetadata = () => {
			canvas.width = video.videoWidth / 2
			canvas.height = video.videoHeight / 2
			canvas.style.width = video.videoWidth + 'px'
			canvas.style.height = video.videoHeight + 'px'
			video.play()
			playing = true
		}
	})
} else {
	img.onload = () => {
		canvas.width = img.width / 2
		canvas.height = img.height / 2
		canvas.style.width = img.width + 'px'
		canvas.style.height = img.height + 'px'
		playing = true
	}
}

document.getElementById('playPause').onclick = () => {
	playing = !playing
	if (playing) {
		video.play()
	} else {
		video.pause()
	}
}

function draw() {
	// Update original canvas
	cntxt.drawImage(useWebCam ? video : img, 0, 0, canvas.width, canvas.height)

	// Update boundaries
	let originalPixels = cntxt.getImageData(0, 0, canvas.width, canvas.height),
		originalPixelsData = originalPixels.data,
		i = 0
	let minGray = Infinity,
		maxGray = -Infinity
	for (let j = 0; j < originalPixelsData.length; j += 4) {
		let gray = Math.pow(originalPixelsData[j] * originalPixelsData[j + 1] * originalPixelsData[j + 2], 1 / 3)
		originalPixelsData[j] =
			originalPixelsData[j + 1] =
			originalPixelsData[j + 2] = gray
		minGray = Math.min(minGray, gray)
		maxGray = Math.max(maxGray, gray)
	}
	for (let j = 0; j < originalPixelsData.length; j += 4) {
		let gray = 255 * (originalPixelsData[j] - minGray) / (maxGray - minGray)
		originalPixelsData[j] =
			originalPixelsData[j + 1] =
			originalPixelsData[j + 2] = 256 / (1 + Math.exp(-(gray - 128) / 10))
	}
	let stack = [4 * ((canvas.width >> 1) + (canvas.height >> 1) * canvas.width)],
		points = [],
		maxX = -Infinity,
		maxY = -Infinity,
		minX = Infinity,
		minY = Infinity
	while (stack.length) {
		let i = stack.pop()

		if (i < 0 ||
			i >= originalPixelsData.length ||
			!originalPixelsData[i + 3]) {
			continue
		}
		originalPixelsData[i + 3] = 0
		if (originalPixelsData[i] < 200) {
			continue
		}

		let x = (i / 4) % canvas.width,
			y = ((i / 4) - x) / canvas.width
		maxX = Math.max(maxX, x)
		minX = Math.min(minX, x)
		maxY = Math.max(maxY, y)
		minY = Math.min(minY, y)
		points.push([x, y])
		stack.push(i + 4 * canvas.width) // south
		stack.push(i - 4 * canvas.width) // north
		stack.push(i + 4) // west
		stack.push(i - 4) // east
	}
	let middleX = (minX + maxX) / 2,
		middleY = (minY + maxY) / 2,
		distCorners = [-Infinity, -Infinity, -Infinity, -Infinity]
	console.log(points.length)
	for (let [x, y] of points) {
		let dx = x - middleX,
			dy = y - middleY,
			dist = Math.sqrt(dx * dx + dy * dy),
			ang = Math.atan2(dy, dx)
		if (ang > Math.PI * (1 / 7) && ang < Math.PI * (1 / 2 - 1 / 7)) {
			// First quadrant
			if (dist > distCorners[0]) {
				distCorners[0] = dist
				C[0] = x
				C[1] = y
			}
		} else if (ang > Math.PI * (1 / 2 + 1 / 7) && ang < Math.PI * (1 - 1 / 7)) {
			// Second quadrant
			if (dist > distCorners[1]) {
				distCorners[1] = dist
				D[0] = x
				D[1] = y
			}
		} else if (ang < -Math.PI * (1 / 2 + 1 / 7) && ang > -Math.PI * (1 - 1 / 7)) {
			// Third quadrant
			if (dist > distCorners[2]) {
				distCorners[2] = dist
				A[0] = x
				A[1] = y
			}
		} else if (ang < -Math.PI * (1 / 7) && ang > -Math.PI * (1 / 2 - 1 / 7)) {
			// Fourth quadrant
			if (dist > distCorners[3]) {
				distCorners[3] = dist
				B[0] = x
				B[1] = y
			}
		}
	}
	updatePixels()
	originalPixels = cntxt.getImageData(0, 0, canvas.width, canvas.height)
	originalPixelsData = originalPixels.data

	// Map pixels
	if (pixels) {
		let pixelsData = pixels.data,
			w = pixels.width,
			h = pixels.height,
			kx = A[0],
			ky = A[1],
			ktx = B[0] - A[0],
			kty = B[1] - A[1],
			kux = D[0] - A[0],
			kuy = D[1] - A[1],
			ktux = A[0] - B[0] + C[0] - D[0],
			ktuy = A[1] - B[1] + C[1] - D[1]

		for (let y = 0; y < h; y++) {
			let u = y / h
			for (let x = 0; x < w; x++) {
				let t = x / w

				let px = (kx + ktx * t + kux * u + ktux * t * u) | 0,
					py = (ky + kty * t + kuy * u + ktuy * t * u) | 0,
					originalI = 4 * (py * canvas.width + px)
				pixelsData[i] = originalPixelsData[originalI]
				pixelsData[i + 1] = originalPixelsData[originalI + 1]
				pixelsData[i + 2] = originalPixelsData[originalI + 2]
				i += 4
			}
		}
		cntxt2.putImageData(pixels, 0, 0)
	}

	// Draw four-side polygonon
	cntxt.beginPath()
	cntxt.strokeStyle = 'black'
	cntxt.moveTo(A[0], A[1])
	cntxt.lineTo(B[0], B[1])
	cntxt.lineTo(C[0], C[1])
	cntxt.lineTo(D[0], D[1])
	cntxt.lineTo(A[0], A[1])
	cntxt.stroke()

	// Draw anchors
	cntxt.fillStyle = 'black'
	cntxt.beginPath()
	for (let anchor of anchors) {
		cntxt.beginPath()
		cntxt.arc(anchor[0], anchor[1], 3, 0, 2 * Math.PI)
		cntxt.fill()
	}

	// Next frame
	requestAnimationFrame(draw)
}

canvas.onmousedown = event => {
	let targetRect = event.currentTarget.getBoundingClientRect(),
		x = (event.clientX - targetRect.left) / 2,
		y = (event.clientY - targetRect.top) / 2,
		bestDist = Infinity

	for (let anchor of anchors) {
		let dist = getDist(anchor, [x, y])
		if (dist < 10 && dist < bestDist) {
			bestDist = dist
			dragging = anchor
		}
	}
}

canvas.onmousemove = event => {
	if (!dragging) {
		return
	}

	let targetRect = event.currentTarget.getBoundingClientRect(),
		x = (event.clientX - targetRect.left) / 2,
		y = (event.clientY - targetRect.top) / 2

	// Update anchor
	dragging[0] = x
	dragging[1] = y

	updatePixels()
}

canvas.onmouseup = canvas.onmouseout = () => dragging = null

function getDist(a, b) {
	let dx = a[0] - b[0],
		dy = a[1] - b[1]
	return Math.sqrt(dx * dx + dy * dy)
}

function updatePixels() {
	// Update final rectangle size
	canvas2.width = (getDist(A, B) + getDist(C, D)) / 2
	canvas2.height = (getDist(A, D) + getDist(B, C)) / 2
	canvas2.style.width = (2 * canvas2.width) + 'px'
	canvas2.style.height = (2 * canvas2.height) + 'px'
	cntxt2.fillStyle = 'white'
	cntxt2.fillRect(0, 0, canvas2.width, canvas2.height)
	pixels = cntxt2.getImageData(0, 0, canvas2.width, canvas2.height)
}

updatePixels()
requestAnimationFrame(draw)