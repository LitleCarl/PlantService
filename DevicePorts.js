const fs = require('fs');
const _ = require('lodash');
const configObject = JSON.parse(fs.readFileSync('config.json', 'utf8'));
// 电平高低
const ElecLevel = {
    HIGH: 1,
    LOW: 0
}

// 上下拉电阻
const PULL = {
    OFF: 0,
    DOWN: 1,
    UP: 2
}

// Pin Mode
const PinMode = {
    INPUT: 0,
    OUTPUT: 1,
    PWM_OUTPUT: 2
}

const GPIO_LIB_Binding = require('./nbind.node');

const GPIO_LIB = GPIO_LIB_Binding.WiringPiBinding;
 
// 初始化Wiring Pi
GPIO_LIB.wrap_wiringPiSetup()

class InputPort {
    constructor(pinNumber, pull=PULL.OFF, name='unknown') {
        this.pinNumber = pinNumber;
        GPIO_LIB.wrap_pinMode(pinNumber, PinMode.INPUT);
        this.pull = pull;
        this.name = name;
    }

    read() {
        return GPIO_LIB.wrap_digitalRead(this.pinNumber);
    }

    toJSON() {
        return {
            name: this.name,
            pinNumber: this.pinNumber,
            value: this.read(),
            type: 'input'

        }
    }

    // Accessors
    
    // 设置上拉下拉电阻
    get pull() {
        return this._pull;
    }

    set pull(val){
        this._pull = val;
        GPIO_LIB.wrap_pullUpDnControl(this.pinNumber, val);
    }
}

class OutputPort {
    constructor(pinNumber, initialValue, pull=PULL.OFF, name='unknown') {
        this.pinNumber = pinNumber;
        GPIO_LIB.wrap_pinMode(pinNumber, PinMode.OUTPUT);
        this.pull = pull;
        this.initialValue = initialValue;
        this.currentValue = initialValue;
        this.name = name;
    }

    toJSON() {
        return {
            name: this.name,
            pinNumber: this.pinNumber,
            value: this.currentValue,
            type: 'output',
            timeLeft: this.timeLeft || 0,
            totalTime: this.totalTime
        }
    }

    // Accessors
    
    // 设置上拉下拉电阻
    get pull() {
        return this._pull;
    }

    set pull(val){
        this._pull = val;
        GPIO_LIB.wrap_pullUpDnControl(this.pinNumber, val);
    }

    // 设置上拉下拉电阻
    get currentValue() {
        return this._currentValue;
    }

    set currentValue(val){
        this._currentValue = val;
        GPIO_LIB.wrap_digitalWrite(this.pinNumber, val);
    }

    // timeout 0表示永久生效，否则则是超出制定秒数后进入相反电平
    setLevelWithTimeout(level, timeout=0) {
        if (this.timeoutToken) {
            console.log('timeoutToken 已经清除')
            clearTimeout(this.timeoutToken)
            this.timeoutToken = null;
        }

        if (this.timeIntervalToken) {
            console.log('timeIntervalToken 已经清除')
            clearInterval(this.timeIntervalToken);
            this.timeIntervalToken = null;
        }
        this.timeLeft = 0;
        this.totalTime = 0;

        this.currentValue = level;
        if (timeout > 0) {
            this.timeLeft = timeout * 1000;
            this.totalTime = timeout * 1000;

            this.timeIntervalToken = setInterval(()=>{
                this.timeLeft -= 1000;
            }, 1000)

            this.timeoutToken = setTimeout(()=>{
                this.currentValue = (1 - level)
                this.timeoutToken = null;
                clearInterval(this.timeIntervalToken);
                this.timeIntervalToken = null;
                this.timeLeft = 0;
                this.totalTime = 0;
            }, timeout * 1000)
        } 
    }
}

const outputPorts = _.map(configObject['outputs'], (outputItem)=>{            
    return new OutputPort(outputItem['pinNumber'], outputItem['initial_volt'], outputItem['pull'], outputItem['name'])
});

const inputPorts = _.map(configObject['inputs'], (outputItem)=>{            
    return new InputPort(outputItem['pinNumber'], outputItem['pull'], outputItem['name'])
});

module.exports = {'outputPorts': outputPorts, 'inputPorts': inputPorts};


