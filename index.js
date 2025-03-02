const PORT = 7777;

let http = require('http');
let static = require('node-static');
let ws = require('ws');
let file = new static.Server('./public');

let http_server = http.createServer(function (request, response) {
    request.addListener('end', function () {
        file.serve(request, response);
    }).resume();
}).listen(PORT);

let ws_server = new ws.Server({ server: http_server });

let player1, player2;
let spectators = [];

ws_server.on('connection', function (conn) {
    console.log("Usuario conectado");

    if (player1 == null) {
        player1 = conn;
        player1.send(JSON.stringify({ player_num: 1 }));

        if (player2 != null) {
            let start_game = { start_game: true };
            player1.send(JSON.stringify(start_game));
            player2.send(JSON.stringify(start_game));
            console.log("¡Ambos jugadores conectados! Iniciando...");
        }

        player1.on('close', function () {
            console.log("Jugador 1 desconectado");
            player1 = null;

            if (player2) {
                player2.send(JSON.stringify({ reset: true }));
            }
            spectators.forEach(spectator => {
                spectator.send(JSON.stringify({ reset: true }));
            });
        });

        player1.on('message', function (msg) {
            let info = JSON.parse(msg);

            if (info.y != null) {
                if (player2) player2.send(JSON.stringify(info));
                spectators.forEach(spectator => {
                    spectator.send(JSON.stringify(info));
                });
            } else if (info.bx != null) {
                if (player2) player2.send(JSON.stringify(info));
                spectators.forEach(spectator => {
                    spectator.send(JSON.stringify(info));
                });
            } else if (info.score1 != null) {
                if (info.score1 >= 3 || info.score2 >= 3) {
                    let data;

                    if (info.score1 < info.score2) {
                        data = {
                            game_over: true,
                            win: 2,
                            message: "Jugador 2 ha ganado"
                        };
                    } else {
                        data = {
                            game_over: true,
                            win: 1,
                            message: "Jugador 1 ha ganado"
                        };
                    }

                    let data_json = JSON.stringify(data);

                    if (player1) player1.send(data_json);
                    if (player2) player2.send(data_json);
                    spectators.forEach(spectator => {
                        spectator.send(data_json);
                    });
                }

                if (player2) player2.send(JSON.stringify(info));
                spectators.forEach(spectator => {
                    spectator.send(JSON.stringify(info));
                });
            }
        });
    } else if (player2 == null) {
        player2 = conn;
        player2.send(JSON.stringify({ player_num: 2 }));

        if (player1 != null) {
            let start_game = { start_game: true };
            player1.send(JSON.stringify(start_game));
            player2.send(JSON.stringify(start_game));
            console.log("¡Ambos jugadores conectados! Iniciando...");
        }

        player2.on('close', function () {
            console.log("Jugador 2 desconectado");
            player2 = null;

            if (player1) {
                player1.send(JSON.stringify({ reset: true }));
            }
            spectators.forEach(spectator => {
                spectator.send(JSON.stringify({ reset: true }));
            });
        });

        player2.on('message', function (msg) {
            let info = JSON.parse(msg);

            if (info.y != null) {
                if (player1) player1.send(JSON.stringify(info));
                spectators.forEach(spectator => {
                    spectator.send(JSON.stringify(info));
                });
            }
        });
    } else {
        spectators.push(conn);

        conn.on('close', function () {
            console.log("Espectador desconectado");
            spectators = spectators.filter(spectator => spectator !== conn);
        });

        conn.on('message', function (msg) {
            console.log("Mensaje de espectador: " + msg);
        });
    }
});