
function make_grid(sizex, sizey, unit_size){
	var gxsize = Math.ceil(sizex/unit_size)
    var gysize = Math.ceil(sizey/unit_size)
    
	var grid = new Array(gxsize)
    for (var i=0; i<gxsize; i++){
    	grid[i] = new Array(gysize)
        for (var j=0; j<gysize; j++){
        	grid[i][j] = 0
        }
    }
    grid.sizex = sizex
    grid.sizey = sizey
    grid.unit_size = unit_size
    
    grid.add_obs = function (posx, posy, r){
    	var x = Math.ceil(posx/this.unit_size)
        var y = Math.ceil(posy/this.unit_size)
        var d = Math.ceil(r/this.unit_size)
        for (var i = -d; i <= d; i++){
        	for (var j = -d; j <= d; j++){
            	if ((i+x >= 0) && (i+x < this.length)){
                	if ((j+y >= 0) && (j+y < this[i+x].length)){
                		if (i*i+j*j <= d*d){
                    		this[i+x][j+y] = 1
                		}
                    }
                }
            }
        }
    }
    
    grid.show = function(){
    	for(var i = 0; i < this.length; i++){
        	console.log(this[i])
        }
    }
    
    return grid
}

