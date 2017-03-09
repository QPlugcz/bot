(function() {
	// Change this to your GitHub username so you don't have to modify so many things.
	var fork = "Hellbyte";

	// Define our function responsible for extending the bot.
	function extend() {
		// If the bot hasn't been loaded properly, try again in 1 second(s).
		if (!window.bot) {
			return setTimeout(extend, 1 * 1000);
		}

		// Precaution to make sure it is assigned properly.
		var bot = window.bot;

		// Load custom settings set below
		bot.retrieveSettings();

		//Extend the bot here, either by calling another function or here directly.

		// You can add more spam words to the bot.
		var spamWords = ['spam1', 'spam2', 'spam3', 'spam4'];
		for (var i = 0; i < spamWords.length; i++) {
			window.bot.chatUtilities.spam.push(spamWords[i]);
		}


		var poznamka1 = ["Franta72"];
		var poznamka2 = ["Testovní poznámka :P"];
		bot.commands.report = {
			command: ['nahlasit', 'report'],
			rank: 'user',
			type: 'startswith',
			functionality: function(chat, cmd) {
				if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
				if (!bot.commands.executable(this.rank, chat)) return void(0);
				else {
					var zprava = chat.message.substr(cmd.length + 1)
					if (zprava.length == 0) {
						API.sendChat("[@" + chat.un + "] Tento příkaz slouží k nahlášení problému v místnosti! Používejte pouze tehdy, když nikdo z členu Staff Týmu není přítomen!");
					} else if (zprava[0] == "!" || zprava.includes(" !")) {
						API.sendChat("@" + chat.un + "] Omlouváme se, ale nahlášení nesmí obsahovat vykřičníky.");
					} else if ((zprava.includes("jeb") || zprava.includes("kokot") || zprava.includes("piča") || zprava.includes("debil")) && (zprava.includes("idiot") || zprava.includes("kurva") || zprava.includes("retard"))) {
						API.sendChat("@" + chat.un + "] Omlouváme se, ale nahlášení nesmí obsahovat urážlivé výrazy.");
					} else {
						poznamka1.push(chat.un);
						poznamka2.push(zprava);
            API.sendChat("@" + chat.un + "] Nahlášeno! Zprávu budou řešit členové staff týmu v nejblížší době!");
					}
				}
			}
		};

		bot.commands.echohistory = {
			command: ['reporty'],
			rank: 'bouncer',
			type: 'startswith',
			functionality: function(chat, cmd) {
				if (this.type === 'exact' && chat.message.length !== cmd.length) return void(0);
				if (!bot.commands.executable(this.rank, chat)) return void(0);
				else {
					var cislo = chat.message.substr(cmd.length + 1)
					if (cislo.length == 0) {
						if (poznamka1.length == 1) {
							API.sendChat("[@" + chat.un + "] Dnes byl nahlášen 1 případ. Přečti si zprávu pomocí !reporty 1");
						} else {
							API.sendChat("[@" + chat.un + "] Dnes bylo nahlášeno " + poznamka1.length + " případů. Přečtěte si je pomocí !reporty 'číslo'!");
						}
					} else if (isNaN(cislo) == true) {
						API.sendChat("[@" + chat.un + "] \"" + cislo + "\" není číslo!");
					} else if (cislo > poznamka1.length) {
						API.sendChat("[@" + chat.un + "] Dnes nebylo zaznamenáno tolik případů!");
					} else if (cislo - 1 < 0) {
						API.sendChat("[@" + chat.un + "] Toto nahlášení neexistuje!");
					} else {
						API.sendChat("[ REPORT ] Uživatel " + poznamka1[cislo - 1] + " napsal nahlášení: " + poznamka2[cislo - 1]);
					}
				}
			}
		};

		function getRank(name) {
			for (var i = 0; i < API.getUsers().length; ++i) {
				if (API.getUsers()[i].username == name) {
					return API.getUsers()[i].role;
				}
			}
		}

		var napsatreport = (function() {
			return function() {
				var lastreport = poznamka2[poznamka2.length - 1]
				if (!lastreport.includes("://") && getRank(poznamka1[poznamka1.length - 1]) > 1 && API.getUsers().length > 1) {
					API.sendChat(lastreport);
				}
			};
		})();






		// Load the chat package again to account for any changes
		bot.loadChat();
	}

	//Change the bots default settings and make sure they are loaded on launch

	localStorage.setItem("basicBotsettings", JSON.stringify({
		 botName: "MFEBOT",
            language: "qplugcz",
            chatLink: "https://rawgit.com/QPlugcz/QBot/master/package/qplugcz.json",
            scriptLink: "https://rawgit.com/QPlugcz/QBot/master/bot.js",
            roomLock: false, // Requires an extension to re-load the script
            startupCap: 1, // 1-200
            startupVolume: 0, // 0-100
            startupEmoji: false, // true or false
            autowoot: true,
            autoskip: false,
            smartSkip: true,
            cmdDeletion: true,
            maximumDc: 120,
            bouncerPlus: false,
            lockdownEnabled: false,
            historySkip: false,
            maximumSongLength: 6,
            commandCooldown: 5,
            usercommandsEnabled: true,
            thorCommand: true,
            thorCooldown: 5,
            nahodaCommand: true,
            nahodaCooldown: 30,
            skipPosition: 2,
            filterChat: true,
            etaRestriction: false,
            welcome: true,
            songstats: false,
        minihry: false,
        inteligence: true,
            commandLiteral: "!",
	}));

	// Start the bot and extend it when it has loaded.
	$.getScript("https://rawgit.com/QPlugcz/QBot/master/bot.js", extend);

}).call(this);
