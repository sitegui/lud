function makeGrid(sizex, sizey, unit_size, centerx = 0, centery = 0) {
	var gxsize = Math.floor(sizex / unit_size) + 1;
	var gysize = Math.floor(sizey / unit_size) + 1;
	var grid = new Array(gxsize);
	for (var i = 0; i < gxsize; i++) {
		grid[i] = new Array(gysize);
		for (var j = 0; j < gysize; j++) {
			grid[i][j] = 0;
		}
	}

	grid.sizex = sizex;
	grid.sizey = sizey;
	grid.center = [centerx, centery]
	grid.unit_size = unit_size;
	grid.r = 0;

	grid.addObs = function (posx, posy, r) {
		posx = posx + this.center[0]
		posy = posy + this.center[1]
		var x = Math.round(posx / this.unit_size);
		var y = Math.round(posy / this.unit_size);
		var d = Math.ceil(r / this.unit_size);
		for (var i = -d; i <= d; i++) {
			for (var j = -d; j <= d; j++) {
				if ((i + x >= 0) && (i + x < this.length)) {
					if ((j + y >= 0) && (j + y < this[i + x].length)) {
						if (i * i + j * j <= d * d) {
							this[i + x][j + y] = 1;
						}
					}
				}
			}
		}
	};

	grid.show = function () {
		for (var i = 0; i < this.length; i++) {
			s = ''
			for (var j = 0; j < this[i].length; j++) {
				s = s + this[i][j] + ' '
			}
			console.log(s);
		}
	};

	grid.reset = function () {
		for (var i = 0; i < this.length; i++) {
			for (var j = 0; j < this[i].length; j++) {
				this[i][j] = 0;
			}
		}
		this.robot_pos = [0, 0]
		this.ball_pos = []
	};

	grid.prepare = function (robotR) {
		var gr = Math.ceil(robotR / this.unit_size);
		this.r = gr;
		for (var i = 0; i < this.length; i++) {
			for (var j = 0; j < this[i].length; j++) {
				if (this[i][j] == 1) {
					for (var kx = -gr; kx <= gr; kx++) {
						for (var ky = -gr; ky <= gr; ky++) {
							if (i + kx >= 0 && i + kx < this.length) {
								if (j + ky >= 0 && j + ky < this[i + kx].length) {
									if (this[i + kx][j + ky] === 0) {
										this[i + kx][j + ky] = 2;
									}
								}
							}
						}
					}
				}
			}
		}
	};

	grid.robot_pos = [0, 0];
	grid.placeRobot = function (posx, posy) {
		posx = posx + this.center[0]
		posy = posy + this.center[1]
		var rx = Math.round(posx / this.unit_size);
		var ry = Math.round(posy / this.unit_size);
		for (var i = 0; i < this.length; i++) {
			var done = false;
			for (var j = 0; j < this[i].length; j++) {
				if (this[i][j] == 3) {
					this[i][j] = 0;
					done = true;
					break;
				}
			}
			if (done) {
				break;
			}
		}

		this[rx][ry] = 3;
		this.robot_pos = [rx, ry];
	};

	grid.ball_pos = [];
	grid.addBall = function (posx, posy) {
		posx = posx + this.center[0]
		posy = posy + this.center[1]
		var bx = Math.round(posx / this.unit_size);
		var by = Math.round(posy / this.unit_size);
		if (this[bx][by] === 0) {
			this[bx][by] = 4;
			this.ball_pos.push([bx, by]);
		}

	};

	grid.astar = function () {
		res = this._astar()
		if (res == undefined) {
			return [undefined, [
				[this.robot_pos[0] * this.unit_size - this.center[0], this.robot_pos[1] * this.unit_size - this.center[1]]
			]]
		}
		[ball, path] = this._astar()

		function line_obs(p1, p2) {
			var x1 = p1[0]
			var x2 = p2[0]
			var y1 = p1[1]
			var y2 = p2[1]
			if (x1 == x2) {
				var ymin = Math.min(y1, y2)
				var ymax = Math.max(y1, y2)
				for (var yi = ymin; yi <= ymax; yi++) {
					if (grid[x1][yi] == 1 || grid[x1][yi] == 2) {
						return true
					}
				}
			} else {
				var ys = y2 - y1
				var xs = x2 - x1
				var xmin = Math.min(x1, x2)
				var xmax = Math.max(x1, x2)
				for (var xi = xmin; xi <= xmax; xi++) {
					var yp = Math.ceil(ys * ((xi - x1) / xs) + y1)
					var ym = Math.floor(ys * ((xi - x1) / xs) + y1)
					if (grid[xi][yp] == 1 || grid[xi][yp] == 2) {
						return true
					}
					if (grid[xi][ym] == 1 || grid[xi][ym] == 2) {
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

			var first = path[0]
			var last = path[path.length - 1]

			if (comp(first, last)) {
				var index = Math.floor(path.length / 2)

				return Array.concat(xxx(path.slice(0, index), comp), [path[index]], xxx(path.slice(index + 1, path.length), comp))

			} else {
				return [first, last]
			}

		}

		path = xxx(path, line_obs)
		ball[0] = ball[0] * this.unit_size - this.center[0]
		ball[1] = ball[1] * this.unit_size - this.center[1]

		for (var i = 0; i < path.length; i++) {
			path[i] = [path[i][0] * this.unit_size - this.center[0], path[i][1] * this.unit_size - this.center[1]]
		}
		return [ball, path.reverse()]

	}

	grid._astar = function () {
		var closedSet = new Array(this.length);
		for (var i = 0; i < closedSet.length; i++) {
			closedSet[i] = new Array(this[i].length);
			for (var j = 0; j < closedSet[i].length; j++) {
				closedSet[i][j] = false;
			}
		}
		var openSet = [this.robot_pos];

		var cameFrom = new Array(this.length);
		for (var i = 0; i < cameFrom.length; i++) {
			cameFrom[i] = new Array(this[i].length);
		}

		var gScore = new Array(this.length);
		for (var i = 0; i < gScore.length; i++) {
			gScore[i] = new Array(this[i].length);
			for (var j = 0; j < gScore[i].length; j++) {
				gScore[i][j] = Infinity;
			}
		}
		gScore[this.robot_pos[0]][this.robot_pos[1]] = 0;

		function lower(score, set) {
			var dot = [];
			var min = Infinity;
			var index = 0;
			for (var i = 0; i < set.length; i++) {
				if (score[set[i][0]][set[i][1]] < min) {
					min = score[set[i][0]][set[i][1]];
					dot = [set[i][0], set[i][1]];
					index = i;
				}
			}

			return [dot, index];
		}

		function neib(dot, maxx, maxy, grid) {
			var n = [];
			var xmo = ((dot[0] - 1) >= 0);
			var xpo = ((dot[0] + 1) < maxx);
			var ymo = ((dot[1] - 1) >= 0);
			var ypo = ((dot[1] + 1) < maxy);

			if (xmo) {
				n.push([dot[0] - 1, dot[1]]);
				if (ymo) {
					n.push([dot[0] - 1, dot[1] - 1]);
				}
				if (ypo) {
					n.push([dot[0] - 1, dot[1] + 1]);
				}
			}
			if (ymo) {
				n.push([dot[0], dot[1] - 1]);
			}
			if (ypo) {
				n.push([dot[0], dot[1] + 1]);
			}
			if (xpo) {
				n.push([dot[0] + 1, dot[1]]);
				if (ymo) {
					n.push([dot[0] + 1, dot[1] - 1]);
				}
				if (ypo) {
					n.push([dot[0] + 1, dot[1] + 1]);
				}
			}

			return n;
		}

		while (openSet.length > 0) {
			var currentA = lower(gScore, openSet);
			var current = currentA[0];
			var index = currentA[1];

			for (var i = 0; i < this.ball_pos.length; i++) {
				if (this.ball_pos[i][0] == current[0] && this.ball_pos[i][1] == current[1]) {
					var c = current
					var path = []
					while (c != undefined) {
						path.push([c[0], c[1]])
						if (this[c[0]][c[1]] == 0) {
							this[c[0]][c[1]] = 9
						}
						c = cameFrom[c[0]][c[1]]
					}
					return [
						[current[0], current[1]], path
					];
				}
			}

			openSet.splice(index, 1);
			closedSet[current[0]][current[1]] = true;

			var neibs = neib(current, this.length, this[0].length);
			for (var i = 0; i < neibs.length; i++) {
				if (this[neibs[i][0]][neibs[i][1]] == 2 || this[neibs[i][0]][neibs[i][1]] == 1) {
					continue;
				}
				if (closedSet[neibs[i][0]][neibs[i][1]]) {
					continue;
				}

				dista = 1
				if (neibs[i][0] != current[0] && neibs[i][2] != current[1]) {
					dista = 1.41
				}
				tscore = gScore[current[0]][current[1]] + dista;
				var neibInOpen = false;
				for (var k = 0; k < openSet.length; k++) {
					if (openSet[k][0] == neibs[i][0] && openSet[k][1] == neibs[i][1]) {
						neibInOpen = true;
						break;
					}
				}
				if (!neibInOpen) {
					openSet.push(neibs[i]);
				} else if (tscore >= gScore[neibs[i][0]][neibs[i][1]]) {
					continue;
				}

				cameFrom[neibs[i][0]][neibs[i][1]] = [current[0], current[1]];
				gScore[neibs[i][0]][neibs[i][1]] = tscore;
			}
		}
	}

	return grid;
}