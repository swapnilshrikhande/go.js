//Define new funtion as a simple plugin to jquery library
//global variable to hold state of the game
var gogame = {};

//Constants
gogame.DEFAULT_BOARDSIZE = 9;
gogame.EMPTY = 0;
gogame.BLACK = 1;
gogame.WHITE = 2;
gogame.GRID_SIZE = 40;

//Variables
gogame.board = [];

//simple html templates
gogame.INTERSECTION_TEMPLATE = '<div class="intersection"></div>';

//main function
$.fn.go = function(options) {


    //initializing go game
    console.log("Initializing Go Game ",this);
    console.log("Options ",options);
    if( options ){
        gogame["size"] = options.boardsize;
        gogame["boardelem"] = this;
    }

    gogame.initialize();

    return this;
};

gogame.initialize = function(){
    var boardDomElem = gogame["boardelem"];

    this.current_color = gogame.BLACK;
    this.size = this.size || gogame.DEFAULT_BOARDSIZE;
    this.board = this.createBoard(this.size);
    this.last_move_passed = false;
    this.in_atari = false;
    this.attempted_suicide = false;

    console.log("Here This Is =",this);
};

gogame.createBoard = function(size) {
    var board = [];

    for (var row=0 ; row < size ; ++row ) {

        board[row] = [];

        for (var col=0; col < size ; ++ col ) {
            board[row][col] = gogame.EMPTY;
        }
    }

    return board;
};

/*
gogame.Intersection = function(){
    this. = gogame.EMPTY;
    //creates new empty dom element
    this.elem  = $(gogame.INTERSECTION_TEMPLATE);
};*/

//game play methods
/*
 * Switches the current player
 */
gogame.switch_player = function() {
    this.current_color =
        this.current_color == gogame.BLACK ? gogame.WHITE : gogame.BLACK;
};

/*
 * At any point in the game, a player can pass and let his opponent play
 */
gogame.pass = function() {
    if (this.last_move_passed)
        this.end_game();
    this.last_move_passed = true;
    this.switch_player();
};

/*
 * Called when the game ends (both players passed)
 */
gogame.end_game = function() {
    console.log("GAME OVER");
};

/*
 * Attempt to place a stone at (i,j). Returns true iff the move was legal
 */
gogame.play = function(row, col) {

    console.log("Played at " + row + ", " + col);
    this.attempted_suicide = this.in_atari = false;

    //invalid move
    if (this.board[row][col] != gogame.EMPTY)
        return false;

    var color = this.board[row][col] = this.current_color;
    var captured = [];
    var neighbors = this.get_adjacent_intersections(row, col);
    var atari = false;

    var self = this;

    $(neighbors).each(function(index,n) {

        var state = self.board[n[0]][n[1]];

        if (state != gogame.EMPTY && state != color) {
            var group = self.get_group(n[0], n[1]);
            console.log(group);
            if (group["liberties"] == 0)
                captured.push(group);
            else if (group["liberties"] == 1)
                atari = true;
        }
    });

    // detect suicide
    if (_.isEmpty(captured) && this.get_group(i, j)["liberties"] == 0) {
        this.board[i][j] = gogame.EMPTY;
        this.attempted_suicide = true;
        return false;
    }

    var self = this;
    _.each(captured, function(group) {
        _.each(group["stones"], function(stone) {
            self.board[stone[0]][stone[1]] = gogame.EMPTY;
        });
    });

    if (atari)
        this.in_atari = true;

    this.last_move_passed = false;
    this.switch_player();
    return true;
};

/*
 * Given a board position, returns a list of [i,j] coordinates representing
 * orthagonally adjacent intersections
 */
gogame.get_adjacent_intersections = function(i , j) {
    var neighbors = [];
    if (i > 0)
        neighbors.push([i - 1, j]);
    if (j < this.size - 1)
        neighbors.push([i, j + 1]);
    if (i < this.size - 1)
        neighbors.push([i + 1, j]);
    if (j > 0)
        neighbors.push([i, j - 1]);
    return neighbors;
};

/*
 * Performs a breadth-first search about an (i,j) position to find recursively
 * orthagonally adjacent stones of the same color (stones with which it shares
 * liberties). Returns null for if there is no stone at the specified position,
 * otherwise returns an object with two keys: "liberties", specifying the
 * number of liberties the group has, and "stones", the list of [i,j]
 * coordinates of the group's members.
 */
gogame.get_group = function(i, j) {

    var color = this.board[i][j];
    if (color == gogame.EMPTY)
        return null;

    var visited = {}; // for O(1) lookups
    var visited_list = []; // for returning
    var queue = [[i, j]];
    var count = 0;

    while (queue.length > 0) {
        var stone = queue.pop();
        if (visited[stone])
            continue;

        var neighbors = this.get_adjacent_intersections(stone[0], stone[1]);
        var self = this;
        _.each(neighbors, function(n) {
            var state = self.board[n[0]][n[1]];
            if (state == gogame.EMPTY)
                count++;
            if (state == color)
                queue.push([n[0], n[1]]);
        });

        visited[stone] = true;
        visited_list.push(stone);
    }

    return {
        "liberties": count,
        "stones": visited_list
    };
}
