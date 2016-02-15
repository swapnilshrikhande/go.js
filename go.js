//Define new funtion as a simple plugin to jquery library
//global variable to hold state of the game
var gogame = {};

//Constants
gogame.DEFAULT_BOARDSIZE = 9;
gogame.EMPTY = 0;
gogame.BLACK = 1;
gogame.WHITE = 2;
gogame.INTERS_SIZE  = 40;
gogame.BOARD_MARGIN = 10;

//Variables
gogame.board = [];


//simple html templates
gogame.INTERSECTION_TEMPLATE =
         '<div class="empty intersection" data-row="1" data-col="1">'
        +'      <div class="vertical-line" ></div>'
        +'      <div class="horizontal-line"></div>'
        +'      <div class="stone"></div>'
        +'</div>';

//main function
$.fn.go = function(options) {
    //initializing go game
    console.log("Initializing Go Game ",this);
    console.log("Options ",options);
    if( options ){
        gogame["size"] = options.boardsize;
        gogame["passbutton"] = options.passbutton;
        gogame["scoreboard"] = options.scoreboard;
    }
    gogame["boardDomElem"] = this;
    gogame.initialize();

    return this;
};

gogame.initialize = function(){

    this.current_color = gogame.BLACK;
    this.size = this.size || gogame.DEFAULT_BOARDSIZE;
    this.board = this.createBoard(this.size);
    this.whitescore = 0;
    this.blackscore = 0;
    this.last_move_passed = false;
    this.in_atari = false;
    this.attempted_suicide = false;
    this.initBoardView();

    console.log("Here This Is =",this);
};

gogame.playEventHandler = function(event){
    var cell   = this || event.target;
    var cellJQ = $(cell);
    var row    = parseInt( cellJQ.attr("row"),10 );
    var col    = parseInt( cellJQ.attr("col"),10 );
    gogame.play(row,col);
    gogame.refreshBoard();
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

gogame.initBoardView = function(){
    //to start with all Intersections will be empty
    //as set in the template
    var size = this.size || gogame.DEFAULT_BOARDSIZE;
    var newElementsArr = [];
    var newElem;

    for (var row=0 ; row < size ; ++row ) {
        for (var col=0; col < size ; ++col ) {
            newElem = $(gogame.INTERSECTION_TEMPLATE);
            positionCss = gogame.getCellPositionCss(row,col);
            newElem.attr("row",row)
                   .attr("col",col)
                   .css(positionCss);
            newElementsArr.push(newElem);
        }
    }
    console.log('newElementsArr',newElementsArr);

    var boardHeight = size*gogame.INTERS_SIZE+5;
    var boardWidth  = boardHeight;

    $( this.boardDomElem ).html("")
                          .append(newElementsArr)
                          .on("click",".intersection",this.playEventHandler)
                          .css("height",boardHeight)
                          .css("width",boardWidth);
    var self = this;
    $( this.passbutton ).click(function(event){
        self.pass();
        return false;//stop bubble
    });

    //refresh to show initial score
    gogame.refreshBoard();
}

gogame.getCellPositionCss = function(row,col){

    var topPx   = row*gogame.INTERS_SIZE + gogame.BOARD_MARGIN;
    var leftPx  = col*gogame.INTERS_SIZE + gogame.BOARD_MARGIN;
    return { top:topPx+'px', left:leftPx+'px' };
};

gogame.refreshBoard = function(){

    var emptyIntersections = [];
    var whiteIntersections = [];
    var blackIntersectons  = [];
    var currentCellDomElem;
    var cellColor;

    for (var row=0 ; row < this.size ; ++row ) {
        for (var col=0; col < this.size ; ++col ) {

            currentCellDomElem = $(this.boardDomElem).find(".intersection[row='"+row+"'][col='"+col+"']");
            cellColor = this.board[row][col];

            if( cellColor === gogame.EMPTY && !currentCellDomElem.hasClass("empty") ){
                emptyIntersections.push(currentCellDomElem[0] );
            } else if( cellColor === gogame.WHITE && !currentCellDomElem.hasClass("white") ) {
                whiteIntersections.push(currentCellDomElem[0]);
            } else if( cellColor === gogame.BLACK && !currentCellDomElem.hasClass("black") ) {
                blackIntersectons.push(currentCellDomElem[0]);
            }
        }
    }

    gogame.update_scoreboard();

    $(emptyIntersections).removeClass("white black").addClass("empty");
    $(whiteIntersections).removeClass("empty black").addClass("white");
    $(blackIntersectons).removeClass("white empty").addClass("black");

    console.log("emptyIntersections",emptyIntersections);
    console.log("whiteIntersections",whiteIntersections);
    console.log("blackIntersectons",blackIntersectons);
};

gogame.update_scoreboard = function(){

    //update scoreboard
    var currentplayer = this.get_current_player_name().toLowerCase();
    var scoreboard = $( this.scoreboard );
    scoreboard.find(".current-player").css("background-color","white");
    scoreboard.find(".current-"+currentplayer).css("background-color","lightgreen");
    scoreboard.find(".black-score").text(this.blackscore);
    scoreboard.find(".white-score").text(this.whitescore);
};

//game play methods
/*
 * Switches the current player
 */
gogame.switch_player = function() {
    this.current_color =
        this.current_color == gogame.BLACK ? gogame.WHITE : gogame.BLACK;
    //gogame.update_scoreboard();
};

gogame.get_current_player_name = function() {
    return this.current_color == gogame.BLACK ? "Black" : "White";
};

/*
 * At any point in the game, a player can pass and let his opponent play
 */
gogame.pass = function() {

    if ( this.last_move_passed == true) {
        this.end_game();
    }

    this.last_move_passed = true;
    this.switch_player();
};

/*
 * Called when the game ends (both players passed)
 */
gogame.end_game = function() {

    var isTie  = this.whitescore === this.blackscore;

    var winner = !isTie && this.whitescore > this.blackscore ? "White" : "Black";

    if(isTie) {
        alert("Game Ends, A Tie! ");
    } else {
        alert("Game Ends, Winner : "+winner);
    }

    console.log("GAME OVER");
};

/*
 * Attempt to place a stone at (row,col). Returns true iff the move was legal
 */
gogame.play = function(row, col) {
    var currentPlayerName = this.get_current_player_name();
    console.log("Player :"+currentPlayerName);
    console.log("Played at " + row + ", " + col);
    this.attempted_suicide = this.in_atari = false;

    //invalid move
    if ( this.board[row][col] != gogame.EMPTY ) {
        return false;
    }

    var color = this.board[row][col] = this.current_color;
    var captured = [];
    var neighbors = this.get_adjacent_intersections(row, col);
    var atari = false;

    var self = this;

    $(neighbors).each(function(index,n) {

        var state = self.colorAt(n);

        if (state != gogame.EMPTY && state != color) {

            var group = self.get_group(n[0], n[1]);
            console.log(group);

            if ( group["liberties"] == 0 ) {
                captured.push(group);
            } else if (group["liberties"] == 1) {
                atari = true;
            }
        }
    });

    // detect suicide
    if ( captured.length==0 && this.get_group(row, col)["liberties"] == 0) {
        this.board[row][col] = gogame.EMPTY;
        this.attempted_suicide = true;
        return false;
    }

    //custom scoring
    if( color === gogame.WHITE ) {
        this.whitescore -= 0.5;
    } else if( color ===  gogame.BLACK ){
        this.blackscore -= 0.5;
    }

    var self = this;
    $(captured).each(function(index,group) {
        
        //loop over each stone in the group
        $(group["stones"]).each( function(index, stone) {
            self.board[stone[0]][stone[1]] = gogame.EMPTY;
        });

        //add up to score who wins the stones
        //and reduce from the loser
        if( color === gogame.WHITE ) {
            self.whitescore += group["stones"].length;
            self.blackscore -= group["stones"].length;
        } else if( color ===  gogame.BLACK ) {
            self.blackscore += group["stones"].length;
            self.whitescore -= group["stones"].length;
        }
    });

    if (atari) {
        this.in_atari = true;
    }

    this.last_move_passed = false;
    this.switch_player();
    return true;
};

/*
 * Given a board position, returns a list of [row,col] coordinates representing
 * orthagonally adjacent intersections
 */
gogame.get_adjacent_intersections = function(row , col) {
    var neighbors = [];
    if (row > 0)
        neighbors.push([row - 1, col]);
    if (col < this.size - 1)
        neighbors.push([row, col + 1]);
    if (row < this.size - 1)
        neighbors.push([row + 1, col]);
    if (col > 0)
        neighbors.push([row, col - 1]);
    return neighbors;
};

gogame.colorAt = function(pointArr){
    var rowN  = pointArr[0];
    var colN  = pointArr[1];
    return this.board[rowN][colN];
}

/*
 * Performs a breadth-first search about an (row,col) position to find recursively
 * orthagonally adjacent stones of the same color (stones with which it shares
 * liberties). Returns null for if there is no stone at the specified position,
 * otherwise returns an object with two keys: "liberties", specifying the
 * number of liberties the group has, and "stones", the list of [row,col]
 * coordinates of the group's members.
 */
gogame.get_group = function(row, col) {

    var color = this.board[row][col];

    if (color == gogame.EMPTY) {
        return null;
    }

    var visited = {}; // for O(1) lookups
    var visited_list = []; // for returning
    var queue = [[row, col]];
    var count = 0;

    while (queue.length > 0) {
        var stone = queue.pop();

        if (visited[stone])
            continue;

        var neighbors = this.get_adjacent_intersections(stone[0], stone[1]);
        var self = this;
        $(neighbors).each(function(index,n) {

            var state = self.colorAt(n);

            if ( state == gogame.EMPTY ) {
                count++;
            }

            if (state == color) {
                queue.push([n[0], n[1]]);
            }

        });

        visited[stone] = true;
        visited_list.push(stone);
    }

    return {
        "liberties": count,
        "stones": visited_list
    };
}
