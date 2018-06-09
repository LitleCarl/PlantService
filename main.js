const express = require('express')
const app = express()
const CronJob = require('cron').CronJob;
const timeZone = 'Asia/Shanghai'
const _ = require('lodash')
var bodyParser = require('body-parser');
const SensorData = require('./Models/SensorData.js')

const {inputPorts, outputPorts} = require('./DevicePorts.js')

// 定义API ERROR
function apiError(message) {
  return {'message': message, success: 0}
}

function apiResult(data) {
  return {'data': data, success: 1}
}

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.get('/', (req, res) => res.json({name: 'cjx'}))
app.get('/SensorData', (req, res) => {
    SensorData.asyncGetLatestRecordsFromDB().then((results)=>{
        res.json(apiResult(results));
    })
})

app.get('/SensorData/:sensor_number', (req, res) => {
  SensorData.asyncFetchRecordsBySensorNumber(req.params.sensor_number).then((results)=>{
    res.json(apiResult(results));
  })
})

// 获取IO端口状态
app.get('/DevicePorts', (req, res) => {
  let inputPortsJson = _.map(inputPorts, (p)=>p.toJSON())
  res.json(apiResult({
    "inputPorts": _.map(inputPorts, (p)=>p.toJSON()),
    "outputPorts": _.map(outputPorts, (p)=>p.toJSON())    
  }))
})

// 设置OutputPort的输出电压
app.post('/DevicePorts/:pinNumber', (req, res) => {
  var pinNumber = parseInt(req.params.pinNumber)
  var level = parseInt(req.body.level)
  var timeout = parseInt(req.body.timeout) || 0

  const filtedPort = _.filter(outputPorts, (p)=>{
    return p.pinNumber == pinNumber
  })[0]

  if (filtedPort && level >= 0 && level <= 1) {
    filtedPort.setLevelWithTimeout(level, timeout)
    res.json(apiResult())
  } else {
    res.json(apiError('端口不存在或参数错误'))
  }
})

app.listen(3000, () => console.log('Example app listening on port 3000!'))

var job = new CronJob('00 * * * * *', async function() {
  /*
   * Runs every weekday (Monday through Friday)
   * at 11:30:00 AM. It does not run on Saturday
   * or Sunday.
   */
  try {
    let data = await SensorData.asyncFetchData();
    console.log(data)

    SensorData.bulkCreate(_.map(data, function(item) {
        return {sensor_number: item['sensor_num'], raw_value: item['value']}
    })).then(function(){
        console.log('Bulk Create Done!')
    })
      
      console.log('SensorData.asyncFetchData:', data)
    }
  catch (err) {
    console.error('SensorData.asyncFetchData Error: ', err);
  }
  
}, function () {
    /* This function is executed when the job stops */
  },
  true, /* Start the job right now */
  timeZone /* Time zone of this job. */
);
