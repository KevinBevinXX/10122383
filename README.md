# Game Hub

109 browser games, all served from this site: 106 original games plus three
open-source games in `oss/`. 36 of the games are two-player, either on one
device or on two devices online with a 5-letter room code.

- `index.html` is the game list. `play.html?g=<id>` runs one game.
- `engine.js` is the shared loop, input, touch controls and online play.
- `games/<id>.js` holds one file per game. `games/list.js` is the catalog.
- Online play is peer-to-peer over WebRTC via [PeerJS](https://peerjs.com)
  (`lib/peerjs.min.js`, MIT). It uses PeerJS's free public connection server.

## Tests

```
tools/test-games.sh            # every game: random input + JSON round-trip, CPU vs CPU
tools/test-games.sh chess pong # just some
tools/test-online.py chess     # two real browsers connect by room code (needs the site on :8766)
```

## Open-source games included

| Game | Author | License |
|---|---|---|
| `oss/2048` | Gabriele Cirulli | MIT |
| `oss/hextris` | Logan Engstrom, Garrett Finucane, Noah Moroze, Michael Yang | GPL-3.0 (ads and analytics removed) |
| `oss/clumsy-bird` | Ellison Leão | GPL-3.0 |
