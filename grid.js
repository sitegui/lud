'use strict'

function makeGrid(sizex, sizey, unitSize, centerx = 0, centery = 0) {
	let gxsize = Math.floor(sizex / unitSize) + 1
	let gysize = Math.floor(sizey / unitSize) + 1
	let grid = new Array(gxsize)
	for (let i = 0; i < gxsize; i++) {
		grid[i] = new Array(gysize)
		for (let j = 0; j < gysize; j++) {
			grid[i][j] = 0
		}
	}

	grid.sizex = sizex
	grid.sizey = sizey
	grid.center = [centerx, centery]
	grid.unitSize = unitSize
	grid.r = 0

	grid.addObs = function (posx, posy, r) {
		posx = posx + this.center[0]
		posy = posy + this.center[1]
		let x = Math.round(posx / this.unitSize)
		let y = Math.round(posy / this.unitSize)
		let d = Math.ceil(r / this.unitSize)
		for (let i = -d; i <= d; i++) {
			for (let j = -d; j <= d; j++) {
				if ((i + x >= 0) && (i + x < this.length)) {
					if ((j + y >= 0) && (j + y < this[i + x].length)) {
						if (i * i + j * j <= d * d) {
							this[i + x][j + y] = 1
						}
					}
				}
			}
		}
	}

	grid.show = function () {
		for (let i = 0; i < this.length; i++) {
			let s = ''
			for (let j = 0; j < this[i].length; j++) {
				s = s + this[i][j] + ' '
			}
			console.log(s)
		}
	}

	grid.reset = function () {
		for (let i = 0; i < this.length; i++) {
			for (let j = 0; j < this[i].length; j++) {
				this[i][j] = 0
			}
		}
		this.robotPos = [0, 0]
		this.ballPos = []
	}

	grid.prepare = function (robotR) {
		let gr = Math.ceil(robotR / this.unitSize)
		this.r = gr
		for (let i = 0; i < this.length; i++) {
			for (let j = 0; j < this[i].length; j++) {
				if (this[i][j] === 1) {
					for (let kx = -gr; kx <= gr; kx++) {
						for (let ky = -gr; ky <= gr; ky++) {
							if (i + kx >= 0 && i + kx < this.length) {
								if (j + ky >= 0 && j + ky < this[i + kx].length) {
									if (this[i + kx][j + ky] === 0) {
										this[i + kx][j + ky] = 2
									}
								}
							}
						}
					}
				}
			}
		}
	}

	grid.robotPos = [0, 0]
	grid.placeRobot = function (posx, posy) {
		posx = posx + this.center[0]
		posy = posy + this.center[1]
		let rx = Math.round(posx / this.unitSize)
		let ry = Math.round(posy / this.unitSize)
		for (let i = 0; i < this.length; i++) {
			let done = false
			for (let j = 0; j < this[i].length; j++) {
				if (this[i][j] === 3) {
					this[i][j] = 0
					done = true
					break
				}
			}
			if (done) {
				break
			}
		}

		this[rx][ry] = 3
		this.robotPos = [rx, ry]
	}

	grid.ballPos = []
	grid.addBall = function (posx, posy) {
		posx = posx + this.center[0]
		posy = posy + this.center[1]
		let bx = Math.round(posx / this.unitSize)
		let by = Math.round(posy / this.unitSize)
		if (this[bx][by] === 0) {
			this[bx][by] = 4
			this.ballPos.push([bx, by])
		}

	}

	grid.astar = function () {
		let res = this._astar()
		if (res === undefined) {
			return [undefined, [
				[this.robotPos[0] * this.unitSize - this.center[0], this.robotPos[1] * this.unitSize - this.center[1]]
			]]
		}
		let [ball, path] = this._astar()

		function lineObs(p1, p2) {
			let x1 = p1[0]
			let x2 = p2[0]
			let y1 = p1[1]
			let y2 = p2[1]
			if (x1 === x2) {
				let ymin = Math.min(y1, y2)
				let ymax = Math.max(y1, y2)
				for (let yi = ymin; yi <= ymax; yi++) {
					if (grid[x1][yi] === 1 || grid[x1][yi] === 2) {
						return true
					}
				}
			} else {
				let ys = y2 - y1
				let xs = x2 - x1
				let xmin = Math.min(x1, x2)
				let xmax = Math.max(x1, x2)
				for (let xi = xmin; xi <= xmax; xi++) {
					let yp = Math.ceil(ys * ((xi - x1) / xs) + y1)
					let ym = Math.floor(ys * ((xi - x1) / xs) + y1)
					if (grid[xi][yp] === 1 || grid[xi][yp] === 2) {
						return true
					}
					if (grid[xi][ym] === 1 || grid[xi][ym] === 2) {
						return true
					}
				}
			}
			return false
		}

		function xxx(path, comp) {
			if (path.length <= 1) {
				return path
			}

			let first = path[0]
			let last = path[path.length - 1]

			if (comp(first, last)) {
				let index = Math.floor(path.length / 2)

				return Array.concat(xxx(path.slice(0, index), comp), [path[index]], xxx(path.slice(index + 1, path.length), comp))

			} else {
				return [first, last]
			}

		}

		path = xxx(path, lineObs)
		ball[0] = ball[0] * this.unitSize - this.center[0]
		ball[1] = ball[1] * this.unitSize - this.center[1]

		for (let i = 0; i < path.length; i++) {
			path[i] = [path[i][0] * this.unitSize - this.center[0], path[i][1] * this.unitSize - this.center[1]]
		}
		return [ball, path.reverse()]

	}

	grid._astar = function () {
		let closedSet = new Array(this.length)
		for (let i = 0; i < closedSet.length; i++) {
			closedSet[i] = new Array(this[i].length)
			for (let j = 0; j < closedSet[i].length; j++) {
				closedSet[i][j] = false
			}
		}
		let openSet = [this.robotPos]

		let cameFrom = new Array(this.length)
		for (let i = 0; i < cameFrom.length; i++) {
			cameFrom[i] = new Array(this[i].length)
		}

		let gScore = new Array(this.length)
		for (let i = 0; i < gScore.length; i++) {
			gScore[i] = new Array(this[i].length)
			for (let j = 0; j < gScore[i].length; j++) {
				gScore[i][j] = Infinity
			}
		}
		gScore[this.robotPos[0]][this.robotPos[1]] = 0

		function lower(score, set) {
			let dot = []
			let min = Infinity
			let index = 0
			for (let i = 0; i < set.length; i++) {
				if (score[set[i][0]][set[i][1]] < min) {
					min = score[set[i][0]][set[i][1]]
					dot = [set[i][0], set[i][1]]
					index = i
				}
			}

			return [dot, index]
		}

		function neib(dot, maxx, maxy) {
			let n = []
			let xmo = ((dot[0] - 1) >= 0)
			let xpo = ((dot[0] + 1) < maxx)
			let ymo = ((dot[1] - 1) >= 0)
			let ypo = ((dot[1] + 1) < maxy)

			if (xmo) {
				n.push([dot[0] - 1, dot[1]])
				if (ymo) {
					n.push([dot[0] - 1, dot[1] - 1])
				}
				if (ypo) {
					n.push([dot[0] - 1, dot[1] + 1])
				}
			}
			if (ymo) {
				n.push([dot[0], dot[1] - 1])
			}
			if (ypo) {
				n.push([dot[0], dot[1] + 1])
			}
			if (xpo) {
				n.push([dot[0] + 1, dot[1]])
				if (ymo) {
					n.push([dot[0] + 1, dot[1] - 1])
				}
				if (ypo) {
					n.push([dot[0] + 1, dot[1] + 1])
				}
			}

			return n
		}

		while (openSet.length > 0) {
			let currentA = lower(gScore, openSet)
			let current = currentA[0]
			let index = currentA[1]

			for (let i = 0; i < this.ballPos.length; i++) {
				if (this.ballPos[i][0] === current[0] && this.ballPos[i][1] === current[1]) {
					let c = current
					let path = []
					while (c !== undefined) {
						path.push([c[0], c[1]])
						if (this[c[0]][c[1]] === 0) {
							this[c[0]][c[1]] = 9
						}
						c = cameFrom[c[0]][c[1]]
					}
					return [
						[current[0], current[1]], path
					]
				}
			}

			openSet.splice(index, 1)
			closedSet[current[0]][current[1]] = true

			let neibs = neib(current, this.length, this[0].length)
			for (let i = 0; i < neibs.length; i++) {
				if (this[neibs[i][0]][neibs[i][1]] === 2 || this[neibs[i][0]][neibs[i][1]] === 1) {
					continue
				}
				if (closedSet[neibs[i][0]][neibs[i][1]]) {
					continue
				}

				let dista = 1
				if (neibs[i][0] !== current[0] && neibs[i][2] !== current[1]) {
					dista = 1.41
				}
				let tscore = gScore[current[0]][current[1]] + dista
				let neibInOpen = false
				for (let k = 0; k < openSet.length; k++) {
					if (openSet[k][0] === neibs[i][0] && openSet[k][1] === neibs[i][1]) {
						neibInOpen = true
						break
					}
				}
				if (!neibInOpen) {
					openSet.push(neibs[i])
				} else if (tscore >= gScore[neibs[i][0]][neibs[i][1]]) {
					continue
				}

				cameFrom[neibs[i][0]][neibs[i][1]] = [current[0], current[1]]
				gScore[neibs[i][0]][neibs[i][1]] = tscore
			}
		}
	}

	return grid
}