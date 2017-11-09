const inquirer = require('inquirer');
const mysql = require('mysql');
let connection;
let database;
let table;
let columns = [];
let dataType = [];
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
		if (err) {
			console.log('There was an error connecting.  Please try again.');
		} else {
			console.log(`Connected to ${database} database successfully.`);
			connection.query('SHOW columns FROM ' + table, (err, res) => {
				for (let i = 0; i<res.length; i++) {
					columns.push(res[i].Field)
					dataType.push(res[i].Type)
				}
				checkAction();
			});
		}
	});
});

function checkAction() {

	inquirer.prompt([
				{
					type: 'list',
					name: 'action',
					message: 'Would you like to add a column or a row?',
					choices: ['Column', 'Row']
				}
				]).then(res => {
					if (res.action==='Column') {
						createColumn();
					} else {
						createRow();
					}
				});
}

function createColumn() {
	let last = columns[columns.length-1]
	inquirer.prompt([
	{
		type: 'input',
		name: 'name',
		message: 'What would you like to call your new column?'
	},
	{
		type: 'list',
		name: 'position',
		message: 'Your new column will be inserted after which column?',
		choices: columns,
		default: last
	},
	{
		type: 'list',
		name: 'type',
		message: 'What data type would you like to use for your column?',
		choices: ['VARCHAR', 'INTEGER', 'BOOLEAN', 'STRING', 'DECIMAL'],
		default: last
	},
	{
		type: 'input',
		name: 'charLim',
		message: 'What is the maximum number of characters allowed in this column, if any?',
		default: 0
	},
	{
		type: 'confirm',
		name: 'nullCase',
		message: 'Can your column contain null data?',
		default: false
	}
	]).then(res => {

		let position = res.position || last;
		!res.nullCase ? nullCase='NOT NULL' : '';
		let type = res.type;
		let charLim = function () {
			if (res.charlim==="0") {
				return '';
			} else {
				return '('+res.charLim+')';
			}
		}

		connection.query('ALTER TABLE ' + table + ' ADD COLUMN '+res.name+' '+type+' '+charLim()+' '+nullCase+' AFTER '+position+'', err=>{
			if (err) {
				console.log('There was an error adding your column.  Please try again.');
				console.log(err);
			} else {
				console.log(`You have successfully added a column named '${res.name}' to table '${table}'`);
				inquirer.prompt([
				{
					type: 'confirm',
					name: 'action',
					message: 'Would you like to continue adding to this database?',
					default: true
				}
				]).then( res => {
					if (res.action) {
						checkAction();
					} else {
						console.log('Thanks, and have a nice day!');
						connection.end();
					}
				});
			}
		});
	});
}

function createRow(){
	if ( num === columns.length ) {
			connection.query('INSERT INTO ' + table + ' SET ?', obj, err => {
				if (err) throw err;
				obj = {};
				inquirer.prompt([
				{
					type: 'confirm',
					message: 'Would you like to add another row to table "' + table + '"?',
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

	if ( num < columns.length ) {
		let field = columns[ num ];
		let type = dataType[ num ]
		inquirer.prompt([
			{
				type: 'text',
				message: 'What data would you like to enter for "' + field + '"? (data type: '+type+')',
				name: 'data'
			}
		]).then(res => {
			obj[field] = res.data;
			num++
			createRow();
		});	
	}		
}
	
