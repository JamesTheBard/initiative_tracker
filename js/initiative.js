var db = window.openDatabase("UsersDB", "", "UserTable", 1024*1000);
var round = 0;
var current_player = 0;
var is_started = false;
var createStatement = "CREATE TABLE IF NOT EXISTS Characters (id INTEGER PRIMARY KEY AUTOINCREMENT, player_name TEXT, initiative INTEGER, bonus INTEGER, dexterity INTEGER)";
var selectAllStatement = "SELECT * FROM Characters ORDER BY initiative DESC, bonus DESC, dexterity DESC";
var insertStatement = "INSERT INTO Characters (player_name, initiative, bonus, dexterity) VALUES (?, ?, ?, ?)";
var deleteStatement = "DELETE FROM Characters WHERE player_name=?";
createTable();
refreshView();

$('div.round').hide();

$('#submit_new_player').click( function() {
    console.log("Adding player to local DB.");
    addCharacter();
    $('form[name="addCharacter"]').find("input").val("");
    });

function nullDataHandler(transaction, results) { }

function createTable() {
    db.transaction(function (tx) {
        tx.executeSql(createStatement);
    });
}

function addCharacter() {
    var player_name, initiative, bonus, dexterity;
    var fields = $('form[name="addCharacter"]').serializeArray();
    $.each( fields, function(i, fd) {
        if(fd.name === "init_roll") initiative = fd.value;
        if(fd.name === "character_name") player_name = fd.value;
        if(fd.name === "initiative_bonus") bonus = fd.value;
        if(fd.name === "dexterity") dexterity = fd.value;
    });
    if (!initiative || !player_name || !bonus || !dexterity) {
        console.log("Missing a field, try again.");
        alert("You're missing a field, try again.");
        return;
    }
    db.transaction(function (tx) {
        tx.executeSql(insertStatement,
            [player_name, initiative, bonus, dexterity]);
    });
    refreshView();
}

function refreshView() {
    db.transaction( function(tx) {
        tx.executeSql(selectAllStatement, [], dataHandler, errorHandler)
    });
}

function errorHandler(transaction, error) {
    alert('Oops.  Error was '+error.message+' (Code '+error.code+')');
    var we_think_this_error_is_fatal = true;
    if (we_think_this_error_is_fatal) return true;
    return false;
}

function dataHandler(transaction, results) {
    var final_string = "";
    var source = $("#player-template").html();
    var template = Handlebars.compile(source);
    
    if (results.rows.length === 0) {
        final_string = '<div class="no_results">Feel free to add players to the initiative tracker.</div>';
        $('div.players').html(final_string); 
        $('#start').prop('disabled', true);
    }
    else {
        for (var i=0; i<results.rows.length; i++) {
            var row = results.rows.item(i);
            var context = {roll: row['initiative'], name: row['player_name'], id: i+1};
            final_string = final_string + template(context); 
        }
        $('div.players').html(final_string);
        $('#start').prop('disabled', false);
    }    
    addDeleteClickEvent();
}

function addOnClickEvent() {
    $('div').on('mouseenter', 'div.player', function(){
        $('div').removeClass("selected");
        $(this).addClass("selected");
    });
}

function addDeleteClickEvent() {
    $('div').on('mouseenter', 'div.is_icon', function(){
        $(this).addClass("highlight_icon");
    });
    $('div').on('mouseleave', 'div.is_icon', function() {
        $(this).removeClass("highlight_icon");
    });
    $('div').on('click', 'div.remove', function(){
        character = $(this).attr('id');
        db.transaction(function(tx) {
            tx.executeSql(deleteStatement, [character]);
        });
        refreshView();
    });
}

$('#start').click(function(){
    startRounds();
});

$('#next_button').click(function(){
    nextPlayer();
});

$('#prev_button').click(function(){
    prevPlayer();
});

$('#reset_button').click(function(){
    resetPlayer();
});

function startRounds() {
    is_started = true;
    current_player = 1;
    $('.player').first().addClass('selected');
    round = 1;
    $('#round_text').text(round);
    $('div.round').show();
}

function nextPlayer() {
    if (is_started) {
        if (current_player >= $('.player').length) {
            current_player = 1;
            round = round + 1;
        } else {
            current_player++;
        }
        updatePlayer();
    }
}

function prevPlayer() {
    if (is_started) {
        if (current_player <= 1) {
            current_player = $('.player').length;
            round--;
        } else {
            current_player--;
        }
        updatePlayer();
    }
}

function resetPlayer(){
    $('.player').removeClass('selected');
    round = 0;
    current_player = 0;
    is_started = false;
    $('#round_text').text(round);
    $('div.round').hide();
}

function updatePlayer(){
    $('.player').removeClass('selected');
    $('#player'+current_player).addClass('selected');
    $('#round_text').text(round);
}
