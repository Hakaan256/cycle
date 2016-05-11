var GamePlayScene = function(game, stage)
{
  var self = this;

  var dc = stage.drawCanv;
  var ctx = dc.context;
  var n_ticks;
  var clicker;
  var hoverer;
  var p1_card_clicker;
  var p2_card_clicker;

  ENUM = 0;
  var TURN_WAIT_FOR_JOIN = ENUM; ENUM++;
  var TURN_WAIT          = ENUM; ENUM++;
  var TURN_CHOOSE_CARD   = ENUM; ENUM++;
  var TURN_CONFIRM_CARD  = ENUM; ENUM++;
  var TURN_CHOOSE_TARGET = ENUM; ENUM++;
  var TURN_SUMMARY       = ENUM; ENUM++;
  var TURN_DONE          = ENUM; ENUM++;
  var turn_stage;

  ENUM = 0;
  var INPUT_RESUME = ENUM; ENUM++;
  var INPUT_PAUSE = ENUM; ENUM++;
  var input_state;

  //seeded rand!
  var sr;

  //game definition
  var g;

  var chosen_card_i;
  var chosen_card_t;
  var chosen_target_p;
  var hovering_card_i;
  var hovering_card_p;
  var hovering_card_t;

  var transition_t;
  var TRANSITION_KEY_SHUFFLE   = 50;
  var TRANSITION_KEY_MOVE_TOK  = 100;
  var TRANSITION_KEY_SCORE_PTS = 150;
  var TRANSITION_KEY_MOVE_GOAL = 200;

  var direction_viz_enabled;
  var displayed_turn_3_warning;

  //ui only
  var hit_ui;
  var goal_bounds;
  var p1_pts_bounds;
  var p2_pts_bounds;
  var p1_cards_bounds;
  var p2_cards_bounds;
  var p1_cards;
  var p2_cards;
  var hover_card;

  var ready_btn;
  var done_btn;
  var bmwrangler;

  var sidebar_w = 150;
  var topmost_bar_h = 20;
  var score_header_h = 40;

  self.ready = function()
  {
    ctx.font = "12px Arial";
    clicker = new Clicker({source:stage.dispCanv.canvas});
    p1_card_clicker = new Clicker({source:stage.dispCanv.canvas});
    p2_card_clicker = new Clicker({source:stage.dispCanv.canvas});
    hoverer = new PersistentHoverer({source:stage.dispCanv.canvas});

    if(game.join) sr = new SeededRand(game.join);
    else          sr = new SeededRand(Math.floor(Math.random()*100000));

    //g = constructGame(GameTemplate,sr);
    g = constructGame(CarbonCycleGameTemplate,sr);
    //g = constructGame(WaterCycleGameTemplate,sr);
    //g = constructGame(NitrogenCycleGameTemplate,sr);
    transition_t = 0;
    transformGame(dc,g.nodes,g.events,g.tokens)

    var w = sidebar_w-20;
    var gap = topmost_bar_h+score_header_h+15;
    var h = (dc.height-gap)/g.players[0].hand.length;
    p1_cards_bounds = [];
    for(var i = 0; i < g.players[0].hand.length; i++)
    {
      p1_cards_bounds[i] = {
        x:10,
        y:gap+h*i,
        w:w,
        h:h,
      };
    }
    p2_cards_bounds = [];
    for(var i = 0; i < g.players[0].hand.length; i++)
    {
      p2_cards_bounds[i] = {
        x:dc.width-w-10,
        y:gap+h*i,
        w:w,
        h:h,
      };
    }

    var n = g.nodes[g.goal_node-1];
    goal_bounds = {
      x:n.x,
      y:n.y,
      w:n.w,
      h:n.h,
    };

    p1_pts_bounds = {
      x:50,
      y:10,
      w:10,
      h:10,
    };

    p2_pts_bounds = {
      x:dc.width-50-10,
      y:10,
      w:10,
      h:10,
    };

    hover_card = new HoverCard();
    hover_card.x = p1_cards_bounds[0].x;
    hover_card.y = p1_cards_bounds[0].y;
    hover_card.w = p1_cards_bounds[0].w;
    hover_card.h = p1_cards_bounds[0].h*2;
    hover_card.set();
    hoverer.register(hover_card); //need to register to hover before cards

    var card;
    p1_cards = [];
    for(var i = 0; i < g.players[0].hand.length; i++)
    {
      card = new Card();
      card.index = i;
      card.player = 1;

      card.x = p1_cards_bounds[i].x;
      card.y = p1_cards_bounds[i].y;
      card.w = p1_cards_bounds[i].w;
      card.h = p1_cards_bounds[i].h;

      p1_cards.push(card);
      p1_card_clicker.register(card);
      hoverer.register(card);
    }
    p2_cards = [];
    for(var i = 0; i < g.players[0].hand.length; i++)
    {
      card = new Card();
      card.index = i;
      card.player = 2;

      card.x = p2_cards_bounds[i].x;
      card.y = p2_cards_bounds[i].y;
      card.w = p2_cards_bounds[i].w;
      card.h = p2_cards_bounds[i].h;

      p2_cards.push(card);
      p2_card_clicker.register(card);
      hoverer.register(card);
    }

    ready_btn  = new ButtonBox(dc.width/2-200,dc.height-60,400,50,
      function()
      {
        if(hit_ui || turn_stage != TURN_SUMMARY) return;

        playCard(g,chosen_card_i,chosen_target_p,sr);
        chosen_card_i = -1;
        chosen_target_p = 0;
        transition_t = 1;

        if(g.turn == game.turns) turn_stage = TURN_DONE;
        else if(game.multiplayer == MULTIPLAYER_LOCAL)
          turn_stage = TURN_CHOOSE_CARD;
        else if(game.multiplayer == MULTIPLAYER_AI)
        {
          if(g.player_turn == 1) turn_stage = TURN_CHOOSE_CARD;
          else
          {
            var new_chosen_card_i = randIntBelow(g.players[1].hand.length);
            if(chosen_card_i != new_chosen_card_i) chosen_card_t = 0;
            chosen_card_i = new_chosen_card_i;
            chosen_target_p = 1+randIntBelow(2);
          }
        }
        else if(game.multiplayer == MULTIPLAYER_NET_CREATE)
        {
          if(g.player_turn == 1) turn_stage = TURN_CHOOSE_CARD;
          else turn_stage = TURN_WAIT;
        }
        else if(game.multiplayer == MULTIPLAYER_NET_JOIN)
        {
          if(g.player_turn == 1) turn_stage = TURN_WAIT;
          else turn_stage = TURN_CHOOSE_CARD;
        }
        hit_ui = true;
      }
    );
    done_btn  = new ButtonBox(dc.width/2-200,dc.height-60,400,50,
      function()
      {
        if(hit_ui || turn_stage != TURN_DONE) return;
        cli.stop();
        game.setScene(2);
        hit_ui = true;
      }
    );

    clicker.register(hover_card);
    clicker.register(ready_btn);
    clicker.register(done_btn);

    bmwrangler = new BottomMessageWrangler();
    bmwrangler.immediateDismiss();

    if(game.multiplayer == MULTIPLAYER_LOCAL)
      turn_stage = TURN_CHOOSE_CARD;
    else if(game.multiplayer == MULTIPLAYER_AI)
      turn_stage = TURN_CHOOSE_CARD;
    else if(game.multiplayer == MULTIPLAYER_NET_CREATE)
      turn_stage = TURN_WAIT_FOR_JOIN;
    else if(game.multiplayer == MULTIPLAYER_NET_JOIN)
      turn_stage = TURN_WAIT;

    input_state = INPUT_RESUME;

    chosen_card_i = -1;
    chosen_card_t = 0;
    chosen_target_p = 0;
    hovering_card_i = -1;
    hovering_card_p = 0;
    hovering_card_t = 0;

    n_ticks = 0;

    direction_viz_enabled = true;
    displayed_turn_3_warning = false;
  };

  self.tick = function()
  {
    n_ticks++;
    chosen_card_t++;
    hovering_card_t++;

    if(g.turn >= 3 && !displayed_turn_3_warning)
    {
      displayed_turn_3_warning = true;
      displayMessage([
        "WARNING! See how when you hover over an event card, you get a nice visualization of where the carbon atoms will move? Well, we're going to remove that visualization for you.",
        "Don't worry! We'll still keep the visualization highlighting which two reservoirs are affected- but you will now have to figure out <b>in which direction</b> it will affect the carbon atoms, yourself.",
        "Good luck! :)",
      ]);
    }

    switch(turn_stage)
    {
      case TURN_WAIT_FOR_JOIN:
        if(cli.updated)
        {
          for(var i = cli.last_known+1; i < cli.database.length; i++)
          {
            if(cli.database[i].event == "JOIN" && cli.database[i].args[0] == cli.id)
            {
              game.opponent = cli.database[i].user;
              turn_stage = TURN_CHOOSE_CARD;
            }
          }
          cli.last_known = cli.database.length-1;
          cli.updated = false;
        }
        p1_card_clicker.ignore();
        p2_card_clicker.ignore();
        clicker.ignore();
        break;
      case TURN_WAIT:
        if(cli.updated)
        {
          for(var i = cli.last_known+1; i < cli.database.length; i++)
          {
            if(cli.database[i].user == game.opponent && cli.database[i].event == "MOVE")
            {
              if(chosen_card_i != cli.database[i].args[0])
                chosen_card_t = 0;
              chosen_card_i = cli.database[i].args[0];
              chosen_target_p = cli.database[i].args[1];
              turn_stage = TURN_SUMMARY;
            }
          }
          cli.last_known = cli.database.length-1;
          cli.updated = false;
        }
        p1_card_clicker.ignore();
        p2_card_clicker.ignore();
        clicker.ignore();
        break;
      case TURN_CHOOSE_CARD:
        if(g.player_turn == 1) p1_card_clicker.flush();
        if(g.player_turn == 2) p2_card_clicker.flush();
        clicker.ignore();
        break;
      case TURN_CONFIRM_CARD:
        hover_card.tick();
        if(g.player_turn == 1) p1_card_clicker.ignore();
        if(g.player_turn == 2) p2_card_clicker.ignore();
        clicker.flush();
        break;
      case TURN_CHOOSE_TARGET:
        hover_card.tick();
        if(g.player_turn == 1) p1_card_clicker.ignore();
        if(g.player_turn == 2) p2_card_clicker.ignore();
        clicker.flush();
        break;
      case TURN_SUMMARY:
      case TURN_DONE:
        p1_card_clicker.ignore();
        p2_card_clicker.ignore();
        clicker.flush();
        break;
    }
    if(hoverer) hoverer.flush(); //check because "setScene" could have cleaned up hoverer. causes error in console, but no other issues.
    hit_ui = false;

    if(transition_t)
    {
      transition_t++;
      if(transition_t < TRANSITION_KEY_SHUFFLE)
      {
      }
      else if(transition_t < TRANSITION_KEY_MOVE_TOK)
      {
        var t;
        for(var i = 0; i < g.tokens.length; i++)
        {
          t = g.tokens[i];
          t.disp_node_id = t.node_id;
          t.wx = lerp(t.wx,t.target_wx,0.1);
          t.wy = lerp(t.wy,t.target_wy,0.1);
          transformToScreen(dc,t);
        }
      }
      else if(transition_t < TRANSITION_KEY_SCORE_PTS)
      {
        //update tok count
        var n;
        for(var i = 0; i < g.nodes.length; i++)
        {
          n = g.nodes[i];
          if(n.disp_p1_tokens > n.p1_tokens) n.disp_p1_tokens--;
          if(n.disp_p1_tokens < n.p1_tokens) n.disp_p1_tokens++;
          if(n.disp_p2_tokens > n.p2_tokens) n.disp_p2_tokens--;
          if(n.disp_p2_tokens < n.p2_tokens) n.disp_p2_tokens++;
        }
      }
      else if(transition_t < TRANSITION_KEY_MOVE_GOAL)
      {
        //increase dispd player counts
        for(var i = 0; i < g.players.length; i++)
        {
          if(g.players[i].pts > g.players[i].disp_pts)
            g.players[i].disp_pts++;
        }

        //update goal pos
        var n = g.nodes[g.goal_node-1];
        goal_bounds.x = lerp(goal_bounds.x,n.x,0.1);
        goal_bounds.y = lerp(goal_bounds.y,n.y,0.1);
        goal_bounds.w = lerp(goal_bounds.w,n.w,0.1);
        goal_bounds.h = lerp(goal_bounds.h,n.h,0.1);
      }
      else if(transition_t >= TRANSITION_KEY_MOVE_GOAL)
        transition_t = 0;
    }
    bmwrangler.tick();
  };

  self.draw = function()
  {
    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    ctx.fillStyle = red;
    ctx.fillRect(0,0,sidebar_w,dc.height);
    ctx.fillStyle = lred;
    ctx.fillRect(0,0,sidebar_w,40);
    ctx.fillStyle = dred;
    ctx.fillText("RED TEAM",10,28);
    ctx.drawImage(red_token_icon,sidebar_w-40,15,20,15);

    ctx.fillStyle = blue;
    ctx.fillRect(dc.width-sidebar_w,0,sidebar_w,dc.height);
    ctx.fillStyle = lblue;
    ctx.fillRect(dc.width-sidebar_w,0,sidebar_w,40);
    ctx.fillStyle = dblue;
    ctx.fillText("BLUE TEAM",dc.width-sidebar_w+10,28);
    ctx.drawImage(blue_token_icon,dc.width-40,15,20,15);

    ctx.font = "12px Arial";
    ctx.fillStyle = "#000000";
    ctx.strokeStyle = "#000000";

    //draw hover arrows
    var sim_t = 40; //dictates speed of sim'd transfer
    var hovering_valid = (hovering_card_i >= 0 && hovering_card_i < g.players[hovering_card_p-1].hand.length);
    var chosen_valid = (chosen_card_i >= 0 && chosen_card_i < g.players[g.player_turn-1].hand.length);
    if(hovering_valid || chosen_valid)
    {
      var e_id;
      if(hovering_valid)    e_id = g.players[hovering_card_p-1].hand[hovering_card_i];
      else if(chosen_valid) e_id = g.players[g.player_turn-1].hand[chosen_card_i];
      var e = g.events[e_id-1];
      ctx.strokeStyle = "#FFFF00";
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(e.start_x,e.start_y);
      ctx.lineTo(e.end_x,e.end_y);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#000000";
      if(hovering_valid &&
        (
          direction_viz_enabled ||
          (
            turn_stage == TURN_SUMMARY &&
            chosen_card_i == hovering_card_i &&
            hovering_card_p == g.player_turn
          )
        )
      )
      {
        var t = (hovering_card_t%sim_t)/sim_t;
        t *= t;
        ctx.drawImage(circle_icon,lerp(e.start_x,e.end_x,t)-5,lerp(e.start_y,e.end_y,t)-5,10,10);
      }
      else if(chosen_valid &&
        (
          direction_viz_enabled ||
          turn_stage == TURN_SUMMARY
        )
      )
      {
        var t = (chosen_card_t%sim_t)/sim_t;
        t *= t;
        ctx.drawImage(circle_icon,lerp(e.start_x,e.end_x,t)-5,lerp(e.start_y,e.end_y,t)-5,10,10);
      }
    }

    //nodes
    for(var i = 0; i < g.nodes.length; i++)
    {
      var n = g.nodes[i];
      ctx.drawImage(n.img,n.x,n.y,n.w,n.h);
      ctx.textAlign = "center";
      ctx.fillText(n.title,n.x+n.w/2,n.y+20);
      ctx.textAlign = "left";
      ctx.drawImage(ghost_circle_icon,n.x-12,n.y-10,10,10);
      ctx.fillStyle = g.players[0].color;
      ctx.fillText(n.disp_p1_tokens,n.x-10,n.y);
      ctx.drawImage(ghost_circle_icon,n.x-12,n.y,10,10);
      ctx.fillStyle = g.players[1].color;
      ctx.fillText(n.disp_p2_tokens,n.x-10,n.y+10);
      ctx.fillStyle = "#000000";
    }

    //transition
    if(transition_t)
    {
      if(transition_t < TRANSITION_KEY_SHUFFLE)
      {
        var random_highlit_tok_i;
        var toks_at_last_target;
        var last_event = g.events[g.last_event-1];
        var fromnode = g.nodes[last_event.from_id-1];
        if(g.last_target == 1) target_toks = fromnode.disp_p1_tokens;
        else                   target_toks = fromnode.disp_p2_tokens;
        random_highlit_tok_i = Math.floor(Math.random()*target_toks);

        for(var i = 0; i < g.tokens.length; i++)
        {
          var t = g.tokens[i];
          if(t.disp_node_id == fromnode.id && t.player_id == g.last_target)
          {
            if(random_highlit_tok_i == 0)
              ctx.drawImage(highlit_token_icon,t.x-2,t.y-2,t.w+4,t.h+4);
            random_highlit_tok_i--;
          }
        }
      }
      else if(transition_t < TRANSITION_KEY_MOVE_TOK)
      {
        for(var i = 0; i < g.tokens.length; i++)
        {
          var t = g.tokens[i];
          if(Math.abs(t.wx-t.target_wx) > 0.01 || Math.abs(t.wy-t.target_wy) > 0.01)
            ctx.drawImage(highlit_token_icon,t.x-2,t.y-2,t.w+4,t.h+4);
        }
      }
      else if(transition_t < TRANSITION_KEY_SCORE_PTS)
      {
        if(g.player_turn == 1)
        {
          var trans_len = 50;
          var progress = (transition_t+trans_len-TRANSITION_KEY_SCORE_PTS)/50;

          for(var i = 0; i < g.tokens.length; i++)
          {
            var t = g.tokens[i];
            if(t.disp_node_id == g.nodes[g.last_goal_node-1].id)
            {
                   if(t.player_id == 1) ctx.drawImage(g.players[0].token_img,lerp(t.x-2,p1_pts_bounds.x,progress*progress),lerp(t.y-2,p1_pts_bounds.y,1-(1-progress)*(1-progress)),t.w+4,t.h+4);
              else if(t.player_id == 2) ctx.drawImage(g.players[1].token_img,lerp(t.x-2,p2_pts_bounds.x,progress*progress),lerp(t.y-2,p2_pts_bounds.y,1-(1-progress)*(1-progress)),t.w+4,t.h+4);
            }
          }
        }
      }
      else if(transition_t < TRANSITION_KEY_MOVE_GOAL)
      {
      }
    }

    //tokens
    var event = g.events[g.players[g.player_turn-1].hand[chosen_card_i]-1];
    for(var i = 0; i < g.tokens.length; i++)
    {
      var t = g.tokens[i];
      if(turn_stage == TURN_SUMMARY)
      {
        if(t.disp_node_id == event.from_id && t.player_id == chosen_target_p)
          ctx.drawImage(highlit_token_icon,t.x-2,t.y-2,t.w+4,t.h+4);
      }
      else if(turn_stage == TURN_CHOOSE_TARGET && direction_viz_enabled)
      {
        if(t.disp_node_id == event.from_id && t.player_id == chosen_target_p)
          ctx.drawImage(highlit_token_icon,t.x-2,t.y-2,t.w+4,t.h+4);
      }
      ctx.drawImage(g.players[t.player_id-1].token_img,t.x,t.y,t.w,t.h);
    }

    //goal
    var goal_node = g.nodes[g.goal_node-1];
    var goal_close = false;
    if(Math.abs(goal_bounds.x-goal_node.x)+Math.abs(goal_bounds.y-goal_node.y) < 10)
      goal_close = true;
    var turns_left = 3-(g.turn%g.turns_per_goal_shift);
    if(!goal_close && turns_left == 3) turns_left = 0;
    ctx.strokeRect(goal_bounds.x,goal_bounds.y,goal_bounds.w,goal_bounds.h);
    dc.outlineText(turns_left+" turns til goal shift",goal_bounds.x,goal_bounds.y-3,"#000000","#FFFFFF");

    //hand
    var player;
    player = g.players[0];
    ctx.fillStyle = dred;
    ctx.textAlign = "left";
    ctx.font = "10px Arial";
    ctx.fillText("X"+player.disp_pts,sidebar_w-20,25);
    ctx.fillStyle = "#000000";
    for(var i = 0; i < player.hand.length; i++) p1_cards[i].draw();
    player = g.players[1];
    ctx.fillStyle = dblue;
    ctx.textAlign = "left";
    ctx.font = "10px Arial";
    ctx.fillText("X"+player.disp_pts,dc.width-20,25);
    ctx.fillStyle = "#000000";
    for(var i = 0; i < player.hand.length; i++) p2_cards[i].draw();
    ctx.font = "12px Arial";

    //info
    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.fillText("Turn: "+g.turn,dc.width/2,20);
    player = g.players[g.player_turn-1];
    ctx.fillStyle = player.color;
    ctx.fillText(player.title,dc.width/2,35);

    switch(turn_stage)
    {
      case TURN_WAIT_FOR_JOIN: break;
      case TURN_WAIT: break;
      case TURN_CHOOSE_CARD: break;
      case TURN_CONFIRM_CARD:
        hover_card.draw(player,g.events[player.hand[chosen_card_i]-1]);
        break;
      case TURN_CHOOSE_TARGET:
        hover_card.draw(player,g.events[player.hand[chosen_card_i]-1]);
        break;
      case TURN_SUMMARY:
        ctx.textAlign = "left";
        ctx.fillStyle = "#000000";
        ctx.strokeStyle = "#000000";
        ctx.strokeRect(ready_btn.x,ready_btn.y,ready_btn.w,ready_btn.h);

        var player = g.players[g.player_turn-1];
        ctx.fillText(player.title+" played "+g.events[player.hand[chosen_card_i]-1].title+" on "+g.players[chosen_target_p-1].title+"'s carbon",ready_btn.x+10,ready_btn.y+20);
        ctx.fillText("When ready, click to continue.",ready_btn.x+10,ready_btn.y+40);
        break;
      case TURN_DONE:
        ctx.textAlign = "left";
        ctx.fillStyle = "#000000";
        ctx.strokeRect(done_btn.x,done_btn.y,done_btn.w,done_btn.h);

        var player = g.players[g.player_turn-1];
        ctx.fillText("Game Over!",done_btn.x+10,done_btn.y+20);
        ctx.fillText("When ready, click to continue.",done_btn.x+10,done_btn.y+40);
        break;
    }

    ctx.textAlign = "center";
    ctx.font = "20px Arial";
    switch(turn_stage)
    {
      case TURN_WAIT_FOR_JOIN:
        ctx.fillText("waiting for opponent...",dc.width/2,50);
        ctx.fillText("(Room #"+game.join+")",dc.width/2,70);
        break;
      case TURN_WAIT:
        ctx.fillText("waiting for opponent's turn...",dc.width/2,50);
      break;
      case TURN_CHOOSE_CARD:
        ctx.fillText("Choose an Event Card!",dc.width/2,50);
        break;
      case TURN_CONFIRM_CARD:
        ctx.fillText("",dc.width/2,50);
        break;
      case TURN_CHOOSE_TARGET:
        ctx.fillText("Choose A Target!",dc.width/2,50);
        break;
      case TURN_SUMMARY:
        ctx.fillText("",dc.width/2,50);
        break;
      case TURN_DONE:
        ctx.fillText("Game Over!",dc.width/2,50);
        break;
    }

    ctx.textAlign = "left";
    ctx.font = "12px Arial";
    ctx.fillStyle = gray;
    ctx.fillText("Current Zone: "+g.nodes[g.goal_node-1].title,sidebar_w+20,topmost_bar_h+15);
    ctx.textAlign = "right";
    ctx.fillText("Up Next: "+g.nodes[g.goal_node-1].title,dc.width-sidebar_w-20,topmost_bar_h+15);
  };

  self.cleanup = function()
  {
    clicker.detach();
    clicker = undefined;
    p1_card_clicker.detach();
    p1_card_clicker = undefined;
    p2_card_clicker.detach();
    p2_card_clicker = undefined;
    hoverer.detach();
    hoverer = undefined;
  };

  var doneDisplay = function ()
  {
    input_state = INPUT_RESUME;
    direction_viz_enabled = false;
  }

  var displayMessage = function(lines)
  {
    input_state = INPUT_PAUSE;
    bmwrangler.popMessage(lines,doneDisplay);
  }

  //no data- just used for interface
  var Card = function()
  {
    var self = this;

    self.index = 0; //index into current player's hand
    self.player = 0;

    self.x;
    self.y;
    self.w;
    self.h;

    self.dx;
    self.dy;
    self.dw;
    self.dh;

    self.tick = function()
    {
      if(!self.dw || !self.dh)
      {
        self.dx = self.x;
        self.dy = self.y;
        self.dw = self.w;
        self.dh = self.h;
      }
      self.x = lerp(self.x,self.dx,0.1);
      self.y = lerp(self.y,self.dy,0.1);
      self.w = lerp(self.w,self.dw,0.1);
      self.h = lerp(self.h,self.dh,0.1);
    }

    self.draw = function()
    {
      var player = g.players[self.player-1];
      var event = g.events[player.hand[self.index]-1];

      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFAF7";
      ctx.fillRect(self.x,self.y,self.w,self.h);

      if(g.player_turn == player.id && chosen_card_i == self.index) ctx.strokeStyle = "#00FF00";
      else ctx.strokeStyle = player.color;
      ctx.strokeRect(self.x,self.y,self.w,self.h);

      var icon_s = 35;
      ctx.drawImage(circle_icon,self.x+20,self.y+20,icon_s,icon_s);
      ctx.drawImage(circle_icon,self.x+self.w-20-icon_s,self.y+20,icon_s,icon_s);
      ctx.drawImage(biarrow_icon,self.x+self.w/2-(icon_s/4),self.y+20+icon_s/4,icon_s/2,icon_s/2);

      ctx.fillStyle = "#000000";
      ctx.font = "12px Arial";
      ctx.fillText(event.title,self.x+self.w/2,self.y+70);
      ctx.fillText(event.info,self.x+self.w/2,self.y+95);
      ctx.font = "italic 10px Arial";
      ctx.fillText(event.description,self.x+self.w/2,self.y+85);
    }

    self.click = function(evt)
    {
      if(hit_ui) return;
      if(chosen_card_i != self.index)
      {
        if(hovering_card_i == self.index && hovering_card_p == self.player)
          chosen_card_t = hovering_card_t;
        else
          chosen_card_t = 0;
      }
      chosen_card_i = self.index;
      hover_card.x = self.x;
      hover_card.y = self.y;
      hover_card.dx = self.x;
      hover_card.dy = self.y-50;
      hover_card.t = 0;
      turn_stage = TURN_CONFIRM_CARD;
      hit_ui = true;
    }

    self.hover = function(evt)
    {
      if(hit_ui) return;
      if(hovering_card_i == -1)
      {
        if(chosen_card_i == self.index && g.player_turn == self.player)
          hovering_card_t = chosen_card_t;
        else hovering_card_t = 0;
      }
      hovering_card_i = self.index;
      hovering_card_p = self.player;
    }
    self.unhover = function()
    {
      hovering_card_i = -1;
      hovering_card_p = 0;
      if(chosen_card_i != self.index || g.player_turn != self.player)
        chosen_card_t = 0;
    }
  }

  var HoverCard = function()
  {
    var self = this;

    self.x = 0;
    self.y = 0;
    self.w = 0;
    self.h = 0;

    self.dx = 0;
    self.dy = 0;
    self.dw = 0;
    self.dh = 0;

    self.t = 0;

    //relative vals!
    self.play_x = 0;
    self.play_y = 0;
    self.play_w = 0;
    self.play_h = 0;
    self.target_1_x = 0;
    self.target_1_y = 0;
    self.target_1_w = 0;
    self.target_1_h = 0;
    self.target_2_x = 0;
    self.target_2_y = 0;
    self.target_2_w = 0;
    self.target_2_h = 0;

    self.set = function()
    {
      self.dx = self.x;
      self.dy = self.y;
      self.dw = self.w;
      self.dh = self.h;

      self.play_x = self.w/2-30;
      self.play_y = self.h-30;
      self.play_w = 60;
      self.play_h = 20;
      self.target_1_x = self.w/2-40;
      self.target_1_y = self.h/2+30;
      self.target_1_w = 30;
      self.target_1_h = 30;
      self.target_2_x = self.w/2+10;
      self.target_2_y = self.h/2+30;
      self.target_2_w = 30;
      self.target_2_h = 30;
    }

    self.tick = function()
    {
      self.t++;
      self.x = lerp(self.x,self.dx,0.1);
      self.y = lerp(self.y,self.dy,0.1);
      self.w = lerp(self.w,self.dw,0.1);
      self.h = lerp(self.h,self.dh,0.1);
    }

    self.draw = function(player,event)
    {
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFAF7";
      ctx.fillRect(self.x,self.y,self.w,self.h);

      var icon_s = 35;
      ctx.drawImage(circle_icon,self.x+20,self.y+20,icon_s,icon_s);
      ctx.drawImage(circle_icon,self.x+self.w-20-icon_s,self.y+20,icon_s,icon_s);
      ctx.drawImage(biarrow_icon,self.x+self.w/2-(icon_s/4),self.y+20+icon_s/4,icon_s/2,icon_s/2);

      ctx.fillStyle = "#000000";
      ctx.fillText(event.title,self.x+self.w/2,self.y+70);
      ctx.font = "italic 10px Arial";
      ctx.fillText(event.description,self.x+self.w/2,self.y+85);
      ctx.font = "12px Arial";
      ctx.fillText(event.info,self.x+self.w/2,self.y+95);

      switch(turn_stage)
      {
        case TURN_WAIT_FOR_JOIN: break;
        case TURN_WAIT: break;
        case TURN_CHOOSE_CARD: break;
        case TURN_CONFIRM_CARD:
          if(g.player_turn == 1) { ctx.strokeStyle = red; ctx.fillStyle = red; }
          if(g.player_turn == 2) { ctx.strokeStyle = blue; ctx.fillStyle = blue; }
          ctx.lineWidth = 0.5;
          dc.drawLine(self.x,self.y+self.h/2,self.x+self.w,self.y+self.h/2);
          ctx.fillRect(self.x+self.play_x,self.y+self.play_y,self.play_w,self.play_h);
          ctx.fillStyle = white;
          ctx.fillText("PLAY CARD",self.x+self.play_x+self.play_w/2,self.y+self.play_y+self.play_h-2);
          break;
        case TURN_CHOOSE_TARGET:
          ctx.textAlign = "center";
          ctx.fillStyle = gray;
          ctx.fillRect(self.x,self.y+self.h/2,self.w,20);
          ctx.fillStyle = white;
          ctx.fillText("SELECT CARBON",self.x+self.w/2,self.y+self.h/2+15);
          if(chosen_target_p == 1)
          {
            ctx.fillStyle = lred;
            ctx.fillRect(self.x,self.y+self.h/2+20,self.w,self.h/2-20);
            ctx.fillStyle = dred;
            ctx.fillRect(self.x+self.target_1_x,self.y+self.target_1_y,self.target_1_w,self.target_1_h);

            ctx.fillStyle = blue;
            ctx.fillRect(self.x+self.play_x,self.y+self.play_y,self.play_w,self.play_h);
            ctx.fillStyle = white;
            ctx.fillText("PLAY CARD",self.x+self.play_x+self.play_w/2,self.y+self.play_y+self.play_h-2);
            ctx.fillText("RED",self.x+self.target_1_x+self.target_1_w/2,self.y+self.target_1_y+self.target_1_h);
          }
          if(chosen_target_p == 2)
          {
            ctx.fillStyle = lblue;
            ctx.fillRect(self.x,self.y+self.h/2+20,self.w,self.h/2-20);
            ctx.fillStyle = dblue;
            ctx.fillRect(self.x+self.target_2_x,self.y+self.target_2_y,self.target_2_w,self.target_2_h);

            ctx.fillStyle = red;
            ctx.fillRect(self.x+self.play_x,self.y+self.play_y,self.play_w,self.play_h);
            ctx.fillStyle = white;
            ctx.fillText("PLAY CARD",self.x+self.play_x+self.play_w/2,self.y+self.play_y+self.play_h-2);
            ctx.fillText("BLUE",self.x+self.target_2_x+self.target_2_w/2,self.y+self.target_2_y+self.target_2_h);
          }

          if(chosen_target_p != 1)
          {
            ctx.fillStyle = dred;
            ctx.fillText("RED",self.x+self.target_1_x+self.target_1_w/2,self.y+self.target_1_y+self.target_1_h);
          }

          if(chosen_target_p != 2)
          {
            ctx.fillStyle = dblue;
            ctx.fillText("BLUE",self.x+self.target_2_x+self.target_2_w/2,self.y+self.target_2_y+self.target_2_h);
          }

          ctx.strokeStyle = dred;
          ctx.strokeRect(self.x+self.target_1_x,self.y+self.target_1_y,self.target_1_w,self.target_1_h);
          ctx.drawImage(red_token_icon,self.x+self.target_1_x+self.target_1_w/2-10,self.y+self.target_1_y+self.target_1_h/2-8,20,15);
          ctx.strokeStyle = dblue;
          ctx.strokeRect(self.x+self.target_2_x,self.y+self.target_2_y,self.target_2_w,self.target_2_h);
          ctx.drawImage(blue_token_icon,self.x+self.target_2_x+self.target_2_w/2-10,self.y+self.target_2_y+self.target_2_h/2-8,20,15);
          break;
        case TURN_SUMMARY: break;
        case TURN_DONE: break;
      }

      ctx.lineWidth = 5;
      ctx.strokeStyle = white;
      ctx.strokeRect(self.x,self.y,self.w,self.h);
      ctx.lineWidth = 2;
    }

    self.click = function(evt)
    {
      if(hit_ui) return;
      hit_ui = true;

      if(turn_stage == TURN_CONFIRM_CARD)
      {
        if(ptWithin(evt.doX,evt.doY,self.x+self.play_x,self.y+self.play_y,self.play_w,self.play_h))
        {
          turn_stage = TURN_CHOOSE_TARGET;
          return;
        }

        chosen_card_i = -1;
        turn_stage = TURN_CHOOSE_CARD;
      }

      if(turn_stage == TURN_CHOOSE_TARGET)
      {
        if(ptWithin(evt.doX,evt.doY,self.x+self.target_1_x,self.y+self.target_1_y,self.target_1_w,self.target_1_h))
        {
          chosen_target_p = 1;
          return;
        }

        //p2 hit
        if(ptWithin(evt.doX,evt.doY,self.x+self.target_2_x,self.y+self.target_2_y,self.target_2_w,self.target_2_h))
        {
          chosen_target_p = 2;
          return;
        }

        if(chosen_target_p > 0 && ptWithin(evt.doX,evt.doY,self.x+self.play_x,self.y+self.play_y,self.play_w,self.play_h))
        {
          if(game.multiplayer == MULTIPLAYER_NET_CREATE || game.multiplayer == MULTIPLAYER_NET_JOIN)
            cli.add(cli.id+" MOVE "+chosen_card_i+" "+chosen_target_p);
          turn_stage = TURN_SUMMARY;
          return;
        }

        chosen_card_i = -1;
        turn_stage = TURN_CHOOSE_CARD;
      }
    }

    self.hovering = false;
    self.hover = function(evt)
    {
      if(turn_stage != TURN_CONFIRM_CARD && turn_stage != TURN_CHOOSE_TARGET) return;
      self.hovering = true;
      hit_ui = true;
    }
    self.unhover = function()
    {
      self.hovering = false;
    }
  }

};

