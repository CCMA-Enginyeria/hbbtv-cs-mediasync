/****************************************************************************
 * Copyright 2017 British Broadcasting Corporation
 * and contributions Copyright 2017 British Telecommunications (BT) PLC.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * --------------------------------------------------------------------------
 * Summary of parts containing contributions
 *   by British Telecommunications (BT) PLC: options.logFunction and priv.log
*****************************************************************************/

var CorrelatedClock = window["dvbcss-clocks"].CorrelatedClock;

var WallClockClientProtocol = function(wallClock, options) {
    this.privateVars = {};
    priv = this.privateVars;
    //priv.serialiser = serialiser;

    priv.wallClock = wallClock;
    priv.parentClock = wallClock.parent;

    // initially unavailable and infinite dispersion
    priv.wallClock.correlation = priv.wallClock.correlation.butWith({initialError:Number.POSITIVE_INFINITY});
    priv.wallClock.speed = 1
    priv.wallClock.availabilityFlag = false;

    priv.altClock = new CorrelatedClock(priv.parentClock, {tickRate:wallClock.tickRate, correlation:wallClock.correlation});

    priv.sendTimer = null;

    priv.requestInterval = (options.requestInterval>0)?options.requestInterval:1000; // default
    priv.followupTimeout = (options.followupTimeout>0)?options.followupTimeout:3000; // default

    priv.log = (typeof options.logFunction === "function") ?  options.logFunction : function() {};

    priv.log("WallClockClientProtocol constructor: ", options);
    priv.dest = (options.dest)?options.dest:null;
    //priv.log(priv.dest);

    priv.responseCache =new Map();
    priv.started = false;
}

/**
 * @inheritdocs
 */
WallClockClientProtocol.prototype.start = function() {
    var priv = this.privateVars;
    priv.log("in WallClockClientProtocol.prototype.start");
    this._sendRequest();

    priv.started = true;
}

/**
 * @inheritdocs
 */
WallClockClientProtocol.prototype.stop = function() {
    var priv = this.privateVars;

    if (priv.sendTimer) {
        clearTimeout(priv.sendTimer);
        priv.sendTimer = null;
    }

    priv.started = false;
    priv.wallClock.setAvailabilityFlag(false);
}

/**
 * Handle the process of sending a request to the WC server
 * @private
 */
WallClockClientProtocol.prototype._sendRequest = function() {
    var priv = this.privateVars;

    // cancel any existing timer
    if (priv.sendTimer) {
        clearTimeout(priv.sendTimer);
        priv.sendTimer = null;
    }

    // send a request
    var t = WallClockMessage.nanosToSecsAndNanos(priv.parentClock.getNanos());
    var msg = WallClockMessage.makeRequest(t[0],t[1]);
    //msg = priv.serialiser.pack(msg);

//   priv.log("in WallClockClientProtocol.prototype._sendRequest");
//   priv.log(msg);
//   priv.log(priv.dest);
    this.emit("send", msg, priv.dest);
    // schedule the timer
    priv.sendTimer = setTimeout(this._sendRequest.bind(this), priv.requestInterval);
}

/**
 * Handle a received Wall clock protocol message
 * @param {Object} msg The received message, not already deserialised
 * @param {*} routing Opaque data to be passed back when sending the response, to ensure it is routed back to the sender
 */
WallClockClientProtocol.prototype.handleMessage = function(msg, routing) {
    var priv = this.privateVars;

    var t4 = priv.parentClock.getNanos();

    //msg = priv.serialiser.unpack(msg);
    
    msg = hexToJsonWC(msg);
    console.log("WallClock TV: ",WallClockMessage.secsAndNanosToNanos(msg.transmit_timevalues.transmit_timevalues_secs,msg.transmit_timevalues.transmit_timevalues_nanos)/1000000);
    var key = ""+msg.originate_timevalue_secs+":"+msg.originate_timevalue_nanos;
    if (msg.type == WallClockMessage.TYPES.responseWithFollowUp) {

        // follow-up is promised ... set timeout to use it
        var handle = setTimeout(function() {
            priv.responseCache.delete(key);
            this._updateClockIfCandidateIsImprovement(msg, t4);
        }.bind(this), priv.followupTimeout);
        priv.responseCache.set(key, handle);

    } else {
        if (msg.type == WallClockMessage.TYPES.followUp) {
            // followup! cancel the timer, if one is cached
            if (priv.responseCache.has(key)) {
                var handle = priv.responseCache.get(key);
                clearTimeout(handle);
                priv.responseCache.delete(key);
            }
        }
        this._updateClockIfCandidateIsImprovement(msg, t4);
    }
}

WallClockClientProtocol.prototype._updateClockIfCandidateIsImprovement = function(msg,t4) {
    var priv = this.privateVars;

    var candidate = new Candidate(msg,t4);
    var candidateCorrelation = candidate.toCorrelation(priv.wallClock);

    priv.altClock.setCorrelation(candidateCorrelation);

    var now = priv.wallClock.now();

    var dispersionNew = priv.altClock.dispersionAtTime(now);
    var dispersionExisting = priv.wallClock.dispersionAtTime(now);

    if (dispersionNew < dispersionExisting) {
        priv.wallClock.correlation = priv.altClock.correlation;
        priv.wallClock.availabilityFlag = true;
    }
}

/**
 * Returns true if this protocol handler is started.
 */
WallClockClientProtocol.prototype.isStarted = function() {
    var priv = this.privateVars;

    return priv.started ? true:false;
}

WallClockClientProtocol.prototype.on = function(key, callback) {
    this._onListeners = this._onListeners || {};
    this._onListeners[key] = this._onListeners[key] || [];
    this._onListeners[key].push(callback);
}

WallClockClientProtocol.prototype.off = function(key, callback) {
    console.log('emit off method called ... unimplemented');
}

WallClockClientProtocol.prototype.emit = function(key) {
    var args = [];
    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i]);
    }
    for (var i = this._onListeners[key].length - 1; i >= 0; i--) {
        this._onListeners[key][i].apply(this, args);
    }
}

