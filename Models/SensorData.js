var Sequelize = require('sequelize');
var request = require('request');
const Op = Sequelize.Op;

var sequelize = new Sequelize('mainDB', null, null, {
    dialect: "sqlite",
    storage: './sensor_db.sqlite',
});

sequelize
  .authenticate()
  .then(function(err) {
    console.log('Connection has been established successfully.');
  }, function (err) {
    console.log('Unable to connect to the database:', err);
  });

//  MODELS
var SensorData = sequelize.define('sensor_data', {
  sensor_number: Sequelize.INTEGER,
  raw_value: Sequelize.INTEGER
});

SensorData.asyncFetchRecordsBySensorNumber = async function (sensorNumber) {
    return SensorData.findAll({
        where: {'sensor_number': sensorNumber},
        limit: 24 * 60 // 默认返回一天的历史记录
    })
}

SensorData.asyncGetLatestRecordsFromDB = async function () {
    const promise = new Promise(function(resolve, reject) {
        sequelize.query('SELECT * FROM \'sensor_data\' WHERE id IN (SELECT MAX(id) FROM \'sensor_data\' GROUP BY sensor_number)').then(
            function(responses) {
                if (responses[0]) {
                    resolve(responses[0]);
                } else {
                    reject('Unknown err');
                }
            }
        )
    })
    return promise;
}

SensorData.asyncFetchData = async function (url) {
    const promise = new Promise(function(resolve, reject) {
        var argv = require('minimist')(process.argv.slice(2));

        url = url || argv['url'];
        if (!url) {
            reject('URL not configured!');
            return;
        } else {
            request(url, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(body));
                }
            });
        }
    });
    return promise;
}

//  SYNC SCHEMA
sequelize
  .sync()
  .then(function(err) {
    console.log('It worked!');
  }, function (err) {
    console.log('An error occurred while creating the table:', err);
  });

module.exports = SensorData;
