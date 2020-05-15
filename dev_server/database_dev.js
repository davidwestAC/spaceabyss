var mysql = require('mysql2/promise');

var pool = mysql.createPool({
    host     : process.env.IPADDRESS,
    user     : process.env.MYSQLUSER,
    password : process.env.MYSQLPASSWORD,
    database : process.env.MYSQLDATABASE,
    connectionLimit: 10
});

exports.pool = pool;


var connection = mysql.createConnection({
    host     : process.env.IPADDRESS,
    user     : process.env.MYSQLUSER,
    password : process.env.MYSQLPASSWORD,
    database : process.env.MYSQLDATABASE
});

exports.connection = connection;


module.exports = {
    connection,
    pool
}