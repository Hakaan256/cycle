var GameTemplate =
{
  tokens:10,
  deck:100,
  hand:5,
  blast_turns:3,
  players:
    [
      {
        title:"PlayerA",
        token_img:"red_circle",
      },
      {
        title:"PlayerB",
        token_img:"blue_circle",
      },
      {
        title:"PlayerC",
        token_img:"green_circle",
      },
      {
        title:"PlayerD",
        token_img:"yellow_circle",
      },
    ],
  nodes:
    [
      {
        title:"A",
        img:"circle",
        x:0.2,
        y:0.2,
        w:0.1,
        h:0.1,
      },
      {
        title:"B",
        img:"circle",
        x:0.4,
        y:0.1,
        w:0.1,
        h:0.1,
      },
      {
        title:"C",
        img:"circle",
        x:0.6,
        y:0.8,
        w:0.1,
        h:0.1,
      },
      {
        title:"D",
        img:"circle",
        x:0.7,
        y:0.4,
        w:0.1,
        h:0.1,
      },
    ],
  events:
    [
      {
        title:"EvA",
        from:"A",
        to:"B",
        time:0,
        amt:1,
        common:1,
      },
      {
        title:"EvB",
        from:"B",
        to:"C",
        time:0,
        amt:1,
        common:1,
      },
      {
        title:"EvC",
        from:"C",
        to:"D",
        time:0,
        amt:1,
        common:1,
      },
      {
        title:"EvD",
        from:"D",
        to:"B",
        time:0,
        amt:1,
        common:1,
      },
      {
        title:"EvE",
        from:"A",
        to:"C",
        time:0,
        amt:1,
        common:1,
      },
    ],
};

var CarbonCycleGameTemplate =
{
  tokens:10,
  deck:100,
  hand:5,
  blast_turns:3,
  players:
    [
      {
        title:"PlayerA",
        token_img:"red_circle",
      },
      {
        title:"PlayerB",
        token_img:"blue_circle",
      },
      {
        title:"PlayerC",
        token_img:"green_circle",
      },
      {
        title:"PlayerD",
        token_img:"yellow_circle",
      },
    ],
  nodes:
    [
      {
        title:"Earth",
        img:"circle",
        x:0.5,
        y:0.5,
        w:0.1,
        h:0.1,
      },
      {
        title:"Atmosphere",
        img:"circle",
        x:0.1,
        y:0.5,
        w:0.1,
        h:0.1,
      },
      {
        title:"Plants",
        img:"circle",
        x:0.3,
        y:0.8,
        w:0.1,
        h:0.1,
      },
      {
        title:"Animals",
        img:"circle",
        x:0.7,
        y:0.8,
        w:0.1,
        h:0.1,
      },
      {
        title:"Fuel",
        img:"circle",
        x:0.7,
        y:0.4,
        w:0.1,
        h:0.1,
      },
    ],
  events:
    [
      {
        title:"Photosynth",
        from:"Atmosphere",
        to:"Plants",
        time:0,
        amt:1,
        common:1,
      },
      {
        title:"Eat",
        from:"Plants",
        to:"Animals",
        time:0,
        amt:1,
        common:1,
      },
      {
        title:"Respiration",
        from:"Animals",
        to:"Atmosphere",
        time:0,
        amt:1,
        common:1,
      },
      {
        title:"Animal Death",
        from:"Animals",
        to:"Earth",
        time:0,
        amt:1,
        common:1,
      },
      {
        title:"Plant Death",
        from:"Plants",
        to:"Earth",
        time:0,
        amt:1,
        common:1,
      },
      {
        title:"Combustion",
        from:"Fuel",
        to:"Atmosphere",
        time:0,
        amt:5,
        common:1,
      },
      {
        title:"Composition",
        from:"Earth",
        to:"Fuel",
        time:10,
        amt:1,
        common:1,
      },
    ],
};

