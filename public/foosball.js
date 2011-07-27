
// model for individual game scores

var SoccerScore = Backbone.Model.extend({
  initialize : function (){    
  },
// check to validate entry
  validate : function(attrs){
    if(attrs.player1==attrs.player2)
      return "Players must be different";
    if(attrs.goals1==attrs.goals2)
      return "Goals must be different";
  }  
});

// collection of scores
var SoccerResults = Backbone.Collection.extend();

// model for a player

var Player = Backbone.Model.extend({
  initialize : function(){
    this.wins = 0;
    this.games = 0;
    this.goals = 0;
    this.against = 0;
    this.points = 0;
  }
});

// collection of players

var Players = Backbone.Collection.extend({
  model:Player,
  comparator : function(player){return -player.get("points");}
});

// view a player

var PlayerView = Backbone.View.extend({
  tagName : 'li',
  initialize : function(){
    this.render = _.bind(this.render, this);
  },
  render : function(){
    $(this.el).empty();
    $(this.el).append("<span>"+this.model.attributes.name+"</span>");
    return this;
  }
});

// list of players

var PlayerList = Backbone.View.extend({
  tagName : 'ul',
  initialize : function() {
    _(this).bindAll('add');
    this.collection.bind('add', this.add);
    var that = this;
    this.playerViews = [];
    this.collection.each(function(player){
      that.playerViews.push(new PlayerView({model:player}));
    });
  },

  render : function(){
    $(this.el).empty();
    for(i=0,l=this.playerViews.length;i<l;i++){
      $(this.el).append(this.playerViews[i].render().el);
    }
    return this;
  },

  add: function(player){
    this.playerViews.push(new PlayerView({model:player}));
    this.render();
  }
});

// view a single score

var ScoreView = Backbone.View.extend({
  tagName : 'li',
  initialize : function(){
    this.render = _.bind(this.render, this);
  },
  render : function(){
    $(this.el).empty();
    var game = this.model.attributes;
    var that = this;

    // if the score is editable

    if(game.edit){
      var choosePlayer = "<select>";
      for(var i = 0, l = game.players.length; i<l; i++){
        choosePlayer += "<option value='"+game.players.at(i).attributes.name+"' "+(game.players.at(i).attributes.name==game.player1?"selected":"")+">"+game.players.at(i).attributes.name+"</option>";
      }
      choosePlayer += "</select>";
      choosePlayer += "<input type=text value="+game.goals1+">"
      choosePlayer += "<select>";
      for(var i = 0, l = game.players.length; i<l; i++){
        choosePlayer += "<option value='"+game.players.at(i).attributes.name+"' "+(game.players.at(i).attributes.name==game.player2?"selected":"")+">"+game.players.at(i).attributes.name+"</option>";
      }
      choosePlayer += "</select>";
      choosePlayer += "<input type=text value="+game.goals2+">"
      $(this.el).append(choosePlayer);
      cancel = $("<input type=button value=cancel>");
      cancel.click(function(e){
        game.edit = false;
        that.render();});
      save = $("<input type=button value=save>");
      save.click(function(e){
        game.edit = false;
        that.model.set({player1:$(that.el).find("select:first").val(),
          goals1:+$(that.el).find("input:first").val(),
          player2:$(that.el).find("select:eq(1)").val(),
          goals2:+$(that.el).find("input:eq(1)").val(),});
        that.render();
      });
      $(this.el).append(cancel);
      $(this.el).append(save);

    // if the score is shown

    }else{
      $(this.el).append("<span>"+game.player1+": "+game.goals1+" - "+game.player2+": "+game.goals2+"</span>");
      change = $("<input type=button value=edit>");
      change.click(function(e){game.edit = true;that.render();});
      $(this.el).append(change);
      remove = $("<input type=button value=remove>");
      remove.click(function(e){that.model.collection.remove(that.model);that.render();});
      $(this.el).append(change).append(remove);
    }
    return this;
  }
});

// list of scores

var ScoreList = Backbone.View.extend({
  tagName : 'ul',
  initialize : function() {
    _(this).bindAll('add','remove');
    this.collection.bind('add', this.add);
    this.collection.bind('remove', this.remove);
    var that = this;
    this.scoreViews = [];
    this.collection.each(function(score){
      that.scoreViews.push(new ScoreView({model:score}));
    });
  },

  render : function(){
    $(this.el).empty();
    for(i=0,l=this.scoreViews.length;i<l;i++){
      $(this.el).append(this.scoreViews[i].render().el);
    }
    return this;
  },
  add: function(score){
    if(score.attributes.player1)
      this.scoreViews.push(new ScoreView({model:score}));
  },
  remove : function(model) {
    var viewToRemove = _(this.scoreViews).select(function(sv) { return sv.model === model; })[0];
    this.scoreViews = _(this.scoreViews).without(viewToRemove);
    $(viewToRemove.el).remove();
  }
});

// show the rankings

var Rankings = Backbone.View.extend({
initialize : function(){},

// render works out rankings and points

render : function(){
  $(this.el).empty();
  var that = this;
  var playerByName = function(name){
    for(var i=that.options.players.length;i;i--){
      if(that.options.players.at(i-1).attributes.name==name)
        return that.options.players.at(i-1);
    }
  };
  var playerRank = function(player){
    for(var i=that.options.players.length;i;i--){
      if(that.options.players.at(i-1).attributes==player)
        return i;
    }
  };
  _(this.options.players.toArray()).each(function(player){
    player.set({wins : 0,points : 0,games : 0,goals : 0,against : 0});
    
  });
  _(this.collection.toArray()).each(function(score){
    p1 = playerByName(score.attributes.player1).attributes;
    p2 = playerByName(score.attributes.player2).attributes;
    winner = p1;
    loser = p1;
    if(score.attributes.goals1>score.attributes.goals2){
      p1.wins++;
      loser = p2;
    }
    else{
      p2.wins++;
      winner = p2;
    }
    p1.games++;
    p2.games++;
    p1.goals+=score.attributes.goals1;
    p2.goals+=score.attributes.goals2;
    p1.against+=score.attributes.goals2;
    p2.against+=score.attributes.goals1;
    winner.points = ((winner.points*winner.games-1)+((3*Math.max((20-playerRank(loser)/10),0.5))*100))/winner.games;
    loser.points = loser.points/loser.games*(loser.games+1);
    that.options.players.sort();
  });
  _(this.options.players.toArray()).each(function(player){$(that.el).append("<span>"+player.attributes.name+" "+Math.round(player.attributes.points)+"</span><br>")});
  return this;
}
});

// control

var Controller = {
  init : function(){

// setup players

    var roster = new Players();
    for(var i = 0, l = playerdata.length; i<l; i++){
      pl = new Player();
      pl.set({name:playerdata[i]});
      roster.add(pl);
    }
    var players = new PlayerList({collection : roster});
  $("#players").append(players.render().el);

// setup scores

    var results = new SoccerResults();

    for(var i = 0, l = data.length; i<l; i+=4){
      ss = new SoccerScore();
      ss.set({
        players : roster,
        player1 : data[i],
        goals1 : data[i+1],
        player2 : data[i+2],
        goals2 : data[i+3],
        edit : false});
      results.add(ss);
    }
    var scores = new ScoreList({collection : results});
    $("#scores").append(scores.render().el);


    $("#newuser").click(function(e){
      newname = $("#newusername").val();
      pl = new Player({name:newname});
      roster.add(pl);
    });

// setup rankings

var rankings = new Rankings({collection:results,players:roster});
$("#rankings").append(rankings.render().el);
var recalc = $('<input type=button value=recalculate>').click(function(){rankings.render();});
$("#rankings").append(recalc);

// view for entering a new score

var newScoreView = Backbone.View.extend({
  tagname : "div",
  initialize : function(){
    _(this).bindAll('add');
    this.collection.bind('add', this.add);
    this.render = _.bind(this.render, this);
  },
  add: function(){this.render()},
  render: function(){
    var that = this;
    $(this.el).empty();
    var choosePlayer = "<select>";
      for(var i = 0, l = this.collection.length; i<l; i++){
        choosePlayer += "<option value='"+this.collection.at(i).attributes.name+"'>"+this.collection.at(i).attributes.name+"</option>";
      }
      choosePlayer += "</select>";
      choosePlayer += "<input type=text value=0>"
      choosePlayer += "<select>";
      for(var i = 0, l = this.collection.length; i<l; i++){
        choosePlayer += "<option value='"+this.collection.at(i).attributes.name+"'>"+this.collection.at(i).attributes.name+"</option>";
      }
      choosePlayer += "</select>";
      choosePlayer += "<input type=text value=0>"
    $(this.el).append(choosePlayer);
    var newscore = $('<input type="button" value="new">');
newscore.click(function(){
      var ss = new SoccerScore();
      if(ss.set({
      players : roster,
      player1 : $(that.el).find("select:first").val(),
      goals1 : $(that.el).find("input:first").val(),
      player2 : $(that.el).find("select:eq(1)").val(),
      goals2 : $(that.el).find("input:eq(1)").val(),
      edit : false})){
        results.add(ss)
        scores.render();
      }
});

    $(this.el).append(newscore);
    scores.render();


    return this;
  }
});

var newscore = new newScoreView({collection:roster});
    $("#scores").append(newscore.render().el);

// setup socket communication

  var socket = new io.Socket(null,{socket:3000,connectTimeout:30000});
  socket.connect();

// receive messages

socket.on('message', function(msg){alert(msg);});

// setup save to server

var password = $('<input type=password>');
var save = $('<input type=button value=save>');
save.click(function(){
  arr1 = [];
  for(var i = 0,l=results.length;i<l;i++){
    r = results.at(i).attributes;
    arr1.push(r.player1,r.goals1,r.player2,r.goals2);
  }
  arr2 = [];
  for(var i = 0,l=roster.length;i<l;i++){
    r = roster.at(i).attributes;
    arr2.push(r.name);
  }
  socket.send({password:$('#save input').val(),players:arr2,results:arr1});
});

$('#save').append(password);
$('#save').append(save);

  }
  

}

// initialize program

var control = Controller.init();




