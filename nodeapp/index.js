var Parse = require("parse-server").ParseServer;
var app = require("express")();
var MongoClient = require('mongodb').MongoClient;
var mongoose = require("mongoose");
var Db = require('mongodb').Db, Server = require('mongodb').Server;
var uri = "mongodb://nodeapp:123@nodeapp-shard-00-00-eutg2.mongodb.net:27017,nodeapp-shard-00-01-eutg2.mongodb.net:27017,nodeapp-shard-00-02-eutg2.mongodb.net:27017/nodeappdb?ssl=true&replicaSet=nodeapp-shard-0&authSource=admin";
//MongoClient.connect(uri, function(err, db) {
 // db.close();
//});
var parser = require('body-parser');
var Dashboard = require('parse-dashboard');

app.use(parser.urlencoded({extended: true}));
app.use(parser.json());

function generateString(n)
{
	var text = "";
	var symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < n; i++)
		text += symbols.charAt(Math.floor(Math.random() * symbols.length));
	return text;
}

key = generateString(5);

var UserSchema = new mongoose.Schema({
	name: {
		type: String,
		unique: true,
		required: true
	},
	pass: {
		type: String,
		required: true
	},
	server: {
		databaseURI: String,
		appId: String,
      	masterKey: String
	}
}); 
user = mongoose.model("user", UserSchema);
mongoose.connect(uri);


function addUser(userData){
	//user = "Sasha";
	//pass = "123321";
	//let db = await MongoClient.connect(uri);
	/*let servers = [
		new Server("nodeapp-shard-00-00-eutg2.mongodb.net", 27017, {ssl: true}),
		new Server("nodeapp-shard-00-01-eutg2.mongodb.net", 27017, {ssl: true}),
		new Server("nodeapp-shard-00-02-eutg2.mongodb.net", 27017, {ssl: true})
	]
	let replSet = new ReplSet(servers, {ssl: true, replicaSet: 'nodeapp-shard-0'})
	db = new Db('nodeappdb', replSet, {authSource: 'admin'});
	let user = await db.authenticate('nodeapp', '123');*/
	return new user({
		name: userData.username,
		pass: userData.password
	}).save();
}

console.log("asdsadsds")


async function createInstance(user){
	var db = new Db(user.name, new Server("localhost", 27017));
	await db.open();
	var addition = await db.addUser(user.name, user.pass, {roles: [{role: "readWrite", db: user.name}]});
			let serverSettings = {
			  databaseURI: "mongodb://"+ user.name + ":" + user.pass + "@127.0.0.1:27017/" + user.name,
		      appId: user.name + ".app",
		      masterKey: key,
		      serverURL: "http://localhost:1024/" + user.name + ".app",
			};
			console.log("Server got settings", serverSettings)
			user.server = serverSettings;
			await startParse(serverSettings, user);
			addDashboard(user);
			console.log("success");
}

function startParse(parseSettings, user){
	let server = new Parse(parseSettings);
	app.use("/" + user.name + ".app", server);
	//console.log("/" + user.name + ".app");
}

function addDashboard(user){
	//user.server.then(function(dashboardConfig){
	var newServer = {
		apps: [
			{
				serverURL: "http://localhost:1024/" + user.name + ".app",
				appId: user.name + ".app",
				masterKey: key,
				appName: user.name,
			},
		]
	};
	newServer.users = [];
	var dashboardSettings = {
			user: user.name,
			pass: user.pass,
		}
		//console.log(newServer);
        newServer.users.push(dashboardSettings);
	//});
	let dashboard = new Dashboard(newServer, true);
	console.log("Dashboard got settings", newServer);
	console.log("Dashboard URL: http://localhost:1024/" + user.name + ".dashboard")
    app.use('/' + user.name + '.dashboard', dashboard);
}

app.get('/', function (req, res) {
  res.send("Hi!");
});

app.post('/signUp', function(req, res) {
	var newUser = addUser(req.body).then(async function(user) {
		//res.send("User registered");
		await createInstance(user);
		res.send("User registered");/*.then(function(newServerSettings){
			user.server = newServerSettings;
			user.save();
			res.send(newServerSettings);
		});*/
	}).catch(function(error) {
		res.send("Error:" + error);
	})

})

app.listen(1024, function(){console.log("App is running")});

var http = require('http');
var fs = require('fs');
var index = fs.readFileSync('index.html');

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(index);
}).listen(8080, function(){console.log("Server is started")});