var restify = require('restify');
var botbuilder = require('botbuilder');

const currentDate = Date.now();

// setup restify server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3987, function(){
	console.log('%s bot started at %s', server.name, server.url);
});


// create chat connector
var connector = new botbuilder.ChatConnector({
	appId: process.env.APP_ID,
	appPassword: process.env.APP_SECRET
});

// Main menu
var menuItems = { 
    "Créer une alarme": {
        item: "createAlarmOption"
    },
    "Consulter toutes mes alarmes": {
        item: "showAllAlarmOption"
    },
    "Consulter mes alarmes actives": {
        item: "showActiveAlarmOption"
    },
}

// listening for user inputs
server.post('/api/messages', connector.listen());

var bot = new botbuilder.UniversalBot(connector, [
	function (session) {
        session.conversationData.alarms = new Array();
		session.send('Bonjour bienvenue dans la gestion de vos alarmes.');
		session.beginDialog("mainMenu");
	},
	function (session, results) {
        
    }
]);

// Display the main menu and start a new request depending on user input.
bot.dialog("mainMenu", [
    function(session){
        botbuilder.Prompts.choice(session, "Menu principal:", menuItems, { listStyle: botbuilder.ListStyle.button });
    },
    function(session, results){
        if(results.response){
            session.beginDialog(menuItems[results.response.entity].item);
        }
    }
])
.triggerAction({
    // The user can request this at any time.
    // Once triggered, it clears the stack and prompts the main menu again.
    matches: /^main menu$|^menu$|^menu principal$/i,
    confirmPrompt: "Voulez vous vraiment retourner au menu principal ?"
});


// Create an alarm
bot.dialog('createAlarmOption', [
	function (session) {	
		session.send('Vous allez créer une alarme, merci de fournir les informations.')
        botbuilder.Prompts.text(session, "Quel est le nom de l'alarme ? ");
	},
	function (session, results) {
		session.conversationData.alarmName = results.response;
		botbuilder.Prompts.time(session, "Quel est la date de l'alarme ? (ex: June 6th at 5pm)");
	},
	function (session, results) {
        session.conversationData.alarmDate = botbuilder.EntityRecognizer.resolveTime([results.response]);
        session.conversationData.alarms.push({ 
            title: session.conversationData.alarmName,
            date: session.conversationData.alarmDate
        });
        session.send('Votre alarme a bien été crée.');
        session.replaceDialog("mainMenu"); // Display the menu again.
	}
]);

// Show all active alarms
bot.dialog('showAllAlarmOption', [
	function (session) {
		session.send('Voici toutes vos alarmes:');
		if(session.conversationData.alarms) {
			session.conversationData.alarms.forEach(function(element) {
				session.send(`
					Nom: ${element.title}
					Date: ${element.date} <br/>
				`);
			}, this);
		} else {
			session.send('Vous n\'avez acune alarme active.')
		}
        // session.endDialog();
        session.replaceDialog("mainMenu"); // Display the menu again.
	},
]);

// Show all alarms
bot.dialog('showActiveAlarmOption', [
	function (session) {
        session.send('Voici toutes vos alarmes actives:');        
		if(session.conversationData.alarms) {            
			session.conversationData.alarms.forEach(function(element) {
				if (Date.parse(element.date) > currentDate) {
					session.send(`
						Nom: ${element.title} <br/>
						Date: ${element.date} <br/>
					`);
				}
			}, this);
		} else {
			session.send('Vous n\'avez aucune alarme.');
		}
        // session.endDialog();
        session.replaceDialog("mainMenu"); // Display the menu again.
	}
]);
