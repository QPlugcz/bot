/*

COPYRIGHT»                   QPlug.cz 2017
SOFTWARE ENGINEER»           Hellbyte, Franta72
ROOM»                        plug.dj/qplug-czsk

*/

(function () {

    API.getWaitListPosition = function(id){
        if(typeof id === 'undefined' || id === null){
            id = API.getUser().id;
        }
        var wl = API.getWaitList();
        for(var i = 0; i < wl.length; i++){
            if(wl[i].id === id){
                return i;
            }
        }
        return -1;
    };

    var kill = function () {
        clearInterval(basicBot.room.autodisableInterval);
        clearInterval(basicBot.room.afkInterval);
        basicBot.status = false;
    };

    var socket = function () {
        function loadSocket() {
            SockJS.prototype.msg = function(a){this.send(JSON.stringify(a))};
            sock = new SockJS('https://benzi.io:4964/socket');
            sock.onopen = function() {
                console.log('Connected to socket!');
                sendToSocket();
            };
            sock.onclose = function() {
                console.log('Disconnected from socket, reconnecting every minute ..');
                var reconnect = setTimeout(function(){ loadSocket() }, 60 * 1000);
            };
            sock.onmessage = function(broadcast) {
                var rawBroadcast = broadcast.data;
                var broadcastMessage = rawBroadcast.replace(/["\\]+/g, '');
                API.chatLog(broadcastMessage);
                console.log(broadcastMessage);
            };
        }
        if (typeof SockJS == 'undefined') {
            $.getScript('https://cdn.jsdelivr.net/sockjs/0.3.4/sockjs.min.js', loadSocket);
        } else loadSocket();
    }

    var sendToSocket = function () {
        var basicBotSettings = basicBot.settings;
        var basicBotRoom = basicBot.room;
        var basicBotInfo = {
            time: Date.now(),
            version: basicBot.version
        };
        var data = {users:API.getUsers(),userinfo:API.getUser(),room:location.pathname,basicBotSettings:basicBotSettings,basicBotRoom:basicBotRoom,basicBotInfo:basicBotInfo};
        return sock.msg(data);
    };

    var storeToStorage = function () {
        localStorage.setItem("basicBotsettings", JSON.stringify(basicBot.settings));
        localStorage.setItem("basicBotRoom", JSON.stringify(basicBot.room));
        var basicBotStorageInfo = {
            time: Date.now(),
            stored: true,
            version: basicBot.version
        };
        localStorage.setItem("basicBotStorageInfo", JSON.stringify(basicBotStorageInfo));

    };

    var subChat = function (chat, obj) {
        if (typeof chat === "undefined") {
            API.chatLog("There is a chat text missing.");
            console.log("There is a chat text missing.");
            return "[Error] No text message found.";

            // TODO: Get missing chat messages from source.
        }
        var lit = '%%';
        for (var prop in obj) {
            chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
        }
        return chat;
    };

    var loadChat = function (cb) {
        if (!cb) cb = function () {
        };
        $.get("https://cdn.jsdelivr.net/gh/qplugcz/bot/package/languages.json", function (json) {
            var link = basicBot.chatLink;
            if (json !== null && typeof json !== "undefined") {
                langIndex = json;
                link = langIndex[basicBot.settings.language.toLowerCase()];
                if (basicBot.settings.chatLink !== basicBot.chatLink) {
                    link = basicBot.settings.chatLink;
                }
                else {
                    if (typeof link === "undefined") {
                        link = basicBot.chatLink;
                    }
                }
                $.get(link, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        basicBot.chat = json;
                        cb();
                    }
                });
            }
            else {
                $.get(basicBot.chatLink, function (json) {
                    if (json !== null && typeof json !== "undefined") {
                        if (typeof json === "string") json = JSON.parse(json);
                        basicBot.chat = json;
                        cb();
                    }
                });
            }
        });
    };

    var retrieveSettings = function () {
        var settings = JSON.parse(localStorage.getItem("basicBotsettings"));
        if (settings !== null) {
            for (var prop in settings) {
                basicBot.settings[prop] = settings[prop];
            }
        }
    };

    var retrieveFromStorage = function () {
        var info = localStorage.getItem("basicBotStorageInfo");
        if (info === null) API.chatLog(basicBot.chat.nodatafound);
        else {
            var settings = JSON.parse(localStorage.getItem("basicBotsettings"));
            var room = JSON.parse(localStorage.getItem("basicBotRoom"));
            var elapsed = Date.now() - JSON.parse(info).time;
            if ((elapsed < 1 * 60 * 60 * 1000)) {
                API.chatLog(basicBot.chat.retrievingdata);
                for (var prop in settings) {
                    basicBot.settings[prop] = settings[prop];
                }
                basicBot.room.users = room.users;
                basicBot.room.historyList = room.historyList;
                basicBot.room.mutedUsers = room.mutedUsers;
                basicBot.room.autoskip = room.autoskip;
                basicBot.room.roomstats = room.roomstats;
                basicBot.room.messages = room.messages;
                basicBot.room.queue = room.queue;
                API.chatLog(basicBot.chat.datarestored);
            }
        }

    };

    String.prototype.splitBetween = function (a, b) {
        var self = this;
        self = this.split(a);
        for (var i = 0; i < self.length; i++) {
            self[i] = self[i].split(b);
        }
        var arr = [];
        for (var i = 0; i < self.length; i++) {
            if (Array.isArray(self[i])) {
                for (var j = 0; j < self[i].length; j++) {
                    arr.push(self[i][j]);
                }
            }
            else arr.push(self[i]);
        }
        return arr;
    };

    String.prototype.startsWith = function(str) {
      return this.substring(0, str.length) === str;
    };

    function linkFixer(msg) {
        var parts = msg.splitBetween('<a href="', '<\/a>');
        for (var i = 1; i < parts.length; i = i + 2) {
            var link = parts[i].split('"')[0];
            parts[i] = link;
        }
        var m = '';
        for (var i = 0; i < parts.length; i++) {
            m += parts[i];
        }
        return m;
    };

    function decodeEntities(s) {
        var str, temp = document.createElement('p');
        temp.innerHTML = s;
        str = temp.textContent || temp.innerText;
        temp = null;
        return str;
    };
    function validateTokens(user)
                {
            var tokens;

            //Check for existing user tokens
            if (localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined") {
                 localStorage.setItem(user, "0");
                 tokens = localStorage.getItem(user);
            }
            else if (localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined") {
                 tokens = localStorage.getItem(user);
            }
            else {
                 tokens = localStorage.getItem(user);
            }

            return tokens;


            };
var botCreator = "QPlug.cz Team";
var botMaintainer = "QPlug.cz"
var botCreatorIDs = ["4635487", "5032556"];

var basicBot = {
version: "1.9",
status: false,
name: "QPlug.cz Bot",
loggedInID: null,
scriptLink: "https://cdn.jsdelivr.net/gh/qplugcz/bot/app.js",
cmdLink: "http://qplug.funsite.cz/bot/prikazy",
chatLink: "https://cdn.jsdelivr.net/gh/qplugcz/bot/package/qplugcz.json",
chat: null,
loadChat: loadChat,
retrieveSettings: retrieveSettings,
retrieveFromStorage: retrieveFromStorage,

settings: {
botName: "QPlug.cz Bot",
language: "qplugcz",
chatLink: "https://cdn.jsdelivr.net/gh/qplugcz/bot/package/qplugcz.json",
scriptLink: "https://cdn.jsdelivr.net/gh/qplugcz/bot/app.js",
roomLock: false, // Requires an extension to re-load the script
joinedCount: 0,
startupCap: 1, // 1-200
startupVolume: 0, // 0-100
startupEmoji: false, // true or false
autowoot: true,
autoskip: true,
cmdDeletion: true,
maximumDc: 120,
lockdownEnabled: false,
historySkip: true,
autograb: false,
timeGuard: true,
maximumSongLength: 6.20,
commandCooldown: 5,
usercommandsEnabled: true,
thorCommand: true,
thorCooldown: 5,
nahodaCommand: true,
nahodaCooldown: 30,
filterChat: true,
etaRestriction: false,
welcome: true,
minihry: false,
commandLiteral: "!",
},

room: {
            name: null,
            chatMessages: [],
            users: [],
            afkList: [],
            mutedUsers: [],
            bannedUsers: [],
            skippable: true,
            usercommand: true,
            allcommand: true,
            autoskip: true,
            autoskipTimer: null,
            queueing: 0,
            queueable: true,
            currentDJID: null,
            historyList: [],
            cycleTimer: setTimeout(function () {
            }, 1),
            roomstats: {
                accountName: null,
                totalWoots: 0,
                totalCurates: 0,
                totalMehs: 0,
                launchTime: null,
                songCount: 0,
                chatmessages: 0
            },
            messages: {
                from: [],
                to: [],
                message: []
            },
            queue: {
                id: [],
                position: []
            },
    
            usersUsedThor: [],
            duel: {
            users: [],
            stats: false,
            time: null,
            sazka: 20,
            waiting: null,
            vyhratDuel: function() {
                var msgs = [
                    'vyhrál 20 QPoints od uživatele'
                ];
                var count = 0;
                var m = msgs[Math.floor(Math.random() * msgs.length)];
                return m;
            },
            start: function() {
                basicBot.room.duel.time = setTimeout(function() {
                    basicBot.room.duel.end();
                }, 60 * 1000);
            },
            end: function() {
                var player1_duel = Math.floor(Math.random() * ((6 - 1) + 1) + 1);
                var player2_duel = Math.floor(Math.random() * ((6 - 1) + 1) + 1);
                var cislo1 = player1_duel;
                var cislo2 = player2_duel;
                if (player1_duel > player2_duel) {
                player1_duel = basicBot.room.duel.users[0];
                player2_duel = basicBot.room.duel.users[1];
                var win = basicBot.userUtilities.lookupUser(player1_duel);
                var lose = basicBot.userUtilities.lookupUser(player2_duel);
                
                 var qpoints = basicBot.room.duel.sazka;
                 var player1 = win.username;
                 var player1QP = validateTokens(player1);
                 var winqp = parseInt(player1QP, 10) + parseInt(qpoints, 10);
                 var player2 = lose.username;
                 var player2QP = validateTokens(player2);
                 var loseqp = parseInt(player2QP, 10) - parseInt(qpoints, 10);
                    localStorage.setItem(player1, winqp);
                    localStorage.setItem(player2, loseqp);
                API.sendChat("[ KOSTKY ] " + win.username + " hodil " + cislo1 + " | " + lose.username + " hodil " + cislo2 + " | Vyhrává " + win.username + " a bere si " + basicBot.room.duel.sazka + " QPoints!");
                basicBot.room.duel.stats = false;
                basicBot.room.duel.users = [];    
                }
                
                else if (player1_duel < player2_duel) {
                player1_duel = basicBot.room.duel.users[0];
                player2_duel = basicBot.room.duel.users[1];
                var win = basicBot.userUtilities.lookupUser(player2_duel);
                var lose = basicBot.userUtilities.lookupUser(player1_duel);
                
                 var qpoints = basicBot.room.duel.sazka;
                 var player1 = win.username;
                 var player1QP = validateTokens(player1);
                 var winqp = parseInt(player1QP, 10) + parseInt(qpoints, 10);
                 var player2 = lose.username;
                 var player2QP = validateTokens(player2);
                 var loseqp = parseInt(player2QP, 10) - parseInt(qpoints, 10);
                    localStorage.setItem(player1, winqp);
                    localStorage.setItem(player2, loseqp);
                 API.sendChat("[ KOSTKY ] " + win.username + " hodil " + cislo2 + " | " + lose.username + " hodil " + cislo1 + " | Vyhrává " + win.username + " a bere si " + basicBot.room.duel.sazka + " QPoints!");
                basicBot.room.duel.stats = false;
                basicBot.room.duel.users = [];   
                }
                else if (player1_duel == player2_duel) {
                var drawplayer1 = basicBot.userUtilities.lookupUser(basicBot.room.duel.users[0]);
                var drawplayer2 = basicBot.userUtilities.lookupUser(basicBot.room.duel.users[1]);
                var player1 = drawplayer1.username; 
                var player2 = drawplayer2.username;
                 API.sendChat("[ KOSTKY ] " + drawplayer1.username + " a " + drawplayer2.username + " hodili " + cislo1 + " | Duel končí remízou!");
                 basicBot.room.duel.stats = false;
                basicBot.room.duel.users = [];   
                }
               else {
             }   
           }  
                
      
},
        tipovacka: {
                currentNumber: 0,
                zapisne: 5,
                vyhra: 50,
                obtiznost: 1,
                active: false,
                countdown: null,


                hrat: function() {
                    basicBot.room.tipovacka.active = true;
                    basicBot.room.tipovacka.countdown = setTimeout(function () {
                        basicBot.room.tipovacka.endNumberGameTime();
                    }, 180 * 1000);{
                        basicBot.room.tipovacka.currentNumber = Math.floor((Math.random() * 10) + 1);
                    if (basicBot.room.tipovacka.obtiznost == 1)

            API.sendChat('[ MINIHRA | @everyone ] Uhodněte zadané číslo 1-10. Odpovídejte pomocí !t číslo a vyhrajte ' + basicBot.room.tipovacka.vyhra + ' QPoints! Pokus stojí ' + basicBot.room.tipovacka.zapisne + ' QPoints.');
                    }
                    if (basicBot.room.tipovacka.obtiznost == 2) {
                        basicBot.room.tipovacka.currentNumber = Math.floor((Math.random() * 25) + 1);
            API.sendChat('[ MINIHRA | @everyone ] Uhodněte zadané číslo 1-25. Odpovídejte pomocí !t číslo a vyhrajte ' + basicBot.room.tipovacka.vyhra + ' QPoints! Pokus stojí ' + basicBot.room.tipovacka.zapisne + ' QPoints.');

                    }
            if (basicBot.room.tipovacka.obtiznost == 3) {
                        basicBot.room.tipovacka.currentNumber = Math.floor((Math.random() * 50) + 1);
              API.sendChat('[ MINIHRA | @everyone ] Uhodněte zadané číslo 1-50. Odpovídejte pomocí !t číslo a vyhrajte ' + basicBot.room.tipovacka.vyhra + ' QPoints! Pokus stojí ' + basicBot.room.tipovacka.zapisne + ' QPoints.');

                    }
                    if (basicBot.room.tipovacka.obtiznost == 4) {
                        basicBot.room.tipovacka.currentNumber = Math.floor((Math.random() * 100) + 1);

                    API.sendChat('[ MINIHRA | @everyone ] Uhodněte zadané číslo od 1-100. Odpovídejte pomocí !t číslo a vyhrajte ' + basicBot.room.tipovacka.vyhra + ' QPoints! Pokus stojí ' + basicBot.room.tipovacka.zapisne + ' QPoints.');
          }
            if (basicBot.room.tipovacka.obtiznost == 5) {
                        var barvy = ["red","yellow","orange","blue","green","purple","brown","black","pink","white"];
                        basicBot.room.tipovacka.currentNumber = barvy[Math.floor(Math.random() * barvy.length)];
            API.sendChat('[ MINIHRA | @everyone ] Uhodněte zadanou barvu v angličtině. Odpovídejte pomocí !t text a vyhrajte ' + basicBot.room.tipovacka.vyhra + ' QPoints! Pokus stojí ' + basicBot.room.tipovacka.zapisne + ' QPoints.');
                    }


if (basicBot.room.tipovacka.obtiznost == 6) {
    var vysledek = 100 + ~~(Math.random() * 5000);
    var a = 50 + ~~(Math.random() * (vysledek / 3));
    var b = vysledek - a;
    var priklad = a + " + " + b + " = ";

    if (Date.now() % 2) {
        var tmp = a;
        a = vysledek;
        vysledek = tmp;
        priklad = a + " - " + b + " = ";
    }

    basicBot.room.tipovacka.currentNumber = vysledek;
    API.sendChat('[ MINIHRA | @everyone ] Vypočítejte příklad ' + priklad + ' :question: Odpovídejte pomocí !t číslo a vyhrajte ' + basicBot.room.tipovacka.vyhra + ' QPoints! Pokus stojí ' + basicBot.room.tipovacka.zapisne + ' QPoints.');
}
                      if (basicBot.room.tipovacka.obtiznost == 7) {
                        var otazka = ["pldjug","lakanduf","ojah","ketara","munikota","namera","bustoau","rzlizmna"];
                        var slovo = otazka[Math.floor(Math.random() * otazka.length)];

            if (slovo === "pldjug") {
            basicBot.room.tipovacka.currentNumber = "plugdj";
                    }
            if (slovo === "lakanduf") {
            basicBot.room.tipovacka.currentNumber = "kaufland";
                    }
            if (slovo === "ojah") {
            basicBot.room.tipovacka.currentNumber = "ahoj";
                    }
            if (slovo === "ketara") {
            basicBot.room.tipovacka.currentNumber = "raketa";
                    }
            if (slovo === "munikota") {
            basicBot.room.tipovacka.currentNumber = "komunita";
                    }
            if (slovo === "namera") {
            basicBot.room.tipovacka.currentNumber = "ramena";
                    }
            if (slovo === "bustoau") {
            basicBot.room.tipovacka.currentNumber = "autobus";
                    }
            if (slovo === "rzlizmna") {
            basicBot.room.tipovacka.currentNumber = "zmrzlina";
                    }
          API.sendChat('[ MINIHRA | @everyone ] Rozluštěte slovo "' + slovo + '". Odpovídejte pomocí !t text a vyhrajte ' + basicBot.room.tipovacka.vyhra + ' QPoints! Pokus stojí ' + basicBot.room.tipovacka.zapisne + ' QPoints.');
                    }
                    },


                endNumberGameTime: function() {
                    if (basicBot.room.tipovacka.active) {
                       basicBot.room.tipovacka.active = false;
                        API.sendChat('[ MINIHRA ] Nikdo neuhodl správně. Správná odpověď byla ' + basicBot.room.tipovacka.currentNumber + '!');
                        basicBot.room.tipovacka.currentNumber = 0;
                    }
                },
               endNumberGame: function(winnerID) {


                    var name = "undefined";
                    for (var i = 0; i < basicBot.room.users.length; i++) {
                        if (basicBot.room.users[i].id === winnerID) {
            if (basicBot.room.tipovacka.obtiznost == 1) {
                            name = basicBot.room.users[i].username;
                     var receiverTokens = validateTokens(name);
                    var castka = basicBot.room.tipovacka.vyhra;
                    var penize = parseInt(receiverTokens, 10) + parseInt(castka, 10);
                    localStorage.setItem(name, penize);
                            API.sendChat('[ MINIHRA ] Uživatel @' + name + ' vyhrál ' + basicBot.room.tipovacka.vyhra + ' QPoints se správnou odpovědi ' + basicBot.room.tipovacka.currentNumber + '.');
                            basicBot.room.tipovacka.active = false;
                            basicBot.room.tipovacka.currentNumber = 0;
            } else if (basicBot.room.tipovacka.obtiznost == 2) {
                name = basicBot.room.users[i].username;
                            basicBot.room.tipovacka.max = 0;
                var receiverTokens = validateTokens(name);
                    var castka = basicBot.room.tipovacka.vyhra;
                    var penize2 = parseInt(receiverTokens, 10) + parseInt(castka, 10);
                    localStorage.setItem(name, penize2);
                            API.sendChat('[ MINIHRA ] Uživatel @' + name + ' vyhrál ' + basicBot.room.tipovacka.vyhra + ' QPoints se správnou odpovědi ' + basicBot.room.tipovacka.currentNumber + '.');
                            basicBot.room.tipovacka.active = false;
              } else if (basicBot.room.tipovacka.obtiznost == 3) {
                  name = basicBot.room.users[i].username;
                var castka = basicBot.room.tipovacka.vyhra;
                var receiverTokens = validateTokens(name);
                    var penize3 = parseInt(receiverTokens, 10) + parseInt(castka, 10);
                    localStorage.setItem(name, penize3);
                            API.sendChat('[ MINIHRA ] Uživatel @' + name + ' vyhrál ' + basicBot.room.tipovacka.vyhra + ' QPoints se správnou odpovědi ' + basicBot.room.tipovacka.currentNumber + '.');
                            basicBot.room.tipovacka.active = false;
            } else if (basicBot.room.tipovacka.obtiznost == 4) {
                name = basicBot.room.users[i].username;
                var castka = basicBot.room.tipovacka.vyhra;
                var receiverTokens = validateTokens(name);
                    var penize4 = parseInt(receiverTokens, 10) + parseInt(castka, 10);
                    localStorage.setItem(name, penize4);
                            API.sendChat('[ MINIHRA ] Uživatel @' + name + ' vyhrál ' + basicBot.room.tipovacka.vyhra + ' QPoints se správnou odpovědi ' + basicBot.room.tipovacka.currentNumber + '.');
                            basicBot.room.tipovacka.active = false;
                      } else if (basicBot.room.tipovacka.obtiznost == 5) {
                 name = basicBot.room.users[i].username;
                 var castka = basicBot.room.tipovacka.vyhra;
                var receiverTokens = validateTokens(name);
                    var penize5 = parseInt(receiverTokens, 10) + parseInt(castka, 10);
                    API.sendChat('[ MINIHRA ] Uživatel @' + name + ' vyhrál ' + basicBot.room.tipovacka.vyhra + ' QPoints se správnou odpovědi ' + basicBot.room.tipovacka.currentNumber + '.');
                    localStorage.setItem(name, penize5);
                    basicBot.room.tipovacka.active = false;
    } else if (basicBot.room.tipovacka.obtiznost == 6) {
                 var castka = basicBot.room.tipovacka.vyhra;
                 name = basicBot.room.users[i].username;
                var receiverTokens = validateTokens(name);
                    var penize6 = parseInt(receiverTokens, 10) + parseInt(castka, 10);
                    localStorage.setItem(name, penize6);
                    basicBot.room.tipovacka.active = false;
                            API.sendChat('[ MINIHRA ] Uživatel @' + name + ' vyhrál ' + basicBot.room.tipovacka.vyhra + ' QPoints se správnou odpovědi ' + basicBot.room.tipovacka.currentNumber + '.');
        } else if (basicBot.room.tipovacka.obtiznost == 7) {
                 name = basicBot.room.users[i].username;
                var castka = basicBot.room.tipovacka.vyhra;
                var receiverTokens = validateTokens(name);
                    var penize7 = parseInt(receiverTokens, 10) + parseInt(castka, 10);
                    localStorage.setItem(name, penize7);
                            API.sendChat('[ MINIHRA ] Uživatel @' + name + ' vyhrál ' + basicBot.room.tipovacka.vyhra + ' QPoints se správnou odpovědi ' + basicBot.room.tipovacka.currentNumber + '.');
                         basicBot.room.tipovacka.active = false;
                    }  else {
                        return false;
                    }
                        }
                    }
                }
            },

            roulette: {
                rouletteStatus: false,
                participants: [],
                countdown: null,
                startRoulette: function () {
                    basicBot.room.roulette.rouletteStatus = true;
                    basicBot.room.roulette.countdown = setTimeout(function () {
                        basicBot.room.roulette.endRoulette();
                    }, 60 * 1000);
                    API.sendChat(basicBot.chat.isopen);
                },
                endRoulette: function () {
                    basicBot.room.roulette.rouletteStatus = false;
                    var ind = Math.floor(Math.random() * basicBot.room.roulette.participants.length);
                    var winner = basicBot.room.roulette.participants[ind];
                    basicBot.room.roulette.participants = [];
                    var cisla = ["2", "3", "1"];
                    var pos = cisla[Math.floor(Math.random() * cisla.length)];
                    var user = basicBot.userUtilities.lookupUser(winner);
                    var name = user.username;
                    API.sendChat(subChat(basicBot.chat.winnerpicked, {name: name, position: pos}));
                    setTimeout(function (winner, pos) {
                        basicBot.userUtilities.moveUser(winner, pos, false);
                    }, 1 * 1000, winner, pos);
                }
            },
            usersUsedThor: [],
        usersUsedNahoda: []
        },
        User: function (id, name) {
            this.id = id;
            this.username = name;
            this.jointime = Date.now();
            this.lastActivity = Date.now();
            this.votes = {
                woot: 0,
                meh: 0,
                curate: 0
            };
            this.lastEta = null;
            this.afkWarningCount = 0;
            this.afkCountdown = null;
            this.inRoom = true;
            this.isMuted = false;
            this.lastDC = {
                time: null,
                position: null,
                songCount: 0
            };
            this.mute = {
                time: null,
                is: false
};
            this.lastKnownPosition = null;
        this.inteligence = 0;
        this.napomenuti = 0;
        this.better = null;
        this.offered = 0;
        this.isBetting = false;
        this.toWho = null;
        this.contMehs = 0;
        },
        userUtilities: {
            getJointime: function (user) {
                return user.jointime;
            },
            getUser: function (user) {
                return API.getUser(user.id);
            },
            updatePosition: function (user, newPos) {
                user.lastKnownPosition = newPos;
            },
            updateDC: function (user) {
                user.lastDC.time = Date.now();
                user.lastDC.position = user.lastKnownPosition;
                user.lastDC.songCount = basicBot.room.roomstats.songCount;
            },
            setLastActivity: function (user) {
                user.lastActivity = Date.now();
                user.afkWarningCount = 0;
                clearTimeout(user.afkCountdown);
            },
            getLastActivity: function (user) {
                return user.lastActivity;
            },
            lookupUser: function (id) {
                for (var i = 0; i < basicBot.room.users.length; i++) {
                    if (basicBot.room.users[i].id === id) {
                        return basicBot.room.users[i];
                    }
                }
                return false;
            },
            getAllUsers: function() {
            return basicBot.room.users;
            },


            lookupUserName: function (name) {
                for (var i = 0; i < basicBot.room.users.length; i++) {
                    var match = basicBot.room.users[i].username.trim() == name.trim();
                    if (match) {
                        return basicBot.room.users[i];
                    }
                }
                return false;
            },
            voteRatio: function (id) {
                var user = basicBot.userUtilities.lookupUser(id);
                var votes = user.votes;
                if (votes.meh === 0) votes.ratio = 1;
                else votes.ratio = (votes.woot / votes.meh).toFixed(2);
                return votes;

            },
            getPermission: function (obj) { //1 requests
                var u;
                if (typeof obj === "object") u = obj;
                else u = API.getUser(obj);
                for (var i = 0; i < botCreatorIDs.length; i++) {
                    if (botCreatorIDs[i].indexOf(u.id) > -1) return 10;
                }
                if (u.gRole < 2) return u.role;
                else {
                    switch (u.gRole) {
                        case 2:
                            return 7;
                        case 3:
                            return 8;
                        case 4:
                            return 9;
                        case 5:
                            return 10;
                    }
                }
                return 0;
            },
            moveUser: function (id, pos, priority) {
                var user = basicBot.userUtilities.lookupUser(id);
                var wlist = API.getWaitList();
                if (API.getWaitListPosition(id) === -1) {
                    if (wlist.length < 50) {
                        API.moderateAddDJ(id);
                        if (pos !== 0) setTimeout(function (id, pos) {
                            API.moderateMoveDJ(id, pos);
                        }, 1250, id, pos);
                    }
                    else {
                        var alreadyQueued = -1;
                        for (var i = 0; i < basicBot.room.queue.id.length; i++) {
                            if (basicBot.room.queue.id[i] === id) alreadyQueued = i;
                        }
                        if (alreadyQueued !== -1) {
                            basicBot.room.queue.position[alreadyQueued] = pos;
                            return API.sendChat(subChat(basicBot.chat.alreadyadding, {position: basicBot.room.queue.position[alreadyQueued]}));
                        }
                        basicBot.roomUtilities.booth.lockBooth();
                        if (priority) {
                            basicBot.room.queue.id.unshift(id);
                            basicBot.room.queue.position.unshift(pos);
                        }
                        else {
                            basicBot.room.queue.id.push(id);
                            basicBot.room.queue.position.push(pos);
                        }
                        var name = user.username;
                        return API.sendChat(subChat(basicBot.chat.adding, {name: name, position: basicBot.room.queue.position.length}));
                    }
                }
                else API.moderateMoveDJ(id, pos);
            },

           dclookup: function (id) {
                var user = basicBot.userUtilities.lookupUser(id);
                if (typeof user === 'boolean') return basicBot.chat.usernotfound;
                var name = user.username;
                if (user.lastDC.time === null) return subChat(basicBot.chat.notdisconnected, {name: name});
                var dc = user.lastDC.time;
                var pos = user.lastDC.position;
                if (pos === null) return basicBot.chat.noposition;
                var timeDc = Date.now() - dc;
                var validDC = false;
                if (basicBot.settings.maximumDc * 60 * 1000 > timeDc) {
                    validDC = true;
                }
                var time = basicBot.roomUtilities.msToStr(timeDc);
                if (!validDC) return (subChat(basicBot.chat.toolongago, {name: basicBot.userUtilities.getUser(user).username, time: time}));
                var songsPassed = basicBot.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = basicBot.room.afkList;
                for (var i = 0; i < afkList.length; i++) {
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if (dc < timeAfk && posAfk < pos) {
                        afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if (newPosition <= 0) return subChat(basicBot.chat.notdisconnected, {name: name});
                var msg = subChat(basicBot.chat.valid, {name: basicBot.userUtilities.getUser(user).username, time: time, position: newPosition});
                basicBot.userUtilities.moveUser(user.id, newPosition, true);
                return msg;
            },
dclookupOnUserJoin: function (id) {
                var user = basicBot.userUtilities.lookupUser(id);
                if (typeof user === 'boolean') return;
                var name = user.username;
                if (user.lastDC.time === null) return;
                var dc = user.lastDC.time;
                var pos = user.lastDC.position;
                if (pos === null) return;
                var timeDc = Date.now() - dc;
                var validDC = false;
                if (basicBot.settings.maximumDc * 60 * 1000 > timeDc) {
                    validDC = true;
                }
                var time = basicBot.roomUtilities.msToStr(timeDc);
                if (!validDC) return;
                var songsPassed = basicBot.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = basicBot.room.afkList;
                for (var i = 0; i < afkList.length; i++) {
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if (dc < timeAfk && posAfk < pos) {
                        afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if (newPosition <= 0) return;
                var msg = subChat(basicBot.chat.valid, {name: basicBot.userUtilities.getUser(user).username, time: time, position: newPosition});
                basicBot.userUtilities.moveUser(user.id, newPosition, true);
                return msg;
            }
        },

        roomUtilities: {
            rankToNumber: function (rankString) {
                var rankInt = null;
                switch (rankString) {
                    case "admin":
                        rankInt = 10;
                        break;
                    case "ambassador":
                        rankInt = 7;
                        break;
                    case "host":
                        rankInt = 5;
                        break;
                    case "cohost":
                        rankInt = 4;
                        break;
                    case "manager":
                        rankInt = 3;
                        break;
                    case "bouncer":
                        rankInt = 2;
                        break;
                    case "residentdj":
                        rankInt = 1;
                        break;
                    case "user":
                        rankInt = 0;
                        break;
                }
                return rankInt;
            },
            msToStr: function (msTime) {
                var ms, msg, timeAway;
                msg = '';
                timeAway = {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'seconds': 0
                };
                ms = {
                    'day': 24 * 60 * 60 * 1000,
                    'hour': 60 * 60 * 1000,
                    'minute': 60 * 1000,
                    'second': 1000
                };
                if (msTime > ms.day) {
                    timeAway.days = Math.floor(msTime / ms.day);
                    msTime = msTime % ms.day;
                }
                if (msTime > ms.hour) {
                    timeAway.hours = Math.floor(msTime / ms.hour);
                    msTime = msTime % ms.hour;
                }
                if (msTime > ms.minute) {
                    timeAway.minutes = Math.floor(msTime / ms.minute);
                    msTime = msTime % ms.minute;
                }
                if (msTime > ms.second) {
                    timeAway.seconds = Math.floor(msTime / ms.second);
                }
                if (timeAway.days !== 0) {
                    msg += timeAway.days.toString() + 'd';
                }
                if (timeAway.hours !== 0) {
                    msg += timeAway.hours.toString() + 'h';
                }
                if (timeAway.minutes !== 0) {
                    msg += timeAway.minutes.toString() + 'm';
                }
                if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
                    msg += timeAway.seconds.toString() + 's';
                }
                if (msg !== '') {
                    return msg;
                } else {
                    return false;
                }
            },

         },
        eventChat: function (chat) {
            chat.message = linkFixer(chat.message);
            chat.message = decodeEntities(chat.message);
            chat.message = chat.message.trim();

            basicBot.room.chatMessages.push([chat.cid, chat.message, chat.sub, chat.timestamp, chat.type, chat.uid, chat.un]);

            for (var i = 0; i < basicBot.room.users.length; i++) {
                if (basicBot.room.users[i].id === chat.uid) {
                    basicBot.userUtilities.setLastActivity(basicBot.room.users[i]);
                    if (basicBot.room.users[i].username !== chat.un) {
                        basicBot.room.users[i].username = chat.un;
                    }
                }
            }
            if (basicBot.chatUtilities.chatFilter(chat)) return void (0);
            if (!basicBot.chatUtilities.commandCheck(chat))
                basicBot.chatUtilities.action(chat);



        },
        eventUserjoin: function (user) {
            var known = false;
            var index = null;
            for (var i = 0; i < basicBot.room.users.length; i++) {
                if (basicBot.room.users[i].id === user.id) {
                    known = true;
                    index = i;
                }
            }
            var greet = true;
            var welcomeback = null;
            if (known) {
                basicBot.room.users[index].inRoom = true;
                var u = basicBot.userUtilities.lookupUser(user.id);
                var jt = u.jointime;
                var t = Date.now() - jt;
                if (t < 10 * 1000) greet = false;
                else welcomeback = true;
            }
            else {
                basicBot.room.users.push(new basicBot.User(user.id, user.username));
                welcomeback = false;
            }
            for (var j = 0; j < basicBot.room.users.length; j++) {
                if (basicBot.userUtilities.getUser(basicBot.room.users[j]).id === user.id) {
                    basicBot.userUtilities.setLastActivity(basicBot.room.users[j]);
                    basicBot.room.users[j].jointime = Date.now();
                }

            }
            if (basicBot.settings.welcome && greet) {
                welcomeback ?
                    setTimeout(function (user) {
                        API.sendChat(subChat(basicBot.chat.welcomeback, {name: user.username}));
                    }, 1 * 1000, user)
                    :
                    setTimeout(function (user) {
                        API.sendChat(subChat(basicBot.chat.welcome, {name: user.username}));
                    }, 1 * 1000, user);
            }
            var automatickeDC = basicBot.userUtilities.dclookupOnUserJoin(user.id);
            if (typeof automatickeDC === "string") setTimeout(function(){ API.sendChat(automatickeDC); }, 4000);

            basicBot.settings.joinedCount += 1;
        },
        eventUserleave: function (user) {
            var lastDJ = API.getHistory()[0].user.id;
            for (var i = 0; i < basicBot.room.users.length; i++) {
                if (basicBot.room.users[i].id === user.id) {
                    basicBot.userUtilities.updateDC(basicBot.room.users[i]);
                    basicBot.room.users[i].inRoom = false;
                    if (lastDJ == user.id){
                        var user = basicBot.userUtilities.lookupUser(basicBot.room.users[i].id);
                        basicBot.userUtilities.updatePosition(user, 0);
                        user.lastDC.time = null;
                        user.lastDC.position = user.lastKnownPosition;
                    }
                }
            }
        },
        eventVoteupdate: function (obj) {
            for (var i = 0; i < basicBot.room.users.length; i++) {
                if (basicBot.room.users[i].id === obj.user.id) {
                    if (obj.vote === 1) {
                        basicBot.room.users[i].votes.woot++;
                    }
                    else {
                        basicBot.room.users[i].votes.meh++;
            var receiverTokens = validateTokens(obj.user.username);
            receiverTokens -= 1
           localStorage.setItem(obj.user.username, receiverTokens);
           API.chatLog("[" + obj.user.username + "] Stratil jsi 1 QPoints za mehnutí písně!");

                    }
                }
            }

            var mehs = API.getScore().negative;
            var woots = API.getScore().positive;
            var dj = API.getDJ();
            var timeLeft = API.getTimeRemaining();
            var timeElapsed = API.getTimeElapsed();

            if (basicBot.settings.voteSkip) {
                if ((mehs - woots) >= (basicBot.settings.voteSkipLimit)) {
                    API.sendChat(subChat(basicBot.chat.voteskipexceededlimit, {name: dj.username, limit: basicBot.settings.voteSkipLimit}));
                    if (basicBot.settings.smartSkip && timeLeft > timeElapsed){
                        basicBot.roomUtilities.smartSkip();
                    }
                    else {
                        API.moderateForceSkip();
                    }
                }
            }

        },
        eventCurateupdate: function (obj) {
            for (var i = 0; i < basicBot.room.users.length; i++) {
                if (basicBot.room.users[i].id === obj.user.id) {
                    basicBot.room.users[i].votes.curate++;



                }
            }
        },
        eventDjadvance: function (obj) {
//Vydelavani

       var reward = (obj.lastPlay.score.positive * 1) + (obj.lastPlay.score.grabs * 2) - (obj.lastPlay.score.negative * 1);
            var lastdjplayed = basicBot.userUtilities.lookupUser(obj.lastPlay.dj.id);
            var msg = chat.message;
        var reward2 = (obj.lastPlay.score.positive * 2) + (obj.lastPlay.score.grabs * 2) - (obj.lastPlay.score.negative * 1);
                    var receiverTokens = validateTokens(lastdjplayed.username);
            var cislo = parseInt(receiverTokens, 10) + parseInt(reward,10);
            var cislo2 = parseInt(receiverTokens, 10) + parseInt(reward2,10);


           if (Math.round(API.getWaitList().length * 1) >= 15) {
           localStorage.setItem(lastdjplayed.username, cislo2);
           API.sendChat("[" + lastdjplayed.username + "] Získal/a jsi " + reward2 + " QPoints za odehrání písně!");
            } else {
          localStorage.setItem(lastdjplayed.username, cislo);
            API.sendChat("[" + lastdjplayed.username + "] Získal/a jsi " + reward + " QPoints za odehrání písně!");
         }


        if (basicBot.settings.autowoot) {
                $("#woot").click(); // autowoot
            }

            var user = basicBot.userUtilities.lookupUser(obj.dj.id)
            for(var i = 0; i < basicBot.room.users.length; i++){
                if(basicBot.room.users[i].id === user.id){
                    basicBot.room.users[i].lastDC = {
                        time: null,
                        position: null,
                        songCount: 0
                    };
                }
            }

            var lastplay = obj.lastPlay;
            if (typeof lastplay === 'undefined') return;
            if (basicBot.settings.songstats) {
                if (typeof basicBot.chat.songstatistics === "undefined") {
                    API.sendChat("" + lastplay.media.author + " - " + lastplay.media.title + ": " + lastplay.score.positive + ":+1: | " + lastplay.score.grabs + ":star: | " + lastplay.score.negative + ":-1:")
                }
                else {
                    API.sendChat(subChat(basicBot.chat.songstatistics, {artist: lastplay.media.author, title: lastplay.media.title, woots: lastplay.score.positive, grabs: lastplay.score.grabs, mehs: lastplay.score.negative}))
                }
            }
            basicBot.room.roomstats.totalWoots += lastplay.score.positive;
            basicBot.room.roomstats.totalMehs += lastplay.score.negative;
            basicBot.room.roomstats.totalCurates += lastplay.score.grabs;
            basicBot.room.roomstats.songCount++;
            basicBot.room.currentDJID = obj.dj.id;

            var newMedia = obj.media;
            var timeLimitSkip = setTimeout(function () {
                if (basicBot.settings.timeGuard && newMedia.duration > basicBot.settings.maximumSongLength * 60 && !basicBot.room.roomevent) {
                    var name = obj.dj.username;
                    API.sendChat(subChat(basicBot.chat.timelimit, {name: name, maxlength: basicBot.settings.maximumSongLength}));
                    if (basicBot.settings.smartSkip){
                        return basicBot.roomUtilities.smartSkip();
                    }
                    else {
                        return API.moderateForceSkip();
                    }
                }
            }, 2000);
            var format = obj.media.format;
            var cid = obj.media.cid;
            var naSkip = setTimeout(function () {
                if (format == 1){
                    $.getJSON('https://www.googleapis.com/youtube/v3/videos?id=' + cid + '&key=AIzaSyDcfWu9cGaDnTjPKhg_dy9mUh6H7i4ePZ0&part=snippet&callback=?', function (track){
                        if (typeof(track.items[0]) === 'undefined'){
                            var name = obj.dj.username;
                            API.sendChat(subChat(basicBot.chat.notavailable, {name: name}));
                            if (basicBot.settings.smartSkip){
                                return basicBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                }
                else {
                    var checkSong = SC.get('/tracks/' + cid, function (track){
                        if (typeof track.title === 'undefined'){
                            var name = obj.dj.username;
                            API.sendChat(subChat(basicBot.chat.notavailable, {name: name}));
                            if (basicBot.settings.smartSkip){
                                return basicBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    });
                }
            }, 2000);
            clearTimeout(historySkip);
            if (basicBot.settings.historySkip) {
                var alreadyPlayed = false;
                var apihistory = API.getHistory();
                var name = obj.dj.username;
                var historySkip = setTimeout(function () {
                    for (var i = 0; i < apihistory.length; i++) {
                        if (apihistory[i].media.cid === obj.media.cid) {
                            basicBot.room.historyList[i].push(+new Date());
                            alreadyPlayed = true;
                            API.sendChat(subChat(basicBot.chat.songknown, {name: name}));
                            if (basicBot.settings.smartSkip){
                                return basicBot.roomUtilities.smartSkip();
                            }
                            else {
                                return API.moderateForceSkip();
                            }
                        }
                    }
                    if (!alreadyPlayed) {
                        basicBot.room.historyList.push([obj.media.cid, +new Date()]);
                    }
                }, 2000);
            }

if(basicBot.settings.autograb){
$("#grab").click();
$(".pop-menu ul li:first-child").mousedown();
}


             clearTimeout(basicBot.room.autoskipTimer);
            if (basicBot.settings.autoskip) {
                var remaining = obj.media.duration * 1000;
                var startcid = API.getMedia().cid;
                basicBot.room.autoskipTimer = setTimeout(function() {
                    var endcid = API.getMedia().cid;
                    if (startcid === endcid) {
                        //API.sendChat('Song stuck, skipping...');
                        API.moderateForceSkip();
                    }
                }, remaining + 5000);
            }
            storeToStorage();
            sendToSocket();
        },

        eventWaitlistupdate: function (users) {
            if (users.length < 50) {
                if (basicBot.room.queue.id.length > 0 && basicBot.room.queueable) {
                    basicBot.room.queueable = false;
                    setTimeout(function () {
                        basicBot.room.queueable = true;
                    }, 500);
                    basicBot.room.queueing++;
                    var id, pos;
                    setTimeout(
                        function () {
                            id = basicBot.room.queue.id.splice(0, 1)[0];
                            pos = basicBot.room.queue.position.splice(0, 1)[0];
                            API.moderateAddDJ(id, pos);
                            setTimeout(
                                function (id, pos) {
                                    API.moderateMoveDJ(id, pos);
                                    basicBot.room.queueing--;
                                    if (basicBot.room.queue.id.length === 0) setTimeout(function () {
                                        basicBot.roomUtilities.booth.unlockBooth();
                                    }, 1000);
                                }, 1000, id, pos);
                        }, 1000 + basicBot.room.queueing * 2500);
                }
            }
            for (var i = 0; i < users.length; i++) {
                var user = basicBot.userUtilities.lookupUser(users[i].id);
                basicBot.userUtilities.updatePosition(user, API.getWaitListPosition(users[i].id) + 1);
            }
        },

        chatcleaner: function (chat) {
            if (!basicBot.settings.filterChat) return false;
            if (basicBot.userUtilities.getPermission(chat.uid) > 1) return false;
            var msg = chat.message;
            var containsLetters = false;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
            }
            if (msg === '') {
                return true;
            }
            if (!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
            msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&@#]/g, '');
            var capitals = 0;
            var ch;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if (ch >= 'A' && ch <= 'Z') capitals++;
            }
            if (capitals >= 40) {
                API.sendChat(subChat(basicBot.chat.caps, {name: chat.un}));
                return true;
            }

            for (var j = 0; j < basicBot.chatUtilities.spam.length; j++) {
                if (msg === basicBot.chatUtilities.spam[j]) {
                    API.sendChat(subChat(basicBot.chat.spam, {name: chat.un}));
                    return true;
                }
            }
            return false;
        },
        chatUtilities: {
            chatFilter: function (chat) {
                var msg = chat.message;
                var perm = basicBot.userUtilities.getPermission(chat.uid);
                var user = basicBot.userUtilities.lookupUser(chat.uid);
                var isMuted = false;
                for (var i = 0; i < basicBot.room.mutedUsers.length; i++) {
                    if (basicBot.room.mutedUsers[i] === chat.uid) isMuted = true;
                }
                if (isMuted) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (basicBot.settings.lockdownEnabled) {
                    if (perm === 0) {
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                if (basicBot.chatcleaner(chat)) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (basicBot.settings.cmdDeletion && msg.startsWith(basicBot.settings.commandLiteral)) {
                    API.moderateDeleteChat(chat.cid);
               }



                var rlJoinChat = basicBot.chat.roulettejoin;
                var rlLeaveChat = basicBot.chat.rouletteleave;

                var joinedroulette = rlJoinChat.split('%%NAME%%');
                if (joinedroulette[1].length > joinedroulette[0].length) joinedroulette = joinedroulette[1];
                else joinedroulette = joinedroulette[0];

                var leftroulette = rlLeaveChat.split('%%NAME%%');
                if (leftroulette[1].length > leftroulette[0].length) leftroulette = leftroulette[1];
                else leftroulette = leftroulette[0];

                if ((msg.indexOf(joinedroulette) > -1 || msg.indexOf(leftroulette) > -1) && chat.uid === basicBot.loggedInID) {
                    setTimeout(function (id) {
                        API.moderateDeleteChat(id);
                    }, 5 * 1000, chat.cid);
                    return true;
                }
                return false;
            },
            commandCheck: function (chat) {
                var cmd;
                if (chat.message.charAt(0) === basicBot.settings.commandLiteral) {
                    var space = chat.message.indexOf(' ');
                    if (space === -1) {
                        cmd = chat.message;
                    }
                    else cmd = chat.message.substring(0, space);
                }
                else return false;
                var userPerm = basicBot.userUtilities.getPermission(chat.uid);
                //console.log("name: " + chat.un + ", perm: " + userPerm);
                if (chat.message !== basicBot.settings.commandLiteral + 'join' && chat.message !== basicBot.settings.commandLiteral + "leave") {
                    if (userPerm === 0 && !basicBot.room.usercommand) return void (0);
                    if (!basicBot.room.allcommand) return void (0);
                }
                if (chat.message === basicBot.settings.commandLiteral + 'eta' && basicBot.settings.etaRestriction) {
                    if (userPerm < 2) {
                        var u = basicBot.userUtilities.lookupUser(chat.uid);
                        if (u.lastEta !== null && (Date.now() - u.lastEta) < 1 * 60 * 60 * 1000) {
                            API.moderateDeleteChat(chat.cid);
                            return void (0);
                        }
                        else u.lastEta = Date.now();
                    }
                }
                var executed = false;

                for (var comm in basicBot.commands) {
                    var cmdCall = basicBot.commands[comm].command;
                    if (!Array.isArray(cmdCall)) {
                        cmdCall = [cmdCall]
                    }
                    for (var i = 0; i < cmdCall.length; i++) {
                        if (basicBot.settings.commandLiteral + cmdCall[i] === cmd) {
                            basicBot.commands[comm].functionality(chat, basicBot.settings.commandLiteral + cmdCall[i]);
                            executed = true;
                            break;
                        }
                    }
                }

                if (executed && userPerm === 0) {
                    basicBot.room.usercommand = false;
                    setTimeout(function () {
                        basicBot.room.usercommand = true;
                    }, basicBot.settings.commandCooldown * 1000);
                }
                if (executed) {
                    /*if (basicBot.settings.cmdDeletion) {
                        API.moderateDeleteChat(chat.cid);
                    }*/

                    //basicBot.room.allcommand = false;
                    //setTimeout(function () {
                        basicBot.room.allcommand = true;
                    //}, 5 * 1000);
                }
                return executed;
            },

            action: function (chat) {
                var user = basicBot.userUtilities.lookupUser(chat.uid);
                if (chat.type === 'message') {
                    for (var j = 0; j < basicBot.room.users.length; j++) {
                        if (basicBot.userUtilities.getUser(basicBot.room.users[j]).id === chat.uid) {
                            basicBot.userUtilities.setLastActivity(basicBot.room.users[j]);
                        }

                    }
                }
                basicBot.room.roomstats.chatmessages++;
            },
            spam: [
                'hueh', 'hu3', 'brbr', 'heu', 'brbr', 'kkkk', 'spoder', 'mafia', 'zuera', 'zueira',
                'zueria', 'aehoo', 'aheu', 'alguem', 'algum', 'brazil', 'zoeira', 'fuckadmins', 'affff', 'vaisefoder', 'huenaarea',
                'hitler', 'ashua', 'ahsu', 'ashau', 'lulz', 'huehue', 'hue', 'huehuehue', 'merda', 'pqp', 'puta', 'mulher', 'pula', 'retarda', 'caralho', 'filha', 'ppk',
                'gringo', 'fuder', 'foder', 'hua', 'ahue', 'modafuka', 'modafoka', 'mudafuka', 'mudafoka', 'ooooooooooooooo', 'foda'
            ],
            curses: [
                'nigger', 'faggot', 'nigga', 'niqqa', 'motherfucker', 'modafocka'
            ]
        },
        connectAPI: function () {
            this.proxy = {
                eventChat: $.proxy(this.eventChat, this),
                eventUserskip: $.proxy(this.eventUserskip, this),
                eventUserjoin: $.proxy(this.eventUserjoin, this),
                eventUserleave: $.proxy(this.eventUserleave, this),
                //eventFriendjoin: $.proxy(this.eventFriendjoin, this),
                eventVoteupdate: $.proxy(this.eventVoteupdate, this),
                eventCurateupdate: $.proxy(this.eventCurateupdate, this),
                eventRoomscoreupdate: $.proxy(this.eventRoomscoreupdate, this),
                eventDjadvance: $.proxy(this.eventDjadvance, this),
                //eventDjupdate: $.proxy(this.eventDjupdate, this),
                eventWaitlistupdate: $.proxy(this.eventWaitlistupdate, this),
                eventVoteskip: $.proxy(this.eventVoteskip, this),
                eventModskip: $.proxy(this.eventModskip, this),
                eventChatcommand: $.proxy(this.eventChatcommand, this),
                eventHistoryupdate: $.proxy(this.eventHistoryupdate, this),

            };
            API.on(API.CHAT, this.proxy.eventChat);
            API.on(API.USER_SKIP, this.proxy.eventUserskip);
            API.on(API.USER_JOIN, this.proxy.eventUserjoin);
            API.on(API.USER_LEAVE, this.proxy.eventUserleave);
            API.on(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.on(API.GRAB_UPDATE, this.proxy.eventCurateupdate);
            API.on(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.on(API.ADVANCE, this.proxy.eventDjadvance);
            API.on(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.on(API.MOD_SKIP, this.proxy.eventModskip);
            API.on(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.on(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        disconnectAPI: function () {
            API.off(API.CHAT, this.proxy.eventChat);
            API.off(API.USER_SKIP, this.proxy.eventUserskip);
            API.off(API.USER_JOIN, this.proxy.eventUserjoin);
            API.off(API.USER_LEAVE, this.proxy.eventUserleave);
            API.off(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.off(API.CURATE_UPDATE, this.proxy.eventCurateupdate);
            API.off(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.off(API.ADVANCE, this.proxy.eventDjadvance);
            API.off(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.off(API.MOD_SKIP, this.proxy.eventModskip);
            API.off(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.off(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        startup: function () {
            Function.prototype.toString = function () {
                return 'Function.'
            };
            var u = API.getUser();
            if (basicBot.userUtilities.getPermission(u) < 2) return API.chatLog(basicBot.chat.greyuser);
            if (basicBot.userUtilities.getPermission(u) === 2) API.chatLog(basicBot.chat.bouncer);
            basicBot.connectAPI();
            API.moderateDeleteChat = function (cid) {
                $.ajax({
                    url: "https://plug.dj/_/chat/" + cid,
                    type: "DELETE"
                })
            };

            basicBot.room.name = window.location.pathname;
            var Check;

            console.log(basicBot.room.name);

            var detect = function(){
                if(basicBot.room.name != window.location.pathname){
                    console.log("Killing bot after room change.");
                    storeToStorage();
                    basicBot.disconnectAPI();
                    setTimeout(function () {
                        kill();
                    }, 1000);
                    if (basicBot.settings.roomLock){
                        window.location = 'https://plug.dj' + basicBot.room.name;
                    }
                    else {
                        clearInterval(Check);
                    }
                }
            };

            Check = setInterval(function(){ detect() }, 2000);

            retrieveSettings();
            retrieveFromStorage();
            window.bot = basicBot;

            if (basicBot.room.roomstats.launchTime === null) {
                basicBot.room.roomstats.launchTime = Date.now();
            }

            for (var j = 0; j < basicBot.room.users.length; j++) {
                basicBot.room.users[j].inRoom = false;
            }
            var userlist = API.getUsers();
            for (var i = 0; i < userlist.length; i++) {
                var known = false;
                var ind = null;
                for (var j = 0; j < basicBot.room.users.length; j++) {
                    if (basicBot.room.users[j].id === userlist[i].id) {
                        known = true;
                        ind = j;
                    }
                }
                if (known) {
                    basicBot.room.users[ind].inRoom = true;
                }
                else {
                    basicBot.room.users.push(new basicBot.User(userlist[i].id, userlist[i].username));
                    ind = basicBot.room.users.length - 1;
                }
                var wlIndex = API.getWaitListPosition(basicBot.room.users[ind].id) + 1;
                basicBot.userUtilities.updatePosition(basicBot.room.users[ind], wlIndex);
            };

            basicBot.loggedInID = API.getUser().id;
            basicBot.status = true;
            API.sendChat('/cap ' + basicBot.settings.startupCap);
            API.setVolume(basicBot.settings.startupVolume);
            if (basicBot.settings.autowoot) {
                $("#woot").click();
            }
            if (basicBot.settings.startupEmoji) {
                var emojibuttonoff = $(".icon-emoji-off");
                if (emojibuttonoff.length > 0) {
                    emojibuttonoff[0].click();
                }
                API.chatLog(':smile: Emojis enabled.');
            }
            else {
                var emojibuttonon = $(".icon-emoji-on");
                if (emojibuttonon.length > 0) {
                    emojibuttonon[0].click();
                }
                API.chatLog('Emojis disabled.');
            }
            API.chatLog('Avatars capped at ' + basicBot.settings.startupCap);
            API.chatLog('Volume set to ' + basicBot.settings.startupVolume);
            socket();
            loadChat(API.chatLog(subChat(basicBot.chat.online, {botname: basicBot.settings.botName, version: basicBot.version})));
        },
        commands: {
            executable: function (minRank, chat) {
                var id = chat.uid;
                var perm = basicBot.userUtilities.getPermission(id);
                var minPerm;
                switch (minRank) {
                    case 'admin':
                        minPerm = 10;
                        break;
                    case 'ambassador':
                        minPerm = 7;
                        break;
                    case 'host':
                        minPerm = 5;
                        break;
                    case 'cohost':
                        minPerm = 4;
                        break;
                    case 'manager':
                        minPerm = 3;
                        break;
                    case 'mod':
                        if (basicBot.settings.bouncerPlus) {
                            minPerm = 2;
                        }
                        else {
                            minPerm = 3;
                        }
                        break;
                    case 'bouncer':
                        minPerm = 2;
                        break;
                    case 'residentdj':
                        minPerm = 1;
                        break;
                    case 'user':
                        minPerm = 0;
                        break;
                    default:
                        API.chatLog('error assigning minimum permission');
                }
                return perm >= minPerm;

            },
            /**
             command: {
                        command: 'cmd',
                        rank: 'user/bouncer/mod/manager',
                        type: 'startsWith/exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !basicBot.commands.executable(this.rank, chat) ) return void (0);
                                else{

                                }
                        }
                },
             **/

autoskipCommand: {
command: ['autoskip', 'as'],
rank: 'bouncer',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

if (basicBot.settings.autoskip){
basicBot.settings.autoskip = !basicBot.settings.autoskip;
clearTimeout(basicBot.room.autoskipTimer);
return API.sendChat(subChat(basicBot.chat.toggleoff, {name: chat.un, 'function': basicBot.chat.autoskip}));
}

else{
basicBot.settings.autoskip = !basicBot.settings.autoskip;
return API.sendChat(subChat(basicBot.chat.toggleon, {name: chat.un, 'function': basicBot.chat.autoskip}));
}

}
}
},

autograbCommand: {
command: ['autograb', 'ag'],
rank: 'manager',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

if (basicBot.settings.autograb){
basicBot.settings.autograb = !basicBot.settings.autograb;
API.sendChat(subChat(basicBot.chat.toggleoff, {name: chat.un, 'function': basicBot.chat.autograb}));
}

else{
basicBot.settings.autograb = !basicBot.settings.autograb;
API.sendChat(subChat(basicBot.chat.toggleon, {name: chat.un, 'function': basicBot.chat.autograb}));
}

}
}
},

clearchatCommand: {
command: ['clearchat', 'cc'],
rank: 'manager',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var currentchat = $('#chat-messages').children();

for (var i = 0; i < currentchat.length; i++){
API.moderateDeleteChat(currentchat[i].getAttribute("data-cid"));
}

return API.sendChat(subChat(basicBot.chat.chatcleared, {name: chat.un}));

}
}
},

cmddeletionCommand: {
command: ['commanddeletion', 'cmddel'],
rank: 'manager',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

if (basicBot.settings.cmdDeletion){
basicBot.settings.cmdDeletion = !basicBot.settings.cmdDeletion;
API.sendChat(subChat(basicBot.chat.toggleoff, {name: chat.un, 'function': basicBot.chat.cmddeletion}));
}

else{
basicBot.settings.cmdDeletion = !basicBot.settings.cmdDeletion;
API.sendChat(subChat(basicBot.chat.toggleon, {name: chat.un, 'function': basicBot.chat.cmddeletion}));
}

}
}
},
 
resetbodyCommand: {
command: 'resetqp',  //The command to be called. With the standard command literal this would be: !cleartokens
rank: 'cohost', //Minimum user permission to use the command
type: 'exact', //Specify if it can accept variables or not (if so, these have to be handled yourself through the chat.message
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!bot.commands.executable(this.rank, chat)) return void (0);
else{

localStorage.clear();

API.sendChat("[ OZNAM | @everyone ] Vedenie komunity resetovalo QPoints všetkým užívateľom.");

}
}
},

poslatCommand: {
command: ['poslat', 'send'],  //The command to be called. With the standard command literal this would be: !tip
rank: 'user', //Minimum user permission to use the command
type: 'startsWith', //Specify if it can accept variables or not (if so, these have to be handled yourself through the chat.message
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{
}

function validateTokens(user){

var tokens;

//Check for existing user tokens
if (localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined"){
localStorage.setItem(user, "0");
tokens = localStorage.getItem(user);
}

else if (localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined"){
tokens = localStorage.getItem(user);
}

else{
tokens = localStorage.getItem(user);
}

return ~~tokens;

}

var msg = chat.message;
var space = msg.indexOf(' ');
var lastSpace = msg.lastIndexOf(' ');
var receiver = msg.substring(msg.indexOf("@") + 1);
var giverTokens = validateTokens(chat.un);
var receiverTokens = validateTokens(receiver);
var strhnout = parseInt(msg.substring(cmd.length + 1, lastSpace));
var currentDJ = API.getDJ().username;
var cislo = parseInt(receiverTokens, 10) + parseInt(strhnout,10);

if (giverTokens < strhnout){
return API.sendChat("[@"+ chat.un +"] Nemáš dostatek QPoints k zaslání dárku!");
}

else if (receiver === chat.un){
return API.sendChat("[@" + chat.un + "] Musíš zvolit uživatele k zaslání QPoints!");
}

else if (strhnout < 1){
return API.sendChat("[@" + chat.un + "] Nemůžeš posílat QPoints v záporných hodnotách!");
}

else{
giverTokens -= strhnout;
localStorage.setItem(chat.un, giverTokens);

if (space === -1){
localStorage.setItem(currentDJ, cislo);
return API.sendChat("[ DÁREK ] Uživatel " + chat.un + " poslal " + strhnout + " QPoints uživateľovi " + currentDJ + "");
}

else{
localStorage.setItem(receiver, cislo);
return API.sendChat("[ DÁREK ] Uživatel " + chat.un + " poslal " + strhnout + " QPoints uživateľovi " + receiver + "");
}

}

}
},

spustitminihruCommand: {
command: 'sm',
rank: 'manager',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) {return void (0);}
if (!basicBot.commands.executable(this.rank, chat)) {return void (0);}

basicBot.room.tipovacka.hrat();

}
},

stopCommand: {
command: 'stop',
rank: 'manager',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) {return void (0);}
if (!basicBot.commands.executable(this.rank, chat)) {return void (0);}

basicBot.room.tipovacka.endNumberGameTime();

}
},

minihraCommand: {
command: 'minihra',
rank: 'manager',
type: 'startsWith',
functionality: function (chat, cmd) {
if (!basicBot.commands.executable(this.rank, chat)) {return void (0);}
if (chat.message.length < 6) {return void (0);}
if (basicBot.room.tipovacka.active) {
API.sendChat("[@" + chat.un + "] Nelze změnit nastavení během probíhající minihry!");
}

var gn = chat.message.substring(cmd.length + 1);
var gni = parseInt(gn);
var lastSpace = chat.message.lastIndexOf(' ');
var pokus = chat.message.substring(chat.message.indexOf(gn)+1,chat.message.length);
var pokus2 = parseInt(pokus);
var vyhra = chat.message.substring(lastSpace + 1);
var vyhra2 = parseInt(vyhra);
var from = chat.un;
basicBot.room.tipovacka.obtiznost = gni;
basicBot.room.tipovacka.zapisne = pokus2;
basicBot.room.tipovacka.vyhra = vyhra2;
var tos = "undefined";

if (gni === 1){
tos = "Tipování čísel (1-10)";
}

if (gni === 2){
tos = "Tipování čísel (1-25)";
}

if (gni === 3){
tos = "Tipování čísel (1-50)";
}

if (gni === 4){
tos = "Tipování čísel (1-100)";
}

if (gni === 5){
tos = "Tipování barev v angličtině";
}

if (gni === 6){
tos = "Matematika";
}
if (gni === 7){
tos = "Luštění slov";
}

API.sendChat('[@' + from + '] Typ: ' + tos + ' | Cena pokusu: ' + pokus2 + ' QP | Výhra: ' + vyhra2 + ' QP');

}
},

tipCommand: {
command: ['t'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (chat.message.length < 3) { return void (0); }
if (!basicBot.room.tipovacka.active) { return void (0); }


function validateTokens(user){

var tokens;

//Check for existing user tokens
if (localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined"){
localStorage.setItem(user, "0");
tokens = localStorage.getItem(user);
}

else if (localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined"){
tokens = localStorage.getItem(user);
}

else{
tokens = localStorage.getItem(user);
}

return tokens;

}

var gn = chat.message.substring(cmd.length + 1);
var gni = parseInt(gn);
var giverTokens = validateTokens(chat.un);

if (giverTokens < basicBot.room.tipovacka.zapisne){
return API.sendChat("[@" + chat.un + "] Pokus stojí " + basicBot.room.tipovacka.zapisne + " QPoints!");
}

if (gni === basicBot.room.tipovacka.currentNumber || gn === basicBot.room.tipovacka.currentNumber.toString()){
basicBot.room.tipovacka.endNumberGame(chat.uid);
}


else if (basicBot.room.tipovacka.obtiznost == 5){
giverTokens -= basicBot.room.tipovacka.zapisne;
localStorage.setItem(chat.un, giverTokens);
API.sendChat('[@' + chat.un + '] Špatná odpověď: ' + gn + '');
}

else if (basicBot.room.tipovacka.obtiznost == 7){
giverTokens -= basicBot.room.tipovacka.zapisne;
localStorage.setItem(chat.un, giverTokens);
API.sendChat('[@' + chat.un + '] Špatná odpověď: ' + gn + '');
}

else{
giverTokens -= basicBot.room.tipovacka.zapisne;
localStorage.setItem(chat.un, giverTokens);
API.sendChat('[@' + chat.un + '] Špatné číslo: ' + gn + '');


}
}
},

pridelitbodyCommand: {
command: ['pridelitbody', 'give'],  //The command to be called. With the standard command literal this would be: !tip
rank: 'manager', //Minimum user permission to use the command
type: 'startsWith', //Specify if it can accept variables or not (if so, these have to be handled yourself through the chat.message
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{
}

function validateTokens(user){

var tokens;

//Check for existing user tokens
if (localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined"){
localStorage.setItem(user, "0");
tokens = localStorage.getItem(user);
}

else if (localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined"){
tokens = localStorage.getItem(user);
}

else{
tokens = localStorage.getItem(user);
}

return tokens;

}
var msg = chat.message;
var space = msg.indexOf(' ');
var lastSpace = msg.lastIndexOf(' ');
var receiver = msg.substring(msg.indexOf("@") + 1);
var giverTokens = validateTokens(chat.un);
var receiverTokens = validateTokens(receiver);
var strhnout = parseInt(msg.substring(cmd.length + 1, lastSpace));
var currentDJ = API.getDJ().username;
var cislo = parseInt(receiverTokens, 10) + parseInt(strhnout,10);

if (giverTokens <= -999){
return API.sendChat("[@" + chat.un + "] Chyba v transakci.");
}
else if (strhnout < 1){
return API.sendChat("[@" + chat.un + "] Nemůžeš posílat QPoints v záporných hodnotách!");
}
else{
giverTokens -= 0;
localStorage.setItem(chat.un, giverTokens);

if (space === -1){
localStorage.setItem(currentDJ, cislo);
return API.sendChat("[@" + currentDJ + "] Bylo vám přičteno na účet " + strhnout + " QPoints.");
}

else{
localStorage.setItem(receiver, cislo);
return API.sendChat("[@" + receiver + "] Bylo vám přičteno na účet " + strhnout + " QPoints.");
}

}

}
},

odebratbodyCommand: {
command: ['odebratbody', 'removeqp'],  //The command to be called. With the standard command literal this would be: !tip
rank: 'manager', //Minimum user permission to use the command
type: 'startsWith', //Specify if it can accept variables or not (if so, these have to be handled yourself through the chat.message
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else {
}

function validateTokens(user){

var tokens;

//Check for existing user tokens
if (localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined"){
localStorage.setItem(user, "0");
tokens = localStorage.getItem(user);
}

else if (localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined"){
tokens = localStorage.getItem(user);
}

else{
tokens = localStorage.getItem(user);
}

return tokens;

}

var msg = chat.message;
var space = msg.indexOf(' ');
var lastSpace = msg.lastIndexOf(' ');
var receiver = msg.substring(msg.indexOf("@") + 1);
var giverTokens = validateTokens(chat.un);
var receiverTokens = validateTokens(receiver);
var strhnout = parseInt(msg.substring(cmd.length + 1, lastSpace));
var currentDJ = API.getDJ().username;
var cislo = parseInt(receiverTokens, 10) - parseInt(strhnout,10);

if (strhnout < 1){
return API.sendChat("[@" + chat.un + "] Nemůžeš odebírat QPoints v záporných hodnotách!");
}
else{
giverTokens -= 0;
localStorage.setItem(chat.un, giverTokens);

if (space === -1){
localStorage.setItem(currentDJ, cislo);
return API.sendChat("[@" + currentDJ + "] Bylo vám strženo z účtu " + strhnout + " QPoints.");
}

else{
localStorage.setItem(receiver, cislo);
return API.sendChat("[@" + receiver + "] Bylo vám strženo z účtu " + strhnout + " QPoints.");
}

}

}
},

//Testování localStorage.
/*
testCommand: {
command: ['koupitpsa'],  //The command to be called. With the standard command literal this would be: !tip
rank: 'cohost', //Minimum user permission to use the command
type: 'exact', //Specify if it can accept variables or not (if so, these have to be handled yourself through the chat.message
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{
}


var msg = chat.message;
var penize_kupce = validateTokens(chat.un);
var kupec = chat.un;
var uid = chat.uid;    
    
var pes = "pes";
var majitel_psa = validateTokens(pes);
var cena = 1200;

if (penize_kupce < cena){
return API.sendChat("[@" + kupec + "] Nemáš dostatek QPoints ke koupení psa. Stojí " + cena + " QPoints.");
}
if (majitel_psa == 0){
penize_kupce -= cena;
majitel_psa = chat.un;
localStorage.setItem(chat.un, penize_kupce);
localStorage.setItem(pes, majitel_psa); 
API.sendChat("[" + kupec + "] Koupil sis psa za " + cena + " QPoints!");
}
else{
return API.sendChat("[@" + kupec + "] Nemůžeš si koupit psa, vlastní jej " + majitel_psa + "");
}

}
},

pesCommand: {
command: ['pes'],  //The command to be called. With the standard command literal this would be: !tip
rank: 'cohost', //Minimum user permission to use the command
type: 'exact', //Specify if it can accept variables or not (if so, these have to be handled yourself through the chat.message
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{



var msg = chat.message;
var penize_kupce = validateTokens(chat.un);
var jmeno = chat.un;
var uid = chat.uid;    
    
var pes = "pes";
var majitel_psa = validateTokens(pes);

if (chat.un == majitel_psa) {
API.sendChat("[" + jmeno + "] Tvůj pes.");
} else {

API.sendChat("[" + jmeno + "] Tohoto psa vlastní uživatel " + majitel_psa + "");

}
}
}
},
*/
buyCommand: {
command: ['buy'],  //The command to be called. With the standard command literal this would be: !tip
rank: 'user', //Minimum user permission to use the command
type: 'exact', //Specify if it can accept variables or not (if so, these have to be handled yourself through the chat.message
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{
}

function validateTokens(user){

var tokens;

//Check for existing user tokens
if (localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined"){
localStorage.setItem(user, "0");
tokens = localStorage.getItem(user);
}

else if (localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined"){
tokens = localStorage.getItem(user);
}

else{
tokens = localStorage.getItem(user);
}

return tokens;

}


var msg = chat.message;
var giverTokens = validateTokens(chat.un);
var zakaznik = chat.un;
var uid = chat.uid;

if (giverTokens < 500){
return API.sendChat("[@" + zakaznik + "] Nemáš dostatek QPoints k zaplacení 1. pozice ve frontě. Nákup stojí 500 QPoints.");
}
else{
giverTokens -= 500;
localStorage.setItem(chat.un, giverTokens);
API.sendChat("[" + zakaznik + "] Práve si si zakúpil prvé miesto v zozname čakaní za 500 QPoints!");
basicBot.userUtilities.moveUser(uid, +1, true);
}

}
},

umelecCommand: {
command: 'umelec',  //The command to be called.
rank: 'user', //Minimum user permission to use the command
type: 'exact', //Specify if it can accept variables or not (if so, these have to be handled yourself through the chat.message
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else {

simpleAJAXLib ={

init: function (){
var artist = API.getMedia().author;
var url = 'http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&api_key=b3cb78999a38750fc3d76c51ba2bf6bb&artist=' + artist.replace(/&/g,"%26").replace(/ /g,"%20") + '&autocorrect=1'
this.fetchJSON(url);
},

fetchJSON: function (url){
var root = 'https://query.yahooapis.com/v1/public/yql?q=';
var yql = 'select * from xml where url="' + url + '"';
var proxy_url = root + encodeURIComponent(yql) + '&format=json&diagnostics=false&callback=simpleAJAXLib.display';
document.getElementsByTagName('body')[0].appendChild(this.jsTag(proxy_url));
},

jsTag: function (url){
var script = document.createElement('script');
script.setAttribute('type', 'text/javascript');
script.setAttribute('src', url);
return script;
},

display: function (results){

setTimeout(function(){

try{
var name;
name = results.query.results.lfm.artist.name;

var picture;
picture = results.query.results.lfm.artist.image[3].content

var genres;
genres = results.query.results.lfm.artist.tags.tag[0].name;
genres += ", ";
genres += results.query.results.lfm.artist.tags.tag[1].name;
genres += ", ";
genres += results.query.results.lfm.artist.tags.tag[2].name;

var similar;
similar = results.query.results.lfm.artist.similar.artist[0].name;
similar += ", ";
similar += results.query.results.lfm.artist.similar.artist[1].name;
similar += ", ";
similar += results.query.results.lfm.artist.similar.artist[2].name;

API.sendChat("[@" + chat.un + "] Jméno: " + name + " | Žánr: " + genres + " | Podobné skupiny: " + similar + " | Obrázek: " + picture);

}

catch (e){
API.sendChat("[@" + chat.un + "] Omlouváme se, ale server nenalezl žádné informace o tomto zpěvákovi či hudební skupině.");
}

},100);

}

}

simpleAJAXLib.init();

}
}
},

kontoCommand: {
command: ['konto'],
rank: 'bouncer',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{
}

function validateTokens(user){
var tokens;

if (localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined"){
localStorage.setItem(user, "0");
tokens = localStorage.getItem(user);
}

else if (localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined"){
tokens = localStorage.getItem(user);
}

else{
tokens = localStorage.getItem(user);
}

return tokens;

}

var msg = chat.message;
var space = msg.indexOf(' ');
var receiver = msg.substring(space + 2);
var giverTokens = validateTokens(chat.un);
var receiverTokens = validateTokens(receiver);
var currentDJ = API.getDJ().username;

if (giverTokens <= -999){
return API.sendChat("[@" + chat.un + "] Chyba 404.");
}

else{
giverTokens -= 0;
localStorage.setItem(chat.un, giverTokens);

if (space === -1){
receiverTokens -= 0;
localStorage.setItem(currentDJ, receiverTokens);
return API.sendChat("[@"+ chat.un +"] Úžívateľ "+ currentDJ +" má na konte "+ receiverTokens +" QPoints!");
}

else{
receiverTokens -= 0;
localStorage.setItem(receiver, receiverTokens);
return API.sendChat("[@"+ chat.un +"] Užívateľ "+ receiver +" má na konte "+ receiverTokens +" QPoints!");
}

}
}
},

qpointsCommand: {
command: ['qpointy','qpoints', 'qp'],
rank: 'user',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var user = chat.un;
var tokens = validateTokens(user);

API.sendChat("[@"+ user +"] Máš "+ tokens +" QPoints!");
}

function validateTokens(user){
var tokens;

if(localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined"){
localStorage.setItem(user, "0");
tokens = localStorage.getItem(user);
}

else if(localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined"){
tokens = localStorage.getItem(user);
}

else{
tokens = localStorage.getItem(user);
}

return tokens;
}

}
},





rankCommand: {
command: ['rank','hodnost', 'hodnosť'],
rank: 'user',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var user = chat.un;
var tokens = validateTokens(user);

// Unranked
var unranked = 500;

if(tokens < unranked){
API.sendChat("[@"+ user +"] Nie si zaradený v Rank systéme. Na zaradenie potrebuješ 500 QPoints! Viac o QPoints a Rankoch na http://qplug.funsite.cz/bot/qpoints!");
}

// Bronze
var bronze1 = 500;
var bronze2 = 2000;
var bronze3 = 2500;
var bronze4 = 4000;
var bronze5 = 4500;

if(tokens >= bronze1 && tokens <= 1999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Bronze I !");
}

else if(tokens >= bronze2 && tokens <= 2499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Bronze II !");
}

else if(tokens >= bronze3 && tokens <= 3999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Bronze III !");
}

else if(tokens >= bronze4 && tokens <= 4499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Bronze IV !");
}

else if(tokens >= bronze5 && tokens <= 5999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Bronze V !");
}

// Silver
var silver1 = 6000;
var silver2 = 6500;
var silver3 = 8000;
var silver4 = 8500;
var silver5 = 10000;

if(tokens >= silver1 && tokens <= 6499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Silver I !");
}

else if(tokens >= silver2 && tokens <= 7999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Silver II !");
}

else if(tokens >= silver3 && tokens <= 8499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Silver III !");
}

else if(tokens >= silver4 && tokens <= 9999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Silver IV !");
}

else if(tokens >= silver5 && tokens <= 10499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Silver V !");
}

//  Gold
var gold1 = 10500;
var gold2 = 12000;
var gold3 = 12500;
var gold4 = 14000;
var gold5 = 14500;

if(tokens >= gold1 && tokens <= 11999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Gold I !");
}

else if(tokens >= gold2 && tokens <= 12499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Gold II !");
}

else if(tokens >= gold3 && tokens <= 13999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Gold III !");
}

else if(tokens >= gold4 && tokens <= 14499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Gold IV !");
}

else if(tokens >= gold5 && tokens <= 15999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Gold V !");
}

// Platinum
var plat1 = 16000;
var plat2 = 16500;
var plat3 = 18000;
var plat4 = 18500;
var plat5 = 20000;

if(tokens >= plat1 && tokens <= 16499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Platinum I !");
}

else if(tokens >= plat2 && tokens <= 17999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Platinum II !");
}

else if(tokens >= plat3 && tokens <= 18499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Platinum III !");
}

else if(tokens >= plat4 && tokens <= 19999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Platinum IV !");
}

else if(tokens >= plat5 && tokens <= 20499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Platinum V !");
}

// Diamond
var dia1 = 20500;
var dia2 = 22000;
var dia3 = 22500;
var dia4 = 24000;
var dia5 = 24500;

if(tokens >= dia1 && tokens <= 21999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Diamond I !");
}

else if(tokens >= dia2 && tokens <= 22499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Diamond II !");
}

else if(tokens >= dia3 && tokens <= 23999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Diamond III !");
}

else if(tokens >= dia4 && tokens <= 24499){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Diamond IV !");
}

else if(tokens >= dia5 && tokens <= 29999){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Diamond V !");
}

// Global Elite
var global = 30000;

if(tokens >= global){
API.sendChat("[@"+ user +"] Tvoj aktuálny rank je Global Elite. Gratulujeme si najvyšší rank!");
}

}

function validateTokens(user){
var tokens;

if(localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined"){
localStorage.setItem(user, "0");
tokens = localStorage.getItem(user);
}

else if(localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined"){
tokens = localStorage.getItem(user);
}

else{
tokens = localStorage.getItem(user);
}

return tokens;
}

}
},

/*automatCommand: {
command: ['automat', 'automaty'],  //The command to be called. With the standard command literal this would be: !slots
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else {

if (!basicBot.settings.minihry) {
return API.sendChat("/me [@" + chat.un + "] Automaty jsou vypnuté.");
}
var msg = chat.message;
var space = msg.indexOf(' ');
var user = chat.un;
var updatedTokens;
var bet = parseInt(msg.substring(space + 1));

//Fix bet if blank
if (bet == null || isNaN(bet)) {
bet = 1;
}
bet = Math.round(bet);

var playerTokens = checkTokens(bet, user);

//Prevent invalid betting
if (bet > playerTokens[0]) {
if (playerTokens[0] === 0){
return API.sendChat("/me [@" + chat.un + "] Nemůžeš vsadit " + bet + " bodů. Nemáš žádné body.");
}
else if (playerTokens[0] === 1) {
return API.sendChat("/me [@" + chat.un + "] Nemůžeš vsadit " + bet + " bodů. Máš 1 bod.");
}
else {
return API.sendChat("/me [@" + chat.un + "] Nemůžeš vsadit " + bet + " bodů. Máš " + playerTokens[0] + " bodů.");
}
}
else if (bet < 0) {
return API.sendChat("/me [@" + chat.un + "] Nemůžeš vsadit " + bet + " bodů. Zkus to bez nesmyslných částek!");
}
else if (bet === 0) {
return API.sendChat("/me [@" + chat.un + "] Nemůžeš vsadit 0 bodů.");
}
//Process valid bets
else {
var outcome = spinOutcome(bet);
updatedTokens = slotWinnings(outcome[3], user);
}

//Display Slots
if (space === -1 || bet == 1) {
//Start Slots
API.sendChat("/me @" + chat.un + " vsadil/a 1 bod do vánočního automatu.");
setTimeout(function() {API.sendChat("/me [ Automat ] " + outcome[0]  + outcome[1]  + outcome[2])}, 5000);
}
else if (bet > 1) {
//Start Slots
API.sendChat("/me @" + chat.un + " vsadil/a " + bet + " bodů do vánočního automatu.");
setTimeout(function() {API.sendChat("/me [ Automat ] " + outcome[0]  + outcome[1]  + outcome[2])}, 5000);
}
else {
return false;
}

//Display Outcome
if (outcome[3] == 0) {
if (updatedTokens === 1) {
setTimeout(function() {API.sendChat("/me [@" + chat.un + "] Prohrál/a jsi! Zbylo ti 1 bod.")}, 7000);
}
else if (updatedTokens === 0) {
setTimeout(function() {API.sendChat("/me [@" + chat.un + "] Prohrál/a jsi! Nemáš žádné body. Vydělávej hraním písní a poté přijď znovu!")}, 7000);

}
else {
setTimeout(function() {API.sendChat("/me [@" + chat.un + "] Prohrál/a jsi! Zbylo ti " + updatedTokens + " bodů")}, 7000);
}
}
else if (outcome[3] == (bet * 7)) {
setTimeout(function() {API.sendChat("/me [@" + chat.un + "] Vyhrál/a jsi vánoční jackpot " + outcome[3] + " bodů. Nyní máš " + updatedTokens + " bodů")}, 7000);

}
else {
setTimeout(function() {API.sendChat("/me [@" + chat.un + "] Vyhrál/a jsi! Tvá výhra je " + outcome[3] + " bodů. Nyní máš " + updatedTokens + " bodů ")}, 7000);
}

//Validate Tokens
function validateTokens(user)
{
var tokens;

//Check for existing user tokens
if (localStorage.getItem(user) == null || localStorage.getItem(user) == "undefined") {
localStorage.setItem(user, "0");
tokens = localStorage.getItem(user);
}
else if (localStorage.getItem(user) !== null  && localStorage.getItem(user) !== "undefined") {
tokens = localStorage.getItem(user);
}
else {
tokens = localStorage.getItem(user);
}

return tokens;
}

//Slots---------------------------------------------------------------------------------------------------------------------------
function spinSlots()
{
var slotArray = [':beer: -',
':snowflake: - ',
':gift: - ',
':snowman: - ',
':santa: - ',
':bell: - ',
':christmas_tree: - ',
':star: - '];
var slotValue = [6,
6,
6,
6,
6,
6,
6,
20];
var rand =  Math.floor(Math.random() * (slotArray.length));
return [slotArray[rand], slotValue[rand]];
}

function spinOutcome(bet)
{
var winnings;
var outcome1 = spinSlots();
var outcome2 = spinSlots();
var outcome3 = spinSlots();




if (outcome1[0] == outcome2[0] && outcome1[0] == outcome3[0]) {
winnings = Math.round(bet * outcome1[1]);
}
else if (outcome1[0] == outcome2[0] && outcome1[0] != outcome3[0]) {
winnings = Math.round(bet * (.45 * outcome1[1]));
}
else if (outcome1[0] == outcome3[0] && outcome1[0] != outcome2[0]) {
winnings = Math.round(bet * (.5 * outcome1[1]));
}
else if (outcome2[0] == outcome3[0] && outcome2[0] != outcome1[0]) {
winnings = Math.round(bet * (.40 * outcome2[1]));

}
else{
winnings = 0;
}

return [outcome1[0], outcome2[0], outcome3[0], winnings];
}
function checkTokens(bet, user)
{
var tokensPreBet = validateTokens(user);
var tokensPostBet;
var validBet = true;

//Adjust amount of tokens
if (bet > tokensPreBet || bet < 0) {
validBet = false;
tokensPostBet = tokensPreBet;
}
else {
tokensPostBet = tokensPreBet - bet;
}

localStorage.setItem(user, tokensPostBet);
return [tokensPreBet, tokensPostBet, validBet];
}

function slotWinnings(winnings, user)
{
var userTokens = parseInt(localStorage.getItem(user)) + winnings;
if (isNaN(userTokens)) {
userTokens = winnings;
}
localStorage.setItem(user, userTokens);
return userTokens;

}

}
}
},*/

mehcommand: {
command: 'meh',
rank: 'bouncer',
type: 'exact',
functionality:
function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
if (!basicBot.commands.executable(this.rank, chat)) return void(0);
else{

$("#meh").click();
}

}
},

wootcommand: {
command: 'woot',
rank: 'bouncer',
type: 'exact',
functionality:
function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

$("#woot").click();

}
}
},

maxlengthCommand: {
command: ['maxlength', 'ml'],
rank: 'manager',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;
var maxTime = msg.substring(cmd.length + 1);

if (!isNaN(maxTime)){
basicBot.settings.maximumSongLength = maxTime;
return API.sendChat(subChat(basicBot.chat.maxlengthtime, {name: chat.un, time: basicBot.settings.maximumSongLength}));
}

else return API.sendChat(subChat(basicBot.chat.invalidtime, {name: chat.un}));

}
}
},

afktimeCommand: {
command: ['afktime', 'afkt'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;

if (msg.length === cmd.length) return API.sendChat(subChat(basicBot.chat.nouserspecified, {name: chat.un}));

var name = msg.substring(cmd.length + 2);
var user = basicBot.userUtilities.lookupUserName(name);
if (typeof user === 'boolean') return API.sendChat(subChat(basicBot.chat.invaliduserspecified, {name: chat.un}));
var lastActive = basicBot.userUtilities.getLastActivity(user);
var inactivity = Date.now() - lastActive;
var time = basicBot.roomUtilities.msToStr(inactivity);

var launchT = basicBot.room.roomstats.launchTime;
var durationOnline = Date.now() - launchT;

if (inactivity == durationOnline){
API.sendChat(subChat(basicBot.chat.inactivelonger, {botname: basicBot.settings.botName, name: chat.un, username: name}));
}

else{
API.sendChat(subChat(basicBot.chat.inactivefor, {name: chat.un, username: name, time: time}));
}

}
}
},

dclookupCommand: {
command: ['dclookup', 'dc'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;
var name;
if (msg.length === cmd.length) name = chat.un;

else{
name = msg.substring(cmd.length + 2);
var perm = basicBot.userUtilities.getPermission(chat.uid);
if (perm < 2) return API.sendChat(subChat(basicBot.chat.dclookuprank, {name: chat.un}));
}

var user = basicBot.userUtilities.lookupUserName(name);
if (typeof user === 'boolean') return API.sendChat(subChat(basicBot.chat.invaliduserspecified, {name: chat.un}));
var toChat = basicBot.userUtilities.dclookup(user.id);
API.sendChat(toChat);

}
}
},

etaCommand: {
command: 'eta',
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var perm = basicBot.userUtilities.getPermission(chat.uid);
var msg = chat.message;
var dj = API.getDJ().username;
var name;

if (msg.length > cmd.length){
if (perm < 2) return void (0);
name = msg.substring(cmd.length + 2);
}

else name = chat.un;
var user = basicBot.userUtilities.lookupUserName(name);
if (typeof user === 'boolean') return API.sendChat(subChat(basicBot.chat.invaliduserspecified, {name: chat.un}));
var pos = API.getWaitListPosition(user.id);
var realpos = pos + 1;
if (name == dj) return API.sendChat(subChat(basicBot.chat.youaredj, {name: name}));
if (pos < 0) return API.sendChat(subChat(basicBot.chat.notinwaitlist, {name: name}));
if (pos == 0) return API.sendChat(subChat(basicBot.chat.youarenext, {name: name}));
var timeRemaining = API.getTimeRemaining();
var estimateMS = ((pos + 1) * 4 * 60 + timeRemaining) * 1000;
var estimateString = basicBot.roomUtilities.msToStr(estimateMS);
API.sendChat(subChat(basicBot.chat.eta, {name: name, time: estimateString, position: realpos}));

}
}
},

filterCommand: {
command: 'filter',
rank: 'bouncer',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else {
if (basicBot.settings.filterChat) {
basicBot.settings.filterChat = !basicBot.settings.filterChat;
return API.sendChat(subChat(basicBot.chat.toggleoff, {name: chat.un, 'function': basicBot.chat.chatfilter}));
}
else {
basicBot.settings.filterChat = !basicBot.settings.filterChat;
return API.sendChat(subChat(basicBot.chat.toggleon, {name: chat.un, 'function': basicBot.chat.chatfilter}));
}
}
}
},

historyskipCommand: {
command: ['historyskip', 'hs'],
rank: 'bouncer',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

if (basicBot.settings.historySkip){
basicBot.settings.historySkip = !basicBot.settings.historySkip;
API.sendChat(subChat(basicBot.chat.toggleoff, {name: chat.un, 'function': basicBot.chat.historyskip}));
}

else{
basicBot.settings.historySkip = !basicBot.settings.historySkip;
API.sendChat(subChat(basicBot.chat.toggleon, {name: chat.un, 'function': basicBot.chat.historyskip}));
}

}
}
},

joinCommand: {
command: 'join',
rank: 'user',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

if (basicBot.room.roulette.rouletteStatus && basicBot.room.roulette.participants.indexOf(chat.uid) < 0){
basicBot.room.roulette.participants.push(chat.uid);
API.sendChat(subChat(basicBot.chat.roulettejoin, {name: chat.un}));
}

}
}
},

jointimeCommand: {
command: ['jointime', 'active', 'joint'],
rank: 'bouncer',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;
if (msg.length === cmd.length) return API.sendChat(subChat(basicBot.chat.nouserspecified, {name: chat.un}));
var name = msg.substring(cmd.length + 2);
var user = basicBot.userUtilities.lookupUserName(name);
if (typeof user === 'boolean') return API.sendChat(subChat(basicBot.chat.invaliduserspecified, {name: chat.un}));
var join = basicBot.userUtilities.getJointime(user);
var time = Date.now() - join;
var timeString = basicBot.roomUtilities.msToStr(time);
API.sendChat(subChat(basicBot.chat.jointime, {namefrom: chat.un, username: name, time: timeString}));

}
}
},

killCommand: {
command: 'kill',
rank: 'manager',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

storeToStorage();
sendToSocket();
API.sendChat(basicBot.chat.kill);
basicBot.disconnectAPI();

setTimeout(function (){
kill();
}, 1000);

}
}
},

leaveCommand: {
command: ['leave', 'opustit'],
rank: 'user',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var ind = basicBot.room.roulette.participants.indexOf(chat.uid);

if (ind > -1){
basicBot.room.roulette.participants.splice(ind, 1);
API.sendChat(subChat(basicBot.chat.rouletteleave, {name: chat.un}));
}

}
}
},

waitlistCommand: {
command: ['waitlist', 'wl'],
rank: 'bouncer',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;
var from = chat.un;
var code_id = msg.substr(cmd.length + 1);
var space = msg.indexOf(' ');

if (space === -1){
API.sendChat("[@"+ from +"] Musíš zadať kód! | l = Lock | u = Unlock | c = Lock a Clear.");
}

if(code_id === "l"){
API.sendChat("[@"+ from +"] Uzamkol si zoznam čakania!");
setTimeout(function(){ API.moderateLockWaitList(true, false); }, 3000);
}

if(code_id === "u"){
API.sendChat("[@"+ from +"] Odomkol si zoznam čakania!");
setTimeout(function(){ API.moderateLockWaitList(false, false); }, 3000);
}

if(code_id === "c"){
API.sendChat("[@"+ from +"] Uzamkol a vyčistil si zoznam čakania!");
setTimeout(function(){ API.moderateForceSkip(true, true); }, 3000);
}

}
}
},

moveCommand: {
command: 'move',
rank: 'manager',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;

if (msg.length === cmd.length) return API.sendChat(subChat(basicBot.chat.nouserspecified, {name: chat.un}));

var firstSpace = msg.indexOf(' ');
var lastSpace = msg.lastIndexOf(' ');
var pos;
var name;

if (isNaN(parseInt(msg.substring(lastSpace + 1)))){
pos = 1;
name = msg.substring(cmd.length + 2);
}

else{
pos = parseInt(msg.substring(lastSpace + 1));
name = msg.substring(cmd.length + 2, lastSpace);
}

var user = basicBot.userUtilities.lookupUserName(name);

if (typeof user === 'boolean') return API.sendChat(subChat(basicBot.chat.invaliduserspecified, {name: chat.un}));
if (user.id === basicBot.loggedInID) return API.sendChat(subChat(basicBot.chat.addbotwaitlist, {name: chat.un}));

if (!isNaN(pos)){
API.sendChat(subChat(basicBot.chat.move, {name: chat.un}));
basicBot.userUtilities.moveUser(user.id, pos, false);
}

else return API.sendChat(subChat(basicBot.chat.invalidpositionspecified, {name: chat.un}));

}
}
},

refreshCommand: {
command: 'refresh',
rank: 'manager',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

sendToSocket();
storeToStorage();
basicBot.disconnectAPI();

setTimeout(function (){
window.location.reload(false);
}, 1000);

}
}
},

rouletteCommand: {
command: ['roulette', 'ruleta'],
rank: 'manager',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

if (!basicBot.room.roulette.rouletteStatus){
basicBot.room.roulette.startRoulette();
}

}
}
},

statusCommand: {
command: ['status', 'settings', 'sett'],
rank: 'bouncer',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;
var msg = "[@"+ from +"] ";

msg += basicBot.chat.chatfilter + ': ';
if (basicBot.settings.filterChat) msg += 'ON';
else msg += 'OFF';
msg += ' | ';

msg += basicBot.chat.timeguard + ': ';
if (basicBot.settings.timeGuard) msg += 'ON';
else msg += 'OFF';
msg += ' | ';

msg += basicBot.chat.historyskip + ': ';
if (basicBot.settings.historySkip) msg += 'ON';
else msg += 'OFF';
msg += ' | ';

msg += basicBot.chat.cmddeletion + ': ';
if (basicBot.settings.cmdDeletion) msg += 'ON';
else msg += 'OFF';
msg += ' | ';

msg += basicBot.chat.autoskip + ': ';
if (basicBot.settings.autoskip) msg += 'ON';
else msg += 'OFF';
msg += ' | ';

msg += basicBot.chat.autograb + ': ';
if (basicBot.settings.autograb) msg += 'ON';
else msg += 'OFF';
msg += ' | ';

var launchT = basicBot.room.roomstats.launchTime;
var durationOnline = Date.now() - launchT;
var since = basicBot.roomUtilities.msToStr(durationOnline);
msg += subChat(basicBot.chat.activefor, {time: since});

if (msg.length > 250){
var split = msg.match(/.{1,250}/g);

for (var i = 0; i < split.length; i++){

var func = function(index){

setTimeout(function(){
API.sendChat("/me " + split[index]);
}, 500 * index);

}

func(i);
}

}

else{
return API.sendChat(msg);
}

}
}
},

timeguardCommand: {
command: ['timeguard', 'tg'],
rank: 'bouncer',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

if (basicBot.settings.timeGuard){
basicBot.settings.timeGuard = !basicBot.settings.timeGuard;
return API.sendChat(subChat(basicBot.chat.toggleoff, {name: chat.un, 'function': basicBot.chat.timeguard}));
}

else{
basicBot.settings.timeGuard = !basicBot.settings.timeGuard;
return API.sendChat(subChat(basicBot.chat.toggleon, {name: chat.un, 'function': basicBot.chat.timeguard}));
}

}
}
},

swapCommand: {
command: ['prehodiť', 'prehodit', 'vymeniť', 'vymenit', 'swap'],
rank: 'bouncer',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;

if (msg.length === cmd.length) return API.sendChat(subChat(basicBot.chat.nouserspecified, {name: chat.un}));

var firstSpace = msg.indexOf(' ');
var lastSpace = msg.lastIndexOf(' ');
var name1 = msg.substring(cmd.length + 2, lastSpace);
var name2 = msg.substring(lastSpace + 2);
var user1 = basicBot.userUtilities.lookupUserName(name1);
var user2 = basicBot.userUtilities.lookupUserName(name2);

if (typeof user1 === 'boolean' || typeof user2 === 'boolean') return API.sendChat(subChat(basicBot.chat.swapinvalid, {name: chat.un}));

if (user1.id === basicBot.loggedInID || user2.id === basicBot.loggedInID) return API.sendChat(subChat(basicBot.chat.addbottowaitlist, {name: chat.un}));

var p1 = API.getWaitListPosition(user1.id) + 1;
var p2 = API.getWaitListPosition(user2.id) + 1;

if (p1 < 0 || p2 < 0) return API.sendChat(subChat(basicBot.chat.swapwlonly, {name: chat.un}));

API.sendChat(subChat(basicBot.chat.swapping, {'name1': name1, 'name2': name2}));

if (p1 < p2){
basicBot.userUtilities.moveUser(user2.id, p1, false);

setTimeout(function (user1, p2){
basicBot.userUtilities.moveUser(user1.id, p2, false);
}, 2000, user1, p2);

}

else{
basicBot.userUtilities.moveUser(user1.id, p2, false);

setTimeout(function (user2, p1){
basicBot.userUtilities.moveUser(user2.id, p1, false);
}, 2000, user2, p1);

}

}
}
},

lockchatCommand: {
command: 'lockchat',
rank: 'manager',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var temp = basicBot.settings.lockdownEnabled;
basicBot.settings.lockdownEnabled = !temp;

if (basicBot.settings.lockdownEnabled){
return API.sendChat(subChat(basicBot.chat.toggleon, {name: chat.un, 'function': basicBot.chat.lockdown}));
}

else return API.sendChat(subChat(basicBot.chat.toggleoff, {name: chat.un, 'function': basicBot.chat.lockdown}));

}
}
},

qpcCommand: {
command: ['qpc', 'qpcalculator'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;
var current_dj = API.getDJ().username;
var waitlist_count = API.getWaitList().length;

var woots = API.getScore().positive * 1;
var grabs = API.getScore().grabs * 2;
var mehs = API.getScore().negative * 1;
var vysledok = woots + grabs - mehs;

var double_woots = API.getScore().positive * 2;
var double_grabs = API.getScore().grabs * 2;
var double_mehs = API.getScore().negative * 1;
var double_vysledok = double_woots + double_grabs - double_mehs;

if(waitlist_count < "15"){
API.sendChat("[ QPoints ] "+ current_dj +" dostane za túto pesničku "+ vysledok +" QPoints!");
}

if(waitlist_count >= "15"){
API.sendChat("[ QPoints ] "+ current_dj +" dostane za túto pesničku "+ double_vysledok +" QPoints!");
}

}
}
},
soubojCommand: {
                command: ['duel', 'vyzvat', 'souboj', 'kostky', 'kocky'],
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!basicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var player1 = chat.un;
                        var player1QP = validateTokens(player1);
                        if (!basicBot.room.duel.stats) {
                            var msg = chat.message;
                            var space = msg.indexOf(' ');
                            if (space === -1) {
                                API.sendChat("[ KOSTKY | @" + chat.un + " ] To je minihra, kde můžeš vyzvat někoho z uživatelů na souboj o QPoints! Vyhrává hráč, který hodí na kostce vyšší číslo! Vyzvi někoho pomocí !duel 'sázka' @meno");
                                return false;
                            } else {
                                var name = msg.substring(msg.indexOf("@") + 1);                            
                                var user = basicBot.userUtilities.lookupUserName(name);
                                var player2QP = validateTokens(user);
                                var lastSpace = chat.message.lastIndexOf(' ');
                                var sazka = parseInt(msg.substring(cmd.length + 1, lastSpace));
                                var sazka_format = parseInt(sazka);
                                basicBot.room.duel.sazka = sazka_format;
                                var from = chat.uid;
                                var to = user.id;

                                    if (user === false || !user.inRoom) {
                                        return API.sendChat("[ KOSTKY | @" + chat.un + " ] Tento uživatel se nenachází v místnosti!");
                                    } else if (user.username === chat.un) {
                                        return API.sendChat("[ KOSTKY | @" + chat.un + " ] Nemůžeš vyzvat sám sebe na kostky!");
                                    } else if (player1QP < sazka_format) {
                                        return API.sendChat("[ KOSTKY | @" + chat.un + " ] Nemáš tolik QPoints, abys o ně mohl hrát v kostkách! Vsaď méně!");
                                    } else {
                                        API.sendChat("[ KOSTKY | @" + user.username + " ]  @" + chat.un + " tě vyzval na duel v kostkách o " + basicBot.room.duel.sazka + " QPoints. Výzvu můžeš přijmout pomocí !ok");
                                        basicBot.room.duel.stats = true;
                                        basicBot.room.duel.users.push(from, to);
                                        basicBot.room.duel.waiting = setTimeout(function() {
                                            API.sendChat("[ KOSTKY | @" + chat.un + " ] Uživatel " + user.username + " neodpověděl na vaší pozvánku k duelu!");
                                            basicBot.room.duel.stats = false;
                                            basicBot.room.duel.users = [];
                                        }, 30 * 1000);
                                    }
                                 
                            }
                        } else API.sendChat("[@" + chat.un + "] Duel právě probíhá!");
                    }
                }
            },

            okCommand: {
                command: 'ok',
                rank: 'user',
                type: 'startsWith',
                functionality: function(chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
                    if (!basicBot.commands.executable(this.rank, chat)) return void(0);
                    else {
                        var player2 = chat.un;
                        var player2QP = validateTokens(player2);
                        if (player2QP < basicBot.room.duel.sazka) {
                        API.sendChat("[ KOSTKY | @" + chat.un + " ] Nemáš tolik QPoints, abys mohl hrát kostky s tímto uživatelem!");
                        }
                        else {
                        if (basicBot.room.duel.users[0] != chat.uid) {
                            for (var i in basicBot.room.duel.users) {
                                if (chat.uid == basicBot.room.duel.users[i]) {
                                    clearTimeout(basicBot.room.duel.waiting);
                                    var from = basicBot.room.duel.users[i - 1];
                                    var user = basicBot.userUtilities.lookupUser(from);
                                    API.sendChat("[ KOSTKY ] Za minutu proběhne duel v kostkách mezi " + user.username + " a " + chat.un + " o " + basicBot.room.duel.sazka + " QPoints!");
                                    basicBot.room.duel.start();
                                }
                            }
                            }
                        }
                    }
                }
            },
 

          
jaCommand: {
command: ['ja','já', 'cicina', 'iq', 'sexy', 'nálada', 'nalada'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;
var from = chat.un;
var fromid = chat.uid;
var cicina = Math.floor((Math.random() * 40) + 1);
var sexy = Math.floor((Math.random() * 100) + 1);
var iq = Math.floor((Math.random() * 180) + 1);
var gramatika = Math.floor((Math.random() * 100) + 1);
var nalada = ["Naštvaný/á.", "Kludný/á.", "Nadržený/á.", "Vzteklý/á.", "Bláznivý/á.", "Hodný/á.", "Radostný/á.", "Skleslý/á.", "Vtipný/á.", "Smutný/á."];

API.sendChat("[@" + from + "] Tvoja cicina má: "+ cicina +"cm. | Tvoje IQ: " + iq + " | Si sexy na " + sexy + "%  | Umíš gramatiku na " + gramatika + "% | Aktuálna nálada: " + nalada[Math.floor(Math.random() * nalada.length)] + "");

}
}
},

// VIP příkaz
grabCommand: {
command: 'grab',
rank: 'user',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var giverTokens = validateTokens(chat.un);
var msg = chat.message;
var from = chat.un;
var fromid = chat.uid;

if(giverTokens > 4499){

$("#grab").click();
$(".pop-menu ul li:first-child").mousedown();
}

else{
API.sendChat("[@"+ from +"] Tento příkaz vyžaduje rank Bronze V nebo vyšší! Více o rank systému nalezneš zde: http://qplug.funsite.cz/bot/qpoints!");
}

}
}
},

// VIP příkaz
pribehCommand: {
command: ['pribeh', 'story'],
rank: 'user',
type: 'exact',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var giverTokens = validateTokens(chat.un);
var msg = chat.message;
var from = chat.un;
var uzivatel = API.getUsers();
var uzivatel2 = API.getUsers();
var uzivatel3 = API.getUsers();
var uzivatel4 = API.getUsers();
var cislo = Math.floor((Math.random() * uzivatel.length) + 1);
var cislo2 = Math.floor((Math.random() * uzivatel2.length) + 1);
var cislo3 = Math.floor((Math.random() * uzivatel3.length) + 1);
var cislo4 = Math.floor((Math.random() * uzivatel4.length) + 1);
var zacatek = ["Když ses koupal, přišel tvůj","Když jsi vařil večeři, přišel tvůj","Uslyšel jsi zvonek a ve dveřích byl tvůj","Když jsi spal, přišel tvůj","Když jsi se díval na televizi, přišel tvůj"];
var jaky = ["úchylný","hloupý","zamilovaný","retardovaný","pošahaný","chytrý","mocný","sexy","nemocný","vožralý"];
var jake = ["úchylné","hloupé","zamilované","retardované","pošahané","chytré","mocné","sexy","nemocné","vožralé"];
var kam = ["do hotelu","na zahradu","do popelnice","ven","na záchod","do sprchy","na Měsíc","do hospody","do vesmíru","za Zemanem","na hřiště","do auta","do letadla","do ponorky","pod zem","do rakve","do garáže","na půdu","do sklepa","domů","na intr","do školy"];
var co = ["lovit křečky","nahánět holky","čumět na televizi","koukat z okna","hrát si na mobilu","stavět lego","sníst vše v lednici","chytat mouchy","povysávat byt","skládat puzzle","nahánět kluky","zkoušet létat","čistit latrýnu","mazlit se","fingovat sebevraždy","chlastat","žrát čokoládu","jezdit výtahem","klouzat se po zábradlí"];
var co2 = ["rebelovali","opékali párky","naháněli kluky","naháněli holky","ožrali se","rybařili","stavěli sněhuláka","hecovali se","žrali kýbl zmrzliny"];
var jak = ["úplně vypatlaně","bez rozmyšlení","sebejistě","maniacky","vychytrale","velmi rychle","docela pomalu","vožrale","opatrně"];
var proc = ["protože bagr","protože je nikdo nemá rád.","protože to " + uzivatel4[(cislo4 - 1)].username + " přikazal.","protože jsou do sebe zamilovaní.","protože jsou zhulený.","protože chcou více drog.","protože jsou vožralý.","protože banán.","protože když máš 4 jablka a 3 hrušky, nemůžeš mít švestkový kompot."];
var proc2 = ["protože jste retardi.","protože bagr neplave.","protože vás nikdo nemá rád.","protože jste do sebe zamilovaní.","protože jste zhulený.","protože chcete více drog.","protože jste vožralý.","protože banán.","protože když máte 4 jablka a 3 hrušky, nemůžete mít švestkový kompot."];

if (giverTokens > 4499) {

API.sendChat("[@"+ from +"] " + zacatek[Math.floor(Math.random() * zacatek.length)] + " " + jaky[Math.floor(Math.random() * jaky.length)] + " kamarád " + uzivatel[(cislo - 1)].username + " s tím, ať jdete " + kam[Math.floor(Math.random() * kam.length)] + ". Odpověděl jsi, že ne, radši půjdeš " + co[Math.floor(Math.random() * co.length)] + ".");
setTimeout(function(){ API.sendChat("Nakonec tě přemluvil. Cestou jste potkali " + jake[Math.floor(Math.random() * jake.length)] + " kamarády " + uzivatel2[(cislo2 - 1)].username + " a " + uzivatel3[(cislo3 - 1)].username + ". Zeptal ses, jestli chtějí jít s vámi. Na to ti " + jak[Math.floor(Math.random() * jak.length)] + " odpověděli, ať na to zapomeneš " + proc[Math.floor(Math.random() * proc.length)] + ""); }, 700);
setTimeout(function(){ API.sendChat("Tak jsi jen pokrčil rameny a pokračovali jste v cestě " + kam[Math.floor(Math.random() * kam.length)] + ", abyste " + jak[Math.floor(Math.random() * jak.length)] + " " + co2[Math.floor(Math.random() * co2.length)] + " " + proc2[Math.floor(Math.random() * proc2.length)] + ""); }, 1500);
}

else{
API.sendChat("[@" + from + "] Tento příkaz vyžaduje rank Bronze V nebo vyšší! Více o rank systému nalezneš zde: http://qplug.funsite.cz/bot/qpoints");
}

}
}
},

komunitaCommand: {
command: ['community','komunita', 'qplugcz', 'qplug'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;

var launchT = basicBot.room.roomstats.launchTime;
var durationOnline = Date.now() - launchT;
var since = basicBot.roomUtilities.msToStr(durationOnline);

API.sendChat("[@"+ from +" ] Za "+ since +" čo je Bot spustený prešlo komunitou "+ basicBot.settings.joinedCount +" ľudí.");

}
}
},

skipCommand: {
command: ['skip', 's'],
rank: 'bouncer',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;
var from = chat.un;
var skip_reason = msg.substr(cmd.length + 1);
var space = msg.indexOf(' ');
var current_dj = API.getDJ().username;

if(space === -1){
API.sendChat("[@"+ from +"] Musíš zadať kód preskočenia! | n = NSFW | h = History | m = Veľky počet Mehov | o = Ohraná pesnička | u = Nedostupná pesnička.");
}

if(skip_reason === "n"){
API.sendChat("[@"+ current_dj +"] Tvoja pesnička bude preskočená z dôvodu: NSFW! (nevhodný obsah)");
setTimeout(function(){ API.moderateForceSkip(); }, 3000);
}

if(skip_reason === "h"){
API.sendChat("[@"+ current_dj +"] Tvoja pesnička bude preskočená z dôvodu: História!");
setTimeout(function(){ API.moderateForceSkip(); }, 3000);
}

if(skip_reason === "m"){
API.sendChat("[@"+ current_dj +"] Tvoja pesnička bude preskočená z dôvodu: Veľky počet Mehov!");
setTimeout(function(){ API.moderateForceSkip(); }, 3000);
}

if(skip_reason === "o"){
API.sendChat("[@"+ current_dj +"] Tvoja pesnička bude preskočená z dôvodu: Ohraná pesnička!");
setTimeout(function(){ API.moderateForceSkip(); }, 3000);
}

if(skip_reason === "u"){
API.sendChat("[@"+ current_dj +"] Tvoja pesnička bude preskočená z dôvodu: Nedostupná pesnička!");
setTimeout(function(){ API.moderateForceSkip(); }, 3000);
}

}
}
},

qphelpCommand: {
command: ['qpointshelp', 'qphelp'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if(medzera === -1){
API.sendChat("[@" + from + "] Čo sú QPoints, Rank systém a ako ich zarábať najdeš na http://qplug.funsite.cz/bot/qpoints!");
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@" + from + "] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === chat.un){
return API.sendChat("[@" + from + "] Čo sú QPoints, Rank systém a ako ich zarábať najdeš na http://qplug.funsite.cz/bot/qpoints!");
}

else{
return API.sendChat("[@" + user.username + "] Čo sú QPoints, Rank systém a ako ich zarábať najdeš na http://qplug.funsite.cz/bot/qpoints!");
}

}

}
}
},

rulesCommand: {
command: ['pravidla', 'pravidlá', 'rules'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if(medzera === -1){
API.sendChat("[@" + from + "] Naše pravidlá najdeš na http://qplug.funsite.cz/rules!");
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@" + from + "] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === chat.un){
return API.sendChat("[@" + from + "] Naše pravidlá najdeš na http://qplug.funsite.cz/rules!");
}

else{
return API.sendChat("[@" + user.username + "] Naše pravidlá najdeš na http://qplug.funsite.cz/rules!");
}

}

}
}
},

naborCommand: {
command: ['nabor', 'nábor'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if(medzera === -1){
//API.sendChat("[@"+ from +"] Momentálne sa nechystá žiadny Nábor do Týmu. Ak chceš vedieť kedy sa bude konať další Nábor ako prvý hoď Like na Facebook https://bit.ly/QPlugcz!");
API.sendChat("[@"+ from +"] Práve prebieha Nábor do QPlug.cz Týmu! Prihlás sa tu: https://bit.ly/QPlugczNabor!");
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@" + from + "] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === chat.un){
//return API.sendChat("[@"+ from +"] Momentálne sa nechystá žiadny Nábor do Týmu. Ak chceš vedieť kedy sa bude konať další Nábor ako prvý hoď Like na Facebook https://bit.ly/QPlugcz!");
return API.sendChat("[@"+ from +"] Práve prebieha Nábor do QPlug.cz Týmu! Prihlás sa tu: https://bit.ly/QPlugczNabor!");
}

else{
//return API.sendChat("[@"+ user.username +"] Momentálne sa nechystá žiadny Nábor do Týmu. Ak chceš vedieť kedy sa bude konať další Nábor ako prvý hoď Like na Facebook https://bit.ly/QPlugcz!");
return API.sendChat("[@"+ from +"] Práve prebieha Nábor do QPlug.cz Týmu! Prihlás sa tu: https://bit.ly/QPlugczNabor!");
}

}

}
}
},

sexCommand: {
command: ['sex', 'lulu'],
rank: 'user',
type: 'startsWith',
functionality: function(chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
if (!basicBot.commands.executable(this.rank, chat)) return void(0);
else{

var from = chat;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if (medzera === -1){
API.sendChat("[@"+ from.un +"] Tento príkaz sa používa v tvare: !sex @meno");
return false;
}

else{

var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if (user === false || !user.inRoom){
return API.sendChat("[@" + from.un + "] Nevidím tohto užívateľa v komunite!");
}

else if (user.username === from.un){
return API.sendChat("[@"+ from.un +"] Tento príkaz sa používa v tvare: !sex @meno");
}

else{
return API.sendChat("@" + from.un + ", si chce užiť s @" + user.username + "! :smiling_imp:");
}

}

}
}
},

loveCommand: {
command: ['love', 'laska', 'láska'],
rank: 'user',
type: 'startsWith',
functionality: function(chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
if (!basicBot.commands.executable(this.rank, chat)) return void(0);
else{

var from = chat;
var random = Math.floor((Math.random() * 100) + 1);
var msg = chat.message;
var medzera = msg.indexOf(' ');

if (medzera === -1){
API.sendChat("[@" + from.un + "] Tento príkaz sa používa v tvare: !love @meno");
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@" + from.un + "] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === from.un){
return API.sendChat("[@" + from.un + "] Tento príkaz sa používa v tvare: !love @meno");
}

else{
if((from.uid == 4183729 && user.id == 5477951) || (from.uid == 5477951 && user.id == 4183729))
random = 250;

return API.sendChat("@" + from.un + ", miluje @" + user.username + " na " + random + "%! :two_hearts:");
}

}

}
}
},

hateCommand: {
command: 'hate',
rank: 'user',
type: 'startsWith',
functionality: function(chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
if (!basicBot.commands.executable(this.rank, chat)) return void(0);
else{

var from = chat;
var random = Math.floor((Math.random() * 100) + 1);
var msg = chat.message;
var medzera = msg.indexOf(' ');

if (medzera === -1){
API.sendChat("[@" + from.un + "] Tento príkaz sa používa v tvare: !hate @meno");
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@" + from.un + "] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === from.un){
return API.sendChat("[@" + from.un + "] Tento príkaz sa používa v tvare: !hate @meno");
}

else{
return API.sendChat("@" + from.un + ", neznáša @" + user.username + " na " + random + "%! :angry:");
}
    
}

}
}
},

eventCommand: {
command: 'event',
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if(medzera === -1){
API.sendChat("[@"+ from +"] Momentálne sa nechystá žiadny event. Ak chceš vedieť kedy sa bude konať další Event ako prvý hoď Like na Facebook https://bit.ly/QPlugcz!");
/*API.sendChat("[@"+ from +"] Dnes začína Double QPoints Týžden! Cez tento týždeň dostanete za 1 Woot = 2 QPoints | 1 Grab = 2 QPoints. :relaxed:");*/
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@"+ from +"] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === chat.un){
return API.sendChat("[@"+ from +"] Momentálne sa nechystá žiadny event. Ak chceš vedieť kedy sa bude konať další Event ako prvý hoď Like na Facebook https://bit.ly/QPlugcz!");
}

else{
return API.sendChat("[@"+ user.username +"] Momentálne sa nechystá žiadny event. Ak chceš vedieť kedy sa bude konať další Event ako prvý hoď Like na Facebook https://bit.ly/QPlugcz!");
}

}

}
}
},

facebookCommand: {
command: ['facebook', 'fb'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if(medzera === -1){
API.sendChat("[ FACEBOOK ] Hoď like na našu Facebook stránku aby si vedel všetko ako prvý! Link https://bit.ly/QPlugcz!");
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@" + from + "] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === chat.un){
return API.sendChat("[ FACEBOOK ] Hoď like na našu Facebook stránku aby si vedel všetko ako prvý! Link https://bit.ly/QPlugcz!");
}

else{
return API.sendChat("[@"+ user.username +"] Hoď like na našu Facebook stránku aby si vedel všetko ako prvý! Link https://bit.ly/QPlugcz!");
}

}

}
}
},

peopleCommand: {
command: ['ludia', 'online', 'people'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var online_people_count = API.getUsers().length;
var online_staff_count = API.getStaff().length;

API.sendChat("[ QPlug.cz ] Aktuálne je v komunite online "+ online_people_count +" ludí/ia a z toho "+ online_staff_count +" člen/ov QPlug.cz Týmu.");

}
}
},

afkCommand: {
command: ['preč', 'prec', 'pryč', 'pryc', 'afk', 'away'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else {

var from = chat;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if (medzera === -1){
API.sendChat("[ AFK ] Užívateľ "+ from.un +" je práve preč od klávesnice.");
return false;
}

else{
var dovod = msg.substring(cmd.length + 1);

return API.sendChat("[ AFK ] Užívateľ "+ from.un +" je práve preč od klávesnice z dôvodu: "+ dovod +"");
}

}
}
},

backCommand: {
command: ['späť', 'spet', 'zpět', 'zpet', 'back', 'here'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;

API.sendChat("[ AFK ] Užívateľ "+ from +" sa práve vrátil!");

}
}
},

alertCommand: {
command: ['alert', 'a', 'say'],
rank: 'manager',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;
var alert = msg.substring(cmd.length + 1);

API.sendChat("[ OZNAM | @everyone ] "+ alert +"");

}
}
},

alertstaffCommand: {
command: ['alertstaff', 'as', 'saystaff'],
rank: 'bouncer',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var msg = chat.message;
var alert = msg.substring(cmd.length + 1);

API.sendChat("[ OZNAM | @staff ] "+ alert +"");

}
}
},

discordCommand: {
command: ['discord', 'disc'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if(medzera === -1){
API.sendChat("[ DISCORD ] Odkaz na náš Discord server je https://bit.ly/QPlugczDiscord!");
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@" + from + "] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === chat.un){
return API.sendChat("[ DISCORD ] Odkaz na náš Discord server je https://bit.ly/QPlugczDiscord!");
}

else{
return API.sendChat("[@"+ user.username +"] Odkaz na náš Discord server je https://bit.ly/QPlugczDiscord!");
}

}

}
}
},

autowootCommand: {
command: ['autowoot', 'aw', 'rcs'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if(medzera === -1){
API.sendChat("[ AUTOWOOT ] Je program na automatické Wootovanie a pomocou neho uvidíte naše pozadie. Obsahuje aj dalšie užitočné funkcie. Link https://rcs.radiant.dj/install!");
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@" + from + "] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === chat.un){
return API.sendChat("[ AUTOWOOT ] Je program na automatické Wootovanie a pomocou neho uvidíte naše pozadie. Obsahuje aj dalšie užitočné funkcie. Link https://rcs.radiant.dj/install!");
}

else{
return API.sendChat("[@"+ user.username +"] AutoWoot Je program na automatické Wootovanie a pomocou neho uvidíte naše pozadie. Obsahuje aj dalšie užitočné funkcie. Link https://rcs.radiant.dj/install!");
}

}

}
}
},

startsystemCommand: {
command: 'startsystem',
rank: 'manager',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

API.sendChat("[ QPlug.cz ] Systém spustený! Použite !prikazy pre zoznam príkazov.");

}
}
},

prikazyCommand: {
command: ['prikazy', 'príkazy', 'přikazy', 'příkazy', 'command', 'commands', 'cmd', 'cmds'],
rank: 'user',
type: 'startsWith',
functionality: function (chat, cmd) {
if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
if (!basicBot.commands.executable(this.rank, chat)) return void (0);
else{

var from = chat.un;
var msg = chat.message;
var medzera = msg.indexOf(' ');

if(medzera === -1){
API.sendChat("[ PRÍKAZY ] Príkazy nášho Bota najdeš na http://qplug.funsite.cz/bot/prikazy!");
return false;
}

else{
var meno = msg.substring(medzera + 2);
var user = basicBot.userUtilities.lookupUserName(meno);

if(user === false || !user.inRoom){
return API.sendChat("[@" + from + "] Nevidím tohto užívateľa v komunite!");
}

else if(user.username === chat.un){
return API.sendChat("[ PRÍKAZY ] Príkazy nášho Bota najdeš na http://qplug.funsite.cz/bot/prikazy!");
}

else{
return API.sendChat("[@"+ user.username +"] Príkazy nášho Bota najdeš na http://qplug.funsite.cz/bot/prikazy!");
}

}

}
}
}

}
};

loadChat(basicBot.startup);
}).call(this);

var msgs=[
"/me Hoď like na našu Facebook stránku aby si vedel všetko ako prvý! Link https://bit.ly/QPlugcz!",
"/me Náš Discord server https://bit.ly/QPlugczDiscord!",
"/me Pomocou DJovania získaš QPoints. (virtuálne peniaze) Viac na http://qplug.funsite.cz/bot/qpoints! :blue_heart:",
"/me Na našej stránke najdeš pravidlá a informácie o našej komunite. Stránka obsahuje okrem toho aj informácie o aktualizáciach nášho Bota. Link http://qplug.funsite.cz!"
];
var time=1800; // SEKUNDY
var timer;
API.on(API.CHAT_COMMAND, command);
API.sendChat("/startmsg");

function command(value){
console.log("command called");
var commandfunction = "";

if (value.indexOf(" ") == -1){
var commandfunction = value.substring(value.indexOf("/")+1,value.length);
}

else{
var commandfunction = value.substring(value.indexOf("/")+1,value.indexOf(" "));
}

var commandcontent =  value.substring(value.indexOf(" ")+1,value.length);

console.log("commandfunction: " + commandfunction);
console.log("commandcontent: " + commandcontent);

switch(commandfunction){

case "msg":
console.log("msg called");
API.chatLog("SPRÁVA "+ commandcontent + "> \'" + msgs[parseInt(commandcontent)-1] +"\'", true);
break;

case "pausemsg":
console.log("pausemsg called");
stoptimer();
API.chatLog("Správy sa teraz neodosielajú!",true);
break;

case "startmsg":
console.log("startmsg called");
refreshtimer();
API.chatLog("Správy sa teraz odosielajú!",true);
break;
}
}

function postmsg(){
var random = Math.floor((Math.random() * msgs.length));
API.sendChat(msgs[random]);
}

function refreshtimer(){
stoptimer(timer);
timer = window.setInterval(postmsg, time*1000);
}

function stoptimer(){
window.clearInterval(timer);
timer = null;
}

API.on(API.CHAT, adremove);
API.on(API.ADVANCE, advance); // VIP Grabovanie
API.on(API.CHAT, bouncer);
API.on(API.CHAT, rdj);

function adremove(a){
var msg = a.message;
var from = a.un;
var from_id = a.uid;

if(from_id === 23843691) return;

if(msg.indexOf("https://plug.dj/") > -1 || msg.indexOf("plug.dj/") > -1 || msg.indexOf("socket.dj") > -1 || msg.indexOf("http://socket.dj") > -1){
API.moderateDeleteChat(a.cid);
API.sendChat("[@"+ from +"] Budeš Mutnutý za spamovanie alebo zdielanie iných komunít v našej komunite!");
setTimeout(function(){ API.moderateMuteUser(from_id, 1, API.MUTE.MEDIUM); }, 5000);
}
}

function advance(obj){
if (!obj.dj || !obj.media) return;

var hellbyte = "4635487";
var tessi = "5477951";

if(obj.dj.id === 4635487 || obj.dj.id === 5477951){
$("#grab").click();
$(".pop-menu ul li:first-child").mousedown();
}
}

function bouncer(data){
var msg = data.message;
var fromid = data.uid;
var from = data.un;

// Staff
var meno = "";

if(msg === "!bouncer"){
if(fromid == meno){
API.sendChat("[@"+ from +"] Použil si Promote funkciu!");
setTimeout(function(){ API.moderateSetRole(fromid, 2); }, 500);
}

else{
API.sendChat("[@"+ from +"] Nemáš na to práva! Tento príkaz je iba pre Bouncerov.");
}

}
}

function rdj(data){
var msg = data.message;
var fromid = data.uid;
var from = data.un;

// Staff
var meno = "";

if(msg === "!rdj"){
if(fromid == meno){
API.sendChat("[@"+ from +"] Použil si Promote funkciu!");
setTimeout(function(){ API.moderateSetRole(fromid, 1); }, 500);
}

else{
API.sendChat("[@"+ from +"] Nemáš na to práva! Tento príkaz je iba pre Resident DJov.");
}

}
}

// AntiSpam
API.on(API.CHAT, function(chat){
var msg = chat.message;
var from = chat.un;
var fromID = chat.uid;

// Pomocou DJovania získaš QPoints. (virtuálne peniaze) Viac na http://qplug.funsite.cz/bot/qpoints! :blue_heart:
if(
msg.indexOf("Práve prebieha Nábor do QPlug.cz Týmu. Prihlás sa tu:") !== -1 ||
msg.indexOf("Vitaj späť") !== -1){
if(fromID == "23843691"){
setTimeout(function(){ API.moderateDeleteChat(chat.cid); }, 40000); // 40 000 milisekund = 40 sekund
}
}

if(
msg.indexOf("QPoints za mehnutí písně!") !== -1){
if(fromID == "23843691"){
setTimeout(function(){ API.moderateDeleteChat(chat.cid); }, 5000); // 5000 milisekund = 5 sekund
}
}

if(
msg.indexOf("Tvoja pozícia bola") !== -1){
if(fromID == "23843691"){
setTimeout(function(){ API.moderateDeleteChat(chat.cid); }, 10000); // 10 000 milisekund = 10 sekund
}
}

if(
msg.indexOf("QPoints za odehrání písně!") !== -1 ||
msg.indexOf("Špatná odpověď") !== -1 ||
msg.indexOf("Špatné číslo") !== -1){
if(fromID == "23843691"){
setTimeout(function(){ API.moderateDeleteChat(chat.cid); }, 20000); // 20 000 milisekund = 20 sekund
}
}
    
if(
msg.indexOf("Vyzvi někoho pomocí !duel") !== -1 ||
msg.indexOf("Tento uživatel se nenachází v místnosti!") !== -1 ||
msg.indexOf("Nemůžeš vyzvat sám sebe") !== -1 ||
msg.indexOf("Vsaď méně!") !== -1 ||
msg.indexOf("a bere si") !== -1 ||
msg.indexOf("Výzvu můžeš přijmout pomocí !ok") !== -1 ||
msg.indexOf("neodpověděl na vaší pozvánku k duelu!") !== -1 ||
msg.indexOf("Duel právě probíhá!") !== -1 ||
msg.indexOf("Za chvíli proběhne duel mezi") !== -1){
if(fromID == "23843691"){
setTimeout(function(){ API.moderateDeleteChat(chat.cid); }, 30000); // 30 000 milisekund = 30 sekund
}
}

if(
msg.indexOf("QPoints se správnou odpovědi") !== -1){
if(fromID == "23843691"){
setTimeout(function(){ API.moderateDeleteChat(chat.cid); }, 40000); // 40 000 milisekund = 40 sekund
}
}

if(
msg.indexOf("Odpovídejte pomocí !t") !== -1){
if(fromID == "23843691"){
setTimeout(function(){ API.moderateDeleteChat(chat.cid); }, 180000); // 180 000 milisekund = 180 sekund
}
}

});
