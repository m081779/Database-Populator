const inquirer = require('inquirer');
const mysql = require('mysql');
let connection;
let database;
let table;
let columns = [];
let num = 1;
let obj = {};

inquirer.prompt([
{
	type: 'input',
	message: 'What is url of the database you would like to connect to?',
	default: 'localhost',
	name: 'host'
},
{
	type: 'input',
	message: 'What is port you are trying to connect on?',
	default: 3306,
	name: 'port'
},
{
	type: 'input',
	message: 'What is the username?',
	default: 'root',
	name: 'user'
},
{
	type: 'password',
	message: 'What is the password?',
	name: 'password'
},	
{
	type: 'input',
	message: 'What is the name of the database you would like to modify?',
	name: 'database'
},
{
	type: 'input',
	message: 'What is the name of the table you would like to populate?',
	name: 'table'
}

]).then(res => {
	database = res.database;
	table = res.table;
	connection = mysql.createConnection({
		host: res.host,
		port: res.port,
		user: res.user,
		password: res.password,
		database: database
	});
	connection.connect(err => {
		if (err) throw err;
		console.log(`Connected to ${database} database successfully.`);
		connection.query('SHOW columns FROM '+table+'', (err, res) => {
			for (let i = 0; i<res.length; i++) {
				columns.push(res[i].Field)
			}
			console.log(columns)
			createRow();
		});
	});
});

function createRow(){
	if ( num === columns.length ) {
			console.log(obj);
			connection.query('INSERT INTO '+table+' SET ?', obj, err => {
				if (err) throw err;
				obj = {};
				inquirer.prompt([
				{
					type: 'confirm',
					message: 'Would you like to add another row to table "'+table+'"?',
					name: 'addAnother',
					default: false
				}
				]).then(res => {
					if (res.addAnother) {
						num = 1;
						obj = {};
						createRow();
					} else {
						console.log('Thanks, and have a nice day!');
						connection.end();
					}
				});
			});
		}

	if (num<columns.length) {
		let field = columns[num];
		inquirer.prompt([
			{
				type: 'text',
				message: 'What data would you like to enter for '+field+'?',
				name: 'data'
			}
		]).then(res => {
			obj[field] = res.data;
			num++
			createRow();
		});	
	}		
}
	
