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

const GPIO_LIB_Binding = require('nbind');
const GPIO_LIB = GPIO_LIB_Binding.init().lib.WiringPiBinding;
 
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
            value: this.read()
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
            value: this.currentValue
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
}

const outputPorts = _.map(configObject['outputs'], (outputItem)=>{            
    return new OutputPort(outputItem['pinNumber'], outputItem['initial_volt'], outputItem['pull'], outputItem['name'])
});

const inputPorts = _.map(configObject['inputs'], (outputItem)=>{            
    return new InputPort(outputItem['pinNumber'], outputItem['pull'], outputItem['name'])
});

module.exports = {'outputPorts': outputPorts, 'inputPorts': inputPorts};


