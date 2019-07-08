(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["dvbcss-clocks"] = factory();
	else
		root["dvbcss-clocks"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
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
	*****************************************************************************/

	var ClockBase = __webpack_require__(2);
	var DateNowClock = __webpack_require__(6);
	var CorrelatedClock = __webpack_require__(8);
	var Correlation = __webpack_require__(9);
	var OffsetClock = __webpack_require__(10);

	/**
	 * @module dvbcss-clocks
	 *
	 * @description
	 * The dvbcss-clocks library consists of this module containing the clock classes:
	 *
	 * <ul>
	 *   <li> dvbcss-clocks.{@link ClockBase} - base class for all clock implementations.
	 *   <li> cdvbcss-locks.{@link DateNowClock} - a root clock based on <tt>Date.now()</tt>
	 *   <li> dvbcss-clocks.{@link CorrelatedClock} - a clock based on a parent using a correlation.
	 *   <li> dvbcss-clocks.{@link Correlation} - a correlation.
	 *   <li> dvbcss-clocks.{@link OffsetClock} - a clock that applies a fixed offset to enable compensating for rendering latency.
	 * </ul>
	 *
	 * <p>Clock can be built into hierarchies, where one clock is the root, and other
	 * clocks use it as their parent, and others use those as their parents etc.
	 *
	 * <p>Clocks raise events, and listen to events from their parents:
	 * <ul>
	 *   <li> {@link event:change} ... when any change occurs to a clock, or it is affected by a change of its parents.
	 *   <li> {@link event:available} ... when aa clock becomes flagged available
	 *   <li> {@link event:unavailable} ... when aa clock becomes flagged unavailable
	 * </ul>
	 */
	module.exports = {
	    /**
	     * base class for all clock implementations
	     * @see ClockBase
	     */
	    ClockBase: ClockBase,
	    /**
	     * a root clock based on <tt>Date.now()</tt>
	     * @see DateNowClock
	     */
	    DateNowClock: DateNowClock,
	    /**
	     * a clock based on a parent using a correlation.
	     * @see CorrelatedClock
	     */
	    CorrelatedClock: CorrelatedClock,
	    /**
	     * a correlation.
	     * @see Correlation
	     */
	    Correlation: Correlation,
	    /**
	     * a clock that applies a fixed offset to enable compensating for rendering latency.
	     * @see OffsetClock
	     */
	    OffsetClock: OffsetClock
	};


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

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
	 *   by British Telecommunications (BT) PLC:
	 *     CorrelatedClock.prototype.setAtTime
	 *     CorrelatedClock.prototype._rescheduleTimers
	*****************************************************************************/

	var EventEmitter = __webpack_require__(3);
	var inherits = __webpack_require__(4);

	var WeakMap = __webpack_require__(5);
	var PRIVATE = new WeakMap();

	var nextIdNum = 0;
	var nextTimeoutHandle = 0;


	/**
	 * There has been a change in the timing of this clock.
	 * This might be due to a change made directly to this clock, or a change
	 * made to a parent in the hierarchy that affected this clock.
	 *
	 * <p>Causes of changes to clocks include: changes to
	 * [speed]{@link ClockBase#speed},
	 * [tick rate]{@link ClockBase#tickRate},
	 * [correlation]{@link CorrelatedClock#correlation}, or
	 * [parentage]{@link ClockBase#parent}.
	 * Changes to availability do not cause this event to fire.
	 *
	 * <p>The following parameters are passed as arguments to the event handler:
	 * @event change
	 * @param {ClockBase} source The clock that fired the event.
	 */

	/**
	 * This clock has become available.
	 * 
	 * This might be because [availabilityFlag]{@link ClockBase#availabilityFlag}
	 * became true for this clock, or one of its parents in the hierarchy, causing this
	 * clock and all its parents to now be flagged as available.
	 *
	 * <p>The following parameters are passed as arguments to the event handler:
	 * @event available
	 * @param {ClockBase} source The clock that fired the event.
	 */

	/**
	 * This clock has become unavailable.
	 * 
	 * This might be because [availabilityFlag]{@link ClockBase#availabilityFlag}
	 * became false for this clock, or one of its parents in the hierarchy.
	 *
	 * <p>The following parameters are passed as arguments to the event handler:
	 * @event unavailable
	 * @param {ClockBase} source The clock that fired the event.
	 */


	/**
	 * @module clocks
	 * @exports ClockBase
	 * @class ClockBase
	 *
	 * @classdesc
	 * Abstract Base class for clock implementations.
	 *
	 * <p>Implementations that can be used are:
	 * {@link DateNowClock} and
	 * {@link CorrelatedClock}.
	 *
	 * <p>This is the base class on which other clocks are implemented. It provides
	 * the basic framework of properties, getter and setters for common properties
	 * such as availability, speed, tick rate and parents, and provides the basic
	 * events framework, some standard helper methods for time conversion between clocks, comparisons
	 * between clocks and calculating disperison (error/uncertainty).
	 *
	 * <p>Clocks may fire the following events:
	 * <ul>
	 *   <li> [change]{@link event:change} 
	 *   <li> [available]{@link event:available} 
	 *   <li> [unavailable]{@link event:unavailable} 
	 * </ul>
	 *
	 * <p>Clock implementations should inherit from this class and implement some
	 * or all of the following method stubs:
	 *   [now()]{@link ClockBase#now}
	 *   [calcWhen()]{@link ClockBase#calcWhen}
	 *   [getTickRate()]{@link ClockBase#getTickRate}
	 *   [setTickRate()]{@link ClockBase#setTickRate}
	 *   [getSpeed()]{@link ClockBase#getSpeed}
	 *   [setSpeed()]{@link ClockBase#setSpeed}
	 *   [getParent()]{@link ClockBase#getParent}
	 *   [setParent()]{@link ClockBase#setParent}
	 *   [toParentTime()]{@link ClockBase#toParentTime}
	 *   [fromParentTime()]{@link ClockBase#fromParentTime}
	 *   [_errorAtTime()]{@link ClockBase#_errorAtTime}
	 *
	 * @listens change

	 * @constructor
	 * @abstract
	 */
	var ClockBase = function() {
	    EventEmitter.call(this);
	    
	    PRIVATE.set(this, {});
	    var priv = PRIVATE.get(this);

	    this._availability = true;
	    
	    /**
	     * Every clock instance has a unique ID assigned to it for convenience. This is always of the form "clock_N" where N is a unique number.
	     * @var {String} id
	     * @memberof ClockBase
	     * @instance
	     */
	    this.id = "clock_"+nextIdNum;
	    nextIdNum = nextIdNum+1;
	    
	    priv.timerHandles = {};
	    this.on('change', this._rescheduleTimers.bind(this));
	    
	    priv.availablePrev = this._availability;
	};

	inherits(ClockBase, EventEmitter);

	/**
	 * @returns the current time value of this clock in units of ticks of the clock, or NaN if it cannot be determined (e.g. if the clock is missinga parent)
	 * @abstract
	 */
	ClockBase.prototype.now = function() {
	    throw "Unimplemented";
	};

	/**
	 * @var {Number} speed The speed at which this clock is running.
	 * 1.0 = normal. 0.0 = pause. negative values mean it ticks in reverse.
	 *
	 * For some implementations this can be changed, as well as read.
	 *
	 * <p>The underlying implementation of this property uses the
	 * [getSpeed]{@link ClockBase#getSpeed} and
	 * [setSpeed]{@link ClockBase#setSpeed} methods.
	 * @default 1.0
	 * @memberof ClockBase
	 * @instance
	 * @fires change
	 */
	Object.defineProperty(ClockBase.prototype, "speed", {
	    get: function() { return this.getSpeed(); },
	    set: function(v) { return this.setSpeed(v); },
	});

	/**
	 * @var {Number} tickRate The rate of this clock (in ticks per second).
	 *
	 * For some implementations this can be changed, as well as read.
	 *
	 * <p>The underlying implementation of this property uses the
	 * [getTickRate]{@link ClockBase#getTickRate} and
	 * [setTickRate]{@link ClockBase#setTickRate} methods.
	 *
	 * @memberof ClockBase
	 * @instance
	 * @fires change
	 */
	Object.defineProperty(ClockBase.prototype, "tickRate", {
	    get: function() { return this.getTickRate(); },
	    set: function(v) { return this.setTickRate(v); },
	});

	/**
	 * @var {ClockBase} parent The parent of this clock, or <tt>null</tt> if it has no parent.
	 *
	 * For some implementations this can be changed, as well as read.
	 *
	 * <p>The underlying implementation of this property uses the
	 * [getParent]{@link ClockBase#getParent} and
	 * [setParent]{@link ClockBase#setParent} methods.
	 *
	 * @memberof ClockBase
	 * @instance
	 * @fires change
	 */
	Object.defineProperty(ClockBase.prototype, "parent", {
	    get: function() { return this.getParent(); },
	    set: function(v) { return this.setParent(v); },
	});

	/**
	 * @var {Boolean} availabilityFlag The availability flag for this clock.
	 *
	 * For some implementations this can be changed, as well as read.
	 *
	 * <p>This is only the flag for this clock. Its availability may also be affected
	 * by the flags on its parents. To determine true availability, call the
	 * [isAvailable]{@link ClockBase#isAvailable} method.
	 *
	 * <p>The underlying implementation of this property uses the
	 * [getAvailabilityFlag]{@link ClockBase#getAvailabilityFlag} and
	 * [setAvailabilityFlag]{@link ClockBase#setAvailabilityFlag} methods.
	 *
	* @default true
	 * @memberof ClockBase
	 * @instance
	 * @fires change
	 * @fires available
	 * @fires unavailable
	 */
	Object.defineProperty(ClockBase.prototype, "availabilityFlag", {
	    get: function() { return this.getAvailabilityFlag(); },
	    set: function(v) { return this.setAvailabilityFlag(v); },
	});

	/**
	 * Returns the current speed of this clock.
	 * @returns {Number} Speed of this clock.
	 * @abstract
	 */
	ClockBase.prototype.getSpeed = function() {
	    return 1.0;
	};

	/**
	 * Sets the current speed of this clock, or throws an exception if this is not possible
	 * @param {Number} newSpeed The new speed for this clock.
	 * @abstract
	 * @fires change
	 */
	ClockBase.prototype.setSpeed = function(newSpeed) {
	    throw "Unimplemented";
	};

	/**
	 * Calculates the effective speed of this clock, taking into account the effects
	 * of the speed settings for all of its parents.
	 * @returns {Number} the effective speed.
	 */
	ClockBase.prototype.getEffectiveSpeed = function() {
	    var s = 1.0;
	    var clock = this;
	    while (clock !== null) {
	        s = s * clock.getSpeed();
	        clock = clock.getParent();
	    }
	    return s;
	};

	/**
	 * Returns the current tick rate of this clock.
	 * @returns {Number} Tick rate in ticks/second.
	 * @abstract
	 */
	ClockBase.prototype.getTickRate = function() {
	    throw "Unimplemented";
	};

	/**
	 * Sets the current tick rate of this clock, or throws an exception if this is not possible.
	 * @param {Number} newRate New tick rate in ticks/second.
	 * @abstract
	 * @fires change
	 */
	ClockBase.prototype.setTickRate = function(newRate) {
	    throw "Unimplemented";
	};

	/**
	 * Return the current time of this clock but converted to units of nanoseconds, instead of the normal units of the tick rate.
	 * @returns {Number} current time of this clock in nanoseconds.
	 */
	ClockBase.prototype.getNanos = function() {
	    return this.now() * 1000000000 / this.getTickRate();
	};

	/**
	 * Convert a timevalue from nanoseconds to the units of this clock, given its current [tickRate]{@link ClockBase#tickRate}
	 * @param {Number} time in nanoseconds.
	 * @returns {Number} the supplied time converted to units of its tick rate.
	 */
	ClockBase.prototype.fromNanos = function(nanos) {
	    return nanos * this.getTickRate() / 1000000000;
	};

	/**
	 * Is this clock currently available? Given its availability flag and the availability of its parents.
	 * @returns {Boolean} True if this clock is available, and all its parents are available; otherwise false.
	 */
	ClockBase.prototype.isAvailable = function() {
	    var parent = this.getParent();
	    return this._availability && (!parent || parent.isAvailable());
	};

	/**
	 * Sets the availability flag for this clock.
	 * 
	 * <p>This is only the flag for this clock. Its availability may also be affected
	 * by the flags on its parents. To determine true availability, call the
	 * [isAvailable]{@link ClockBase#isAvailable} method.
	 *
	 * @param {Boolean} availability The availability flag for this clock
	 * @fires unavailable
	 * @fires available
	 */
	ClockBase.prototype.setAvailabilityFlag = function(availability) {
	    this._availability = availability;
	    this.notifyAvailabilityChange();
	};

	/**
	 * Cause the "available" or "unavailable" events to fire if availability has
	 * changed since last time this method was called. Subclasses should call this
	 * to robustly generate "available" or "unavailable" events instead of trying
	 * to figure out if there has been a change for themselves.
	 * @fires unavailable
	 * @fires available
	 */
	ClockBase.prototype.notifyAvailabilityChange = function() {
	    var priv = PRIVATE.get(this);
	    
	    var availableNow = this.isAvailable();
	    if (Boolean(availableNow) != Boolean(priv.availablePrev)) {
	        priv.availablePrev = availableNow;
	        this.emit(availableNow?"available":"unavailable", this);
	    }
	};

	/**
	 * Returns the availability flag for this clock (without taking into account whether its parents are available).
	 * 
	 * <p>This is only the flag for this clock. Its availability may also be affected
	 * by the flags on its parents. To determine true availability, call the
	 * [isAvailable]{@link ClockBase#isAvailable} method.
	 *
	 * @returns {Boolean} The availability flag of this clock
	 */
	ClockBase.prototype.getAvailabilityFlag = function() {
	    return this._availability;
	};

	/**
	 * Convert a time value for this clock into a time value corresponding to teh underlying system time source being used by the root clock.
	 *
	 * <p>For example: if this clock is part of a hierarchy, where the root clock of the hierarchy is a [DateNowClock]{@link DateNowClock} then
	 * this method converts the supplied time to be in the same units as <tt>Date.now()</tt>.
	 *
	 * @param {Number} ticksWhen Time value of this clock.
	 * @return {Number} The corresponding time value in the units of the underlying system clock that is being used by the root clock, or <tt>NaN</tt> if this conversion is not possible.
	 * @abstract
	 */
	ClockBase.prototype.calcWhen = function(ticksWhen) {
	    throw "Unimplemented";
	};

	/**
	 * Return the root clock for the hierarchy that this clock is part of.
	 *
	 * <p>If this clock is the root clock (it has no parent), then it will return itself.
	 * 
	 * @return {ClockBase} The root clock of the hierarchy
	 */
	ClockBase.prototype.getRoot = function() {
	    var p = this;
	    var p2 = p.getParent();
	    while (p2) {
	        p=p2;
	        p2=p.getParent();
	    }
	    return p;
	};

	/**
	 * Convert a time for the root clock to a time for this clock.
	 * @param {Number} t A time value of the root clock.
	 * @returns {Number} The corresponding time value for this clock.
	 */
	ClockBase.prototype.fromRootTime = function(t) {
	    var p = this.getParent();
	    if (!p) {
	        return t;
	    } else {
	        var x = p.fromRootTime(t);
	        return this.fromParentTime(x);
	    }
	};

	/**
	 * Convert a time for this clock to a time for the root clock.
	 * @param {Number} t A time value for this clock.
	 * @returns {Number} The corresponding time value of the root clock, or <tt>NaN</tt> if this is not possible.
	 */
	ClockBase.prototype.toRootTime = function(t) {
	    var p = this.getParent();
	    if (!p) {
	        return t;
	    } else {
	        var x = this.toParentTime(t);
	        return p.toRootTime(x);
	    }
	};

	/**
	 * Convert a time value for this clock to a time value for any other clock in the same hierarchy as this one.
	 * @param {ClockBase} otherClock The clock to convert the value value to.
	 * @param {Number} t Time value of this clock.
	 * @returns {Number} The corresponding time value for the specified <tt>otherClock</tt>, or <tt>NaN</tt> if this is not possible.
	 * @throws if this clock is not part of the same hierarchy as the other clock.
	 */
	ClockBase.prototype.toOtherClockTime = function(otherClock, t) {
	    var selfAncestry = this.getAncestry();
	    var otherAncestry = otherClock.getAncestry();
	    var clock;
	    
	    var common = false;
	    while (selfAncestry.length && otherAncestry.length && selfAncestry[selfAncestry.length-1] === otherAncestry[otherAncestry.length-1]) {
	        selfAncestry.pop();
	        otherAncestry.pop();
	        common=true;
	    }
	    
	    if (!common) {
	        throw "No common ancestor clock.";
	    }
	    
	    selfAncestry.forEach(function(clock) {
	        t = clock.toParentTime(t);
	    });
	    
	    otherAncestry.reverse();
	    
	    otherAncestry.forEach(function(clock) {
	        t = clock.fromParentTime(t);
	    });
	    
	    return t;
	};

	/**
	 * Get an array of the clocks that are the parents and ancestors of this clock.
	 * @returns {ClockBase[]} an array starting with this clock and ending with the root clock.
	 */
	ClockBase.prototype.getAncestry = function() {
	    var ancestry = [this];
	    var c = this;
	    while (c) {
	        var p = c.getParent();
	        if (p) {
	            ancestry.push(p);
	        }
	        c=p;
	    }
	    return ancestry;
	};

	/**
	 * Convert time value of this clock to the equivalent time of its parent.
	 *
	 * @param {Number} t Time value of this clock
	 * @returns {Number} corresponding time of the parent clock, or <tt>NaN</tt> if this is not possible.
	 * @abstract
	 */
	ClockBase.prototype.toParentTime = function(t) {
	    throw "Unimplemented";
	};

	/**
	 * Convert time value of this clock's parent to the equivalent time of this clock.
	 * @param {Number} t Time value of this clock's parent
	 * @returns {Number} corresponding time of this clock.
	 * @abstract
	 */
	ClockBase.prototype.fromParentTime = function(t) {
	    throw "Unimplemented";
	};

	/**
	 * Returns the parent of this clock, or <tt>null</tt> if it has no parent.
	 * @returns {ClockBase} parent clock, or <tt>null</tt>
	 * @abstract
	 */
	ClockBase.prototype.getParent = function() {
	    throw "Unimplemented";
	};

	/**
	 * Set/change the parent of this clock.
	 * @param {ClockBase} parent clock, or <tt>null</tt>
	 * @throws if it is not allowed to set this clock's parent.
	 * @abstract
	 * @fires change
	 */
	ClockBase.prototype.setParent = function(newParent) {
	    throw "Unimplemented";
	};

	/**
	 * Calculate the potential for difference between this clock and another clock.
	 * @param {ClockBase} otherClock The clock to compare with.
	 * @returns {Number} The potential difference in units of seconds. If effective speeds or tick rates differ, this will always be <tt>Number.POSITIVE_INFINITY</tt>
	 *
	 * If the clocks differ in effective speed or tick rate, even slightly, then
	 * this means that the clocks will eventually diverge to infinity, and so the
	 * returned difference will equal +infinity.
	 *
	 * If the clocks do not differ in effective speed or tick rate, then there will
	 * be a constant time difference between them. This is what is returned.
	 */
	ClockBase.prototype.clockDiff = function(otherClock) {
	    var thisSpeed = this.getEffectiveSpeed();
	    var otherSpeed = otherClock.getEffectiveSpeed();
	    
	    if (thisSpeed !== otherSpeed) {
	        return Number.POSITIVE_INFINITY;
	    } else if (this.getTickRate() !== otherClock.getTickRate()) {
	        return Number.POSITIVE_INFINITY;
	    } else {
	        var root = this.getRoot();
	        var t = root.now();
	        var t1 = this.fromRootTime(t);
	        var t2 = otherClock.fromRootTime(t);
	        return Math.abs(t1-t2) / this.getTickRate();
	    }
	};

	/**
	 * Calculates the dispersion (maximum error bounds) at the specified clock time.
	 * This takes into account the contribution to error of this clock and its ancestors.
	 * @param {Number} t The time position of this clock for which the dispersion is to be calculated.
	 * @returns {Number} Dispersion (in seconds) at the specified clock time.
	 */
	 ClockBase.prototype.dispersionAtTime = function(t) {
	    var disp = this._errorAtTime(t);
	    
	    var p = this.getParent();
	    if (p) {
	        var pt = this.toParentTime(t);
	        disp += p.dispersionAtTime(pt);
	    }
	    
	    return disp;
	};

	/**
	 * Calculates the error/uncertainty contribution of this clock at a given time position.
	 * 
	 * <p>It is not intended that this function is called directly. Instead, call
	 * [dispersionAtTime()]{@link ClockBase.dispersionAtTime} which uses this function
	 * as part of calculating the total dispersion.
	 *
	 * @param {Number} t A time position of this clock 
	 * @returns {Number} the potential for error (in seconds) arising from this clock
	 * at a given time of this clock. Does not include the contribution of
	 * any parent clocks.
	 *
	 * @abstract
	 */
	ClockBase.prototype._errorAtTime = function(t) {
	    throw "Unimplemented";
	};

	/**
	 * Retrieve the maximium frequency error (in ppm) of the root clock in the hierarchy. 
	 *
	 * <p>This method contains an implementation for non-root clocks only. It must
	 * be overriden for root clock implementations.
	 *
	 * @returns {Number} The maximum frequency error of the root clock (in parts per million)
	 * @abstract
	 */
	ClockBase.prototype.getRootMaxFreqError = function() {
	    var root = this.getRoot();
	    if (root === this) {
	        throw "Unimplemented";
	    } else {
	        return root.getRootMaxFreqError();
	    }
	};


	/**
	 * A callback that is called when using [setTimeout]{@link ClockBase#setTimeout} or [setAtTime][@link ClockBase#setAtTime].
	 *
	 * @callback setTimeoutCallback
	 * @param {...*} args The parameters that were passed when the callback was scheduled.
	 * @this ClockBase
	 */

	/**
	 * Request a timeout callback when the time of this clock passes the current time plus
	 * the number of specified ticks.
	 *
	 * <p>If there are changes to timing caused by changes to this clock or its parents, then this timer will be automatically
	 * rescheduled to compensate.
	 *
	 * @param {setTimeoutCallback} func  The function to callback
	 * @param {Number} ticks  The callback is triggered when the clock passes (reaches or jumps past) this number of ticks beyond the current time.
	 * @param {...*} args Other arguments are passed to the callback
	 * @returns A handle for the timer. Pass this handle to [clearTimeout]{@link ClockBase#clearTimeout} to cancel this timer callback.
	 */
	ClockBase.prototype.setTimeout = function(func, ticks) {
		arguments[1] = arguments[1] + this.now();
		return this.setAtTime.apply(this, arguments);
	};

	/**
	 * Request a timeout callback when the time of this clock passes the specified time.
	 *
	 * <p>If there are changes to timing caused by changes to this clock or its parents, then this timer will be automatically
	 * rescheduled to compensate.
	 *
	 * @param {setTimeoutCallBack} func  The function to callback
	 * @param {Number} when  The callback is triggered when the clock passes (reaches or jumps past) this time.
	 * @param {...*} args Other arguments are passed to the callback
	 * @returns A handle for the timer. Pass this handle to [clearTimeout]{@link ClockBase#clearTimeout} to cancel this timer callback.
	 */
	ClockBase.prototype.setAtTime = function(func, when) {
	    var priv = PRIVATE.get(this);
	    
		var self = this;
		var handle = self.id + ":timeout-" + nextTimeoutHandle++;
		var root = self.getRoot();

		if (root === null) {
			root = self;
		}

	    // remove first two args
	    var args = new Array(arguments.length-2);
	    for(var i=2; i<arguments.length; i++) {
	        args[i-2] = arguments[i];
	    }

		var callback = function() {
			delete priv.timerHandles[handle];
			func.apply(self, args);
		}
	;
		var numRootTicks = self.toRootTime(when) - root.now();
		if (numRootTicks !== 0) {
			numRootTicks = root.getSpeed() !== 0 ? numRootTicks / root.getSpeed() : NaN;
		}
		var millis = numRootTicks * (1000 / root.getTickRate());
		var realHandle;
		if (!isNaN(millis)) {
			realHandle = setTimeout(callback, millis);
		}

		priv.timerHandles[handle] = { realHandle:realHandle, when:when, callback:callback };

		return handle;
	};


	ClockBase.prototype._rescheduleTimers = function() {
		// clock timing has changed, we need to re-schedule all timers
	    var priv = PRIVATE.get(this);

		var root = this.getRoot();

		for(var handle in priv.timerHandles) {
			if (priv.timerHandles.hasOwnProperty(handle)) {
				var d = priv.timerHandles[handle];

				// clear existing timer
				if (d.realHandle !== null && d.realHandle !== undefined) {
					clearTimeout(d.realHandle);
				}

				// re-calculate when this timer is due and re-schedule
				var numRootTicks = this.toRootTime(d.when) - root.now();
				if (numRootTicks !== 0) {
					numRootTicks = root.getSpeed() !== 0 ? numRootTicks / root.getSpeed() : NaN;
				}
				var millis = numRootTicks * (1000 / root.getTickRate());
				if (!isNaN(millis)) {
					d.realHandle = setTimeout(d.callback, Math.max(0,millis));
				} else {
					delete d.realHandle;
				}
			}
		}
	};

	/**
	 * Clear (cancel) a timer that was scheduled using [setTimeout]{@link ClockBase#setTimeout} or [setAtTime][@link ClockBase#setAtTime].
	 *
	 * @param handle - The handle for the previously scheduled callback.
	 *
	 * If the handle does not represent a callback that was scheduled against this clock, then this method returns without doing anything.
	 */
	ClockBase.prototype.clearTimeout = function(handle) {
	    var priv = PRIVATE.get(this);

		var d = priv.timerHandles[handle];
		if (d !== undefined) {
			clearTimeout(d.realHandle);
			delete priv.timerHandles[handle];
		}
	};




	module.exports = ClockBase;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	function EventEmitter() {
	  this._events = this._events || {};
	  this._maxListeners = this._maxListeners || undefined;
	}
	module.exports = EventEmitter;

	// Backwards-compat with node 0.10.x
	EventEmitter.EventEmitter = EventEmitter;

	EventEmitter.prototype._events = undefined;
	EventEmitter.prototype._maxListeners = undefined;

	// By default EventEmitters will print a warning if more than 10 listeners are
	// added to it. This is a useful default which helps finding memory leaks.
	EventEmitter.defaultMaxListeners = 10;

	// Obviously not all Emitters should be limited to 10. This function allows
	// that to be increased. Set to zero for unlimited.
	EventEmitter.prototype.setMaxListeners = function(n) {
	  if (!isNumber(n) || n < 0 || isNaN(n))
	    throw TypeError('n must be a positive number');
	  this._maxListeners = n;
	  return this;
	};

	EventEmitter.prototype.emit = function(type) {
	  var er, handler, len, args, i, listeners;

	  if (!this._events)
	    this._events = {};

	  // If there is no 'error' event listener then throw.
	  if (type === 'error') {
	    if (!this._events.error ||
	        (isObject(this._events.error) && !this._events.error.length)) {
	      er = arguments[1];
	      if (er instanceof Error) {
	        throw er; // Unhandled 'error' event
	      } else {
	        // At least give some kind of context to the user
	        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
	        err.context = er;
	        throw err;
	      }
	    }
	  }

	  handler = this._events[type];

	  if (isUndefined(handler))
	    return false;

	  if (isFunction(handler)) {
	    switch (arguments.length) {
	      // fast cases
	      case 1:
	        handler.call(this);
	        break;
	      case 2:
	        handler.call(this, arguments[1]);
	        break;
	      case 3:
	        handler.call(this, arguments[1], arguments[2]);
	        break;
	      // slower
	      default:
	        args = Array.prototype.slice.call(arguments, 1);
	        handler.apply(this, args);
	    }
	  } else if (isObject(handler)) {
	    args = Array.prototype.slice.call(arguments, 1);
	    listeners = handler.slice();
	    len = listeners.length;
	    for (i = 0; i < len; i++)
	      listeners[i].apply(this, args);
	  }

	  return true;
	};

	EventEmitter.prototype.addListener = function(type, listener) {
	  var m;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events)
	    this._events = {};

	  // To avoid recursion in the case that type === "newListener"! Before
	  // adding it to the listeners, first emit "newListener".
	  if (this._events.newListener)
	    this.emit('newListener', type,
	              isFunction(listener.listener) ?
	              listener.listener : listener);

	  if (!this._events[type])
	    // Optimize the case of one listener. Don't need the extra array object.
	    this._events[type] = listener;
	  else if (isObject(this._events[type]))
	    // If we've already got an array, just append.
	    this._events[type].push(listener);
	  else
	    // Adding the second element, need to change to array.
	    this._events[type] = [this._events[type], listener];

	  // Check for listener leak
	  if (isObject(this._events[type]) && !this._events[type].warned) {
	    if (!isUndefined(this._maxListeners)) {
	      m = this._maxListeners;
	    } else {
	      m = EventEmitter.defaultMaxListeners;
	    }

	    if (m && m > 0 && this._events[type].length > m) {
	      this._events[type].warned = true;
	      console.error('(node) warning: possible EventEmitter memory ' +
	                    'leak detected. %d listeners added. ' +
	                    'Use emitter.setMaxListeners() to increase limit.',
	                    this._events[type].length);
	      if (typeof console.trace === 'function') {
	        // not supported in IE 10
	        console.trace();
	      }
	    }
	  }

	  return this;
	};

	EventEmitter.prototype.on = EventEmitter.prototype.addListener;

	EventEmitter.prototype.once = function(type, listener) {
	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  var fired = false;

	  function g() {
	    this.removeListener(type, g);

	    if (!fired) {
	      fired = true;
	      listener.apply(this, arguments);
	    }
	  }

	  g.listener = listener;
	  this.on(type, g);

	  return this;
	};

	// emits a 'removeListener' event iff the listener was removed
	EventEmitter.prototype.removeListener = function(type, listener) {
	  var list, position, length, i;

	  if (!isFunction(listener))
	    throw TypeError('listener must be a function');

	  if (!this._events || !this._events[type])
	    return this;

	  list = this._events[type];
	  length = list.length;
	  position = -1;

	  if (list === listener ||
	      (isFunction(list.listener) && list.listener === listener)) {
	    delete this._events[type];
	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);

	  } else if (isObject(list)) {
	    for (i = length; i-- > 0;) {
	      if (list[i] === listener ||
	          (list[i].listener && list[i].listener === listener)) {
	        position = i;
	        break;
	      }
	    }

	    if (position < 0)
	      return this;

	    if (list.length === 1) {
	      list.length = 0;
	      delete this._events[type];
	    } else {
	      list.splice(position, 1);
	    }

	    if (this._events.removeListener)
	      this.emit('removeListener', type, listener);
	  }

	  return this;
	};

	EventEmitter.prototype.removeAllListeners = function(type) {
	  var key, listeners;

	  if (!this._events)
	    return this;

	  // not listening for removeListener, no need to emit
	  if (!this._events.removeListener) {
	    if (arguments.length === 0)
	      this._events = {};
	    else if (this._events[type])
	      delete this._events[type];
	    return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
	    for (key in this._events) {
	      if (key === 'removeListener') continue;
	      this.removeAllListeners(key);
	    }
	    this.removeAllListeners('removeListener');
	    this._events = {};
	    return this;
	  }

	  listeners = this._events[type];

	  if (isFunction(listeners)) {
	    this.removeListener(type, listeners);
	  } else if (listeners) {
	    // LIFO order
	    while (listeners.length)
	      this.removeListener(type, listeners[listeners.length - 1]);
	  }
	  delete this._events[type];

	  return this;
	};

	EventEmitter.prototype.listeners = function(type) {
	  var ret;
	  if (!this._events || !this._events[type])
	    ret = [];
	  else if (isFunction(this._events[type]))
	    ret = [this._events[type]];
	  else
	    ret = this._events[type].slice();
	  return ret;
	};

	EventEmitter.prototype.listenerCount = function(type) {
	  if (this._events) {
	    var evlistener = this._events[type];

	    if (isFunction(evlistener))
	      return 1;
	    else if (evlistener)
	      return evlistener.length;
	  }
	  return 0;
	};

	EventEmitter.listenerCount = function(emitter, type) {
	  return emitter.listenerCount(type);
	};

	function isFunction(arg) {
	  return typeof arg === 'function';
	}

	function isNumber(arg) {
	  return typeof arg === 'number';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	function isUndefined(arg) {
	  return arg === void 0;
	}


/***/ }),
/* 4 */
/***/ (function(module, exports) {

	if (typeof Object.create === 'function') {
	  // implementation from standard node.js 'util' module
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    ctor.prototype = Object.create(superCtor.prototype, {
	      constructor: {
	        value: ctor,
	        enumerable: false,
	        writable: true,
	        configurable: true
	      }
	    });
	  };
	} else {
	  // old school shim for old browsers
	  module.exports = function inherits(ctor, superCtor) {
	    ctor.super_ = superCtor
	    var TempCtor = function () {}
	    TempCtor.prototype = superCtor.prototype
	    ctor.prototype = new TempCtor()
	    ctor.prototype.constructor = ctor
	  }
	}


/***/ }),
/* 5 */
/***/ (function(module, exports) {

	// Copyright (C) 2011 Google Inc.
	//
	// Licensed under the Apache License, Version 2.0 (the "License");
	// you may not use this file except in compliance with the License.
	// You may obtain a copy of the License at
	//
	// http://www.apache.org/licenses/LICENSE-2.0
	//
	// Unless required by applicable law or agreed to in writing, software
	// distributed under the License is distributed on an "AS IS" BASIS,
	// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	// See the License for the specific language governing permissions and
	// limitations under the License.

	/**
	 * @fileoverview Install a leaky WeakMap emulation on platforms that
	 * don't provide a built-in one.
	 *
	 * <p>Assumes that an ES5 platform where, if {@code WeakMap} is
	 * already present, then it conforms to the anticipated ES6
	 * specification. To run this file on an ES5 or almost ES5
	 * implementation where the {@code WeakMap} specification does not
	 * quite conform, run <code>repairES5.js</code> first.
	 *
	 * <p>Even though WeakMapModule is not global, the linter thinks it
	 * is, which is why it is in the overrides list below.
	 *
	 * <p>NOTE: Before using this WeakMap emulation in a non-SES
	 * environment, see the note below about hiddenRecord.
	 *
	 * @author Mark S. Miller
	 * @requires crypto, ArrayBuffer, Uint8Array, navigator, console
	 * @overrides WeakMap, ses, Proxy
	 * @overrides WeakMapModule
	 */

	/**
	 * This {@code WeakMap} emulation is observably equivalent to the
	 * ES-Harmony WeakMap, but with leakier garbage collection properties.
	 *
	 * <p>As with true WeakMaps, in this emulation, a key does not
	 * retain maps indexed by that key and (crucially) a map does not
	 * retain the keys it indexes. A map by itself also does not retain
	 * the values associated with that map.
	 *
	 * <p>However, the values associated with a key in some map are
	 * retained so long as that key is retained and those associations are
	 * not overridden. For example, when used to support membranes, all
	 * values exported from a given membrane will live for the lifetime
	 * they would have had in the absence of an interposed membrane. Even
	 * when the membrane is revoked, all objects that would have been
	 * reachable in the absence of revocation will still be reachable, as
	 * far as the GC can tell, even though they will no longer be relevant
	 * to ongoing computation.
	 *
	 * <p>The API implemented here is approximately the API as implemented
	 * in FF6.0a1 and agreed to by MarkM, Andreas Gal, and Dave Herman,
	 * rather than the offially approved proposal page. TODO(erights):
	 * upgrade the ecmascript WeakMap proposal page to explain this API
	 * change and present to EcmaScript committee for their approval.
	 *
	 * <p>The first difference between the emulation here and that in
	 * FF6.0a1 is the presence of non enumerable {@code get___, has___,
	 * set___, and delete___} methods on WeakMap instances to represent
	 * what would be the hidden internal properties of a primitive
	 * implementation. Whereas the FF6.0a1 WeakMap.prototype methods
	 * require their {@code this} to be a genuine WeakMap instance (i.e.,
	 * an object of {@code [[Class]]} "WeakMap}), since there is nothing
	 * unforgeable about the pseudo-internal method names used here,
	 * nothing prevents these emulated prototype methods from being
	 * applied to non-WeakMaps with pseudo-internal methods of the same
	 * names.
	 *
	 * <p>Another difference is that our emulated {@code
	 * WeakMap.prototype} is not itself a WeakMap. A problem with the
	 * current FF6.0a1 API is that WeakMap.prototype is itself a WeakMap
	 * providing ambient mutability and an ambient communications
	 * channel. Thus, if a WeakMap is already present and has this
	 * problem, repairES5.js wraps it in a safe wrappper in order to
	 * prevent access to this channel. (See
	 * PATCH_MUTABLE_FROZEN_WEAKMAP_PROTO in repairES5.js).
	 */

	/**
	 * If this is a full <a href=
	 * "http://code.google.com/p/es-lab/wiki/SecureableES5"
	 * >secureable ES5</a> platform and the ES-Harmony {@code WeakMap} is
	 * absent, install an approximate emulation.
	 *
	 * <p>If WeakMap is present but cannot store some objects, use our approximate
	 * emulation as a wrapper.
	 *
	 * <p>If this is almost a secureable ES5 platform, then WeakMap.js
	 * should be run after repairES5.js.
	 *
	 * <p>See {@code WeakMap} for documentation of the garbage collection
	 * properties of this WeakMap emulation.
	 */
	(function WeakMapModule() {
	  "use strict";

	  if (typeof ses !== 'undefined' && ses.ok && !ses.ok()) {
	    // already too broken, so give up
	    return;
	  }

	  /**
	   * In some cases (current Firefox), we must make a choice betweeen a
	   * WeakMap which is capable of using all varieties of host objects as
	   * keys and one which is capable of safely using proxies as keys. See
	   * comments below about HostWeakMap and DoubleWeakMap for details.
	   *
	   * This function (which is a global, not exposed to guests) marks a
	   * WeakMap as permitted to do what is necessary to index all host
	   * objects, at the cost of making it unsafe for proxies.
	   *
	   * Do not apply this function to anything which is not a genuine
	   * fresh WeakMap.
	   */
	  function weakMapPermitHostObjects(map) {
	    // identity of function used as a secret -- good enough and cheap
	    if (map.permitHostObjects___) {
	      map.permitHostObjects___(weakMapPermitHostObjects);
	    }
	  }
	  if (typeof ses !== 'undefined') {
	    ses.weakMapPermitHostObjects = weakMapPermitHostObjects;
	  }

	  // IE 11 has no Proxy but has a broken WeakMap such that we need to patch
	  // it using DoubleWeakMap; this flag tells DoubleWeakMap so.
	  var doubleWeakMapCheckSilentFailure = false;

	  // Check if there is already a good-enough WeakMap implementation, and if so
	  // exit without replacing it.
	  if (typeof WeakMap === 'function') {
	    var HostWeakMap = WeakMap;
	    // There is a WeakMap -- is it good enough?
	    if (typeof navigator !== 'undefined' &&
	        /Firefox/.test(navigator.userAgent)) {
	      // We're now *assuming not*, because as of this writing (2013-05-06)
	      // Firefox's WeakMaps have a miscellany of objects they won't accept, and
	      // we don't want to make an exhaustive list, and testing for just one
	      // will be a problem if that one is fixed alone (as they did for Event).

	      // If there is a platform that we *can* reliably test on, here's how to
	      // do it:
	      //  var problematic = ... ;
	      //  var testHostMap = new HostWeakMap();
	      //  try {
	      //    testHostMap.set(problematic, 1);  // Firefox 20 will throw here
	      //    if (testHostMap.get(problematic) === 1) {
	      //      return;
	      //    }
	      //  } catch (e) {}

	    } else {
	      // IE 11 bug: WeakMaps silently fail to store frozen objects.
	      var testMap = new HostWeakMap();
	      var testObject = Object.freeze({});
	      testMap.set(testObject, 1);
	      if (testMap.get(testObject) !== 1) {
	        doubleWeakMapCheckSilentFailure = true;
	        // Fall through to installing our WeakMap.
	      } else {
	        module.exports = WeakMap;
	        return;
	      }
	    }
	  }

	  var hop = Object.prototype.hasOwnProperty;
	  var gopn = Object.getOwnPropertyNames;
	  var defProp = Object.defineProperty;
	  var isExtensible = Object.isExtensible;

	  /**
	   * Security depends on HIDDEN_NAME being both <i>unguessable</i> and
	   * <i>undiscoverable</i> by untrusted code.
	   *
	   * <p>Given the known weaknesses of Math.random() on existing
	   * browsers, it does not generate unguessability we can be confident
	   * of.
	   *
	   * <p>It is the monkey patching logic in this file that is intended
	   * to ensure undiscoverability. The basic idea is that there are
	   * three fundamental means of discovering properties of an object:
	   * The for/in loop, Object.keys(), and Object.getOwnPropertyNames(),
	   * as well as some proposed ES6 extensions that appear on our
	   * whitelist. The first two only discover enumerable properties, and
	   * we only use HIDDEN_NAME to name a non-enumerable property, so the
	   * only remaining threat should be getOwnPropertyNames and some
	   * proposed ES6 extensions that appear on our whitelist. We monkey
	   * patch them to remove HIDDEN_NAME from the list of properties they
	   * returns.
	   *
	   * <p>TODO(erights): On a platform with built-in Proxies, proxies
	   * could be used to trap and thereby discover the HIDDEN_NAME, so we
	   * need to monkey patch Proxy.create, Proxy.createFunction, etc, in
	   * order to wrap the provided handler with the real handler which
	   * filters out all traps using HIDDEN_NAME.
	   *
	   * <p>TODO(erights): Revisit Mike Stay's suggestion that we use an
	   * encapsulated function at a not-necessarily-secret name, which
	   * uses the Stiegler shared-state rights amplification pattern to
	   * reveal the associated value only to the WeakMap in which this key
	   * is associated with that value. Since only the key retains the
	   * function, the function can also remember the key without causing
	   * leakage of the key, so this doesn't violate our general gc
	   * goals. In addition, because the name need not be a guarded
	   * secret, we could efficiently handle cross-frame frozen keys.
	   */
	  var HIDDEN_NAME_PREFIX = 'weakmap:';
	  var HIDDEN_NAME = HIDDEN_NAME_PREFIX + 'ident:' + Math.random() + '___';

	  if (typeof crypto !== 'undefined' &&
	      typeof crypto.getRandomValues === 'function' &&
	      typeof ArrayBuffer === 'function' &&
	      typeof Uint8Array === 'function') {
	    var ab = new ArrayBuffer(25);
	    var u8s = new Uint8Array(ab);
	    crypto.getRandomValues(u8s);
	    HIDDEN_NAME = HIDDEN_NAME_PREFIX + 'rand:' +
	      Array.prototype.map.call(u8s, function(u8) {
	        return (u8 % 36).toString(36);
	      }).join('') + '___';
	  }

	  function isNotHiddenName(name) {
	    return !(
	        name.substr(0, HIDDEN_NAME_PREFIX.length) == HIDDEN_NAME_PREFIX &&
	        name.substr(name.length - 3) === '___');
	  }

	  /**
	   * Monkey patch getOwnPropertyNames to avoid revealing the
	   * HIDDEN_NAME.
	   *
	   * <p>The ES5.1 spec requires each name to appear only once, but as
	   * of this writing, this requirement is controversial for ES6, so we
	   * made this code robust against this case. If the resulting extra
	   * search turns out to be expensive, we can probably relax this once
	   * ES6 is adequately supported on all major browsers, iff no browser
	   * versions we support at that time have relaxed this constraint
	   * without providing built-in ES6 WeakMaps.
	   */
	  defProp(Object, 'getOwnPropertyNames', {
	    value: function fakeGetOwnPropertyNames(obj) {
	      return gopn(obj).filter(isNotHiddenName);
	    }
	  });

	  /**
	   * getPropertyNames is not in ES5 but it is proposed for ES6 and
	   * does appear in our whitelist, so we need to clean it too.
	   */
	  if ('getPropertyNames' in Object) {
	    var originalGetPropertyNames = Object.getPropertyNames;
	    defProp(Object, 'getPropertyNames', {
	      value: function fakeGetPropertyNames(obj) {
	        return originalGetPropertyNames(obj).filter(isNotHiddenName);
	      }
	    });
	  }

	  /**
	   * <p>To treat objects as identity-keys with reasonable efficiency
	   * on ES5 by itself (i.e., without any object-keyed collections), we
	   * need to add a hidden property to such key objects when we
	   * can. This raises several issues:
	   * <ul>
	   * <li>Arranging to add this property to objects before we lose the
	   *     chance, and
	   * <li>Hiding the existence of this new property from most
	   *     JavaScript code.
	   * <li>Preventing <i>certification theft</i>, where one object is
	   *     created falsely claiming to be the key of an association
	   *     actually keyed by another object.
	   * <li>Preventing <i>value theft</i>, where untrusted code with
	   *     access to a key object but not a weak map nevertheless
	   *     obtains access to the value associated with that key in that
	   *     weak map.
	   * </ul>
	   * We do so by
	   * <ul>
	   * <li>Making the name of the hidden property unguessable, so "[]"
	   *     indexing, which we cannot intercept, cannot be used to access
	   *     a property without knowing the name.
	   * <li>Making the hidden property non-enumerable, so we need not
	   *     worry about for-in loops or {@code Object.keys},
	   * <li>monkey patching those reflective methods that would
	   *     prevent extensions, to add this hidden property first,
	   * <li>monkey patching those methods that would reveal this
	   *     hidden property.
	   * </ul>
	   * Unfortunately, because of same-origin iframes, we cannot reliably
	   * add this hidden property before an object becomes
	   * non-extensible. Instead, if we encounter a non-extensible object
	   * without a hidden record that we can detect (whether or not it has
	   * a hidden record stored under a name secret to us), then we just
	   * use the key object itself to represent its identity in a brute
	   * force leaky map stored in the weak map, losing all the advantages
	   * of weakness for these.
	   */
	  function getHiddenRecord(key) {
	    if (key !== Object(key)) {
	      throw new TypeError('Not an object: ' + key);
	    }
	    var hiddenRecord = key[HIDDEN_NAME];
	    if (hiddenRecord && hiddenRecord.key === key) { return hiddenRecord; }
	    if (!isExtensible(key)) {
	      // Weak map must brute force, as explained in doc-comment above.
	      return void 0;
	    }

	    // The hiddenRecord and the key point directly at each other, via
	    // the "key" and HIDDEN_NAME properties respectively. The key
	    // field is for quickly verifying that this hidden record is an
	    // own property, not a hidden record from up the prototype chain.
	    //
	    // NOTE: Because this WeakMap emulation is meant only for systems like
	    // SES where Object.prototype is frozen without any numeric
	    // properties, it is ok to use an object literal for the hiddenRecord.
	    // This has two advantages:
	    // * It is much faster in a performance critical place
	    // * It avoids relying on Object.create(null), which had been
	    //   problematic on Chrome 28.0.1480.0. See
	    //   https://code.google.com/p/google-caja/issues/detail?id=1687
	    hiddenRecord = { key: key };

	    // When using this WeakMap emulation on platforms where
	    // Object.prototype might not be frozen and Object.create(null) is
	    // reliable, use the following two commented out lines instead.
	    // hiddenRecord = Object.create(null);
	    // hiddenRecord.key = key;

	    // Please contact us if you need this to work on platforms where
	    // Object.prototype might not be frozen and
	    // Object.create(null) might not be reliable.

	    try {
	      defProp(key, HIDDEN_NAME, {
	        value: hiddenRecord,
	        writable: false,
	        enumerable: false,
	        configurable: false
	      });
	      return hiddenRecord;
	    } catch (error) {
	      // Under some circumstances, isExtensible seems to misreport whether
	      // the HIDDEN_NAME can be defined.
	      // The circumstances have not been isolated, but at least affect
	      // Node.js v0.10.26 on TravisCI / Linux, but not the same version of
	      // Node.js on OS X.
	      return void 0;
	    }
	  }

	  /**
	   * Monkey patch operations that would make their argument
	   * non-extensible.
	   *
	   * <p>The monkey patched versions throw a TypeError if their
	   * argument is not an object, so it should only be done to functions
	   * that should throw a TypeError anyway if their argument is not an
	   * object.
	   */
	  (function(){
	    var oldFreeze = Object.freeze;
	    defProp(Object, 'freeze', {
	      value: function identifyingFreeze(obj) {
	        getHiddenRecord(obj);
	        return oldFreeze(obj);
	      }
	    });
	    var oldSeal = Object.seal;
	    defProp(Object, 'seal', {
	      value: function identifyingSeal(obj) {
	        getHiddenRecord(obj);
	        return oldSeal(obj);
	      }
	    });
	    var oldPreventExtensions = Object.preventExtensions;
	    defProp(Object, 'preventExtensions', {
	      value: function identifyingPreventExtensions(obj) {
	        getHiddenRecord(obj);
	        return oldPreventExtensions(obj);
	      }
	    });
	  })();

	  function constFunc(func) {
	    func.prototype = null;
	    return Object.freeze(func);
	  }

	  var calledAsFunctionWarningDone = false;
	  function calledAsFunctionWarning() {
	    // Future ES6 WeakMap is currently (2013-09-10) expected to reject WeakMap()
	    // but we used to permit it and do it ourselves, so warn only.
	    if (!calledAsFunctionWarningDone && typeof console !== 'undefined') {
	      calledAsFunctionWarningDone = true;
	      console.warn('WeakMap should be invoked as new WeakMap(), not ' +
	          'WeakMap(). This will be an error in the future.');
	    }
	  }

	  var nextId = 0;

	  var OurWeakMap = function() {
	    if (!(this instanceof OurWeakMap)) {  // approximate test for new ...()
	      calledAsFunctionWarning();
	    }

	    // We are currently (12/25/2012) never encountering any prematurely
	    // non-extensible keys.
	    var keys = []; // brute force for prematurely non-extensible keys.
	    var values = []; // brute force for corresponding values.
	    var id = nextId++;

	    function get___(key, opt_default) {
	      var index;
	      var hiddenRecord = getHiddenRecord(key);
	      if (hiddenRecord) {
	        return id in hiddenRecord ? hiddenRecord[id] : opt_default;
	      } else {
	        index = keys.indexOf(key);
	        return index >= 0 ? values[index] : opt_default;
	      }
	    }

	    function has___(key) {
	      var hiddenRecord = getHiddenRecord(key);
	      if (hiddenRecord) {
	        return id in hiddenRecord;
	      } else {
	        return keys.indexOf(key) >= 0;
	      }
	    }

	    function set___(key, value) {
	      var index;
	      var hiddenRecord = getHiddenRecord(key);
	      if (hiddenRecord) {
	        hiddenRecord[id] = value;
	      } else {
	        index = keys.indexOf(key);
	        if (index >= 0) {
	          values[index] = value;
	        } else {
	          // Since some browsers preemptively terminate slow turns but
	          // then continue computing with presumably corrupted heap
	          // state, we here defensively get keys.length first and then
	          // use it to update both the values and keys arrays, keeping
	          // them in sync.
	          index = keys.length;
	          values[index] = value;
	          // If we crash here, values will be one longer than keys.
	          keys[index] = key;
	        }
	      }
	      return this;
	    }

	    function delete___(key) {
	      var hiddenRecord = getHiddenRecord(key);
	      var index, lastIndex;
	      if (hiddenRecord) {
	        return id in hiddenRecord && delete hiddenRecord[id];
	      } else {
	        index = keys.indexOf(key);
	        if (index < 0) {
	          return false;
	        }
	        // Since some browsers preemptively terminate slow turns but
	        // then continue computing with potentially corrupted heap
	        // state, we here defensively get keys.length first and then use
	        // it to update both the keys and the values array, keeping
	        // them in sync. We update the two with an order of assignments,
	        // such that any prefix of these assignments will preserve the
	        // key/value correspondence, either before or after the delete.
	        // Note that this needs to work correctly when index === lastIndex.
	        lastIndex = keys.length - 1;
	        keys[index] = void 0;
	        // If we crash here, there's a void 0 in the keys array, but
	        // no operation will cause a "keys.indexOf(void 0)", since
	        // getHiddenRecord(void 0) will always throw an error first.
	        values[index] = values[lastIndex];
	        // If we crash here, values[index] cannot be found here,
	        // because keys[index] is void 0.
	        keys[index] = keys[lastIndex];
	        // If index === lastIndex and we crash here, then keys[index]
	        // is still void 0, since the aliasing killed the previous key.
	        keys.length = lastIndex;
	        // If we crash here, keys will be one shorter than values.
	        values.length = lastIndex;
	        return true;
	      }
	    }

	    return Object.create(OurWeakMap.prototype, {
	      get___:    { value: constFunc(get___) },
	      has___:    { value: constFunc(has___) },
	      set___:    { value: constFunc(set___) },
	      delete___: { value: constFunc(delete___) }
	    });
	  };

	  OurWeakMap.prototype = Object.create(Object.prototype, {
	    get: {
	      /**
	       * Return the value most recently associated with key, or
	       * opt_default if none.
	       */
	      value: function get(key, opt_default) {
	        return this.get___(key, opt_default);
	      },
	      writable: true,
	      configurable: true
	    },

	    has: {
	      /**
	       * Is there a value associated with key in this WeakMap?
	       */
	      value: function has(key) {
	        return this.has___(key);
	      },
	      writable: true,
	      configurable: true
	    },

	    set: {
	      /**
	       * Associate value with key in this WeakMap, overwriting any
	       * previous association if present.
	       */
	      value: function set(key, value) {
	        return this.set___(key, value);
	      },
	      writable: true,
	      configurable: true
	    },

	    'delete': {
	      /**
	       * Remove any association for key in this WeakMap, returning
	       * whether there was one.
	       *
	       * <p>Note that the boolean return here does not work like the
	       * {@code delete} operator. The {@code delete} operator returns
	       * whether the deletion succeeds at bringing about a state in
	       * which the deleted property is absent. The {@code delete}
	       * operator therefore returns true if the property was already
	       * absent, whereas this {@code delete} method returns false if
	       * the association was already absent.
	       */
	      value: function remove(key) {
	        return this.delete___(key);
	      },
	      writable: true,
	      configurable: true
	    }
	  });

	  if (typeof HostWeakMap === 'function') {
	    (function() {
	      // If we got here, then the platform has a WeakMap but we are concerned
	      // that it may refuse to store some key types. Therefore, make a map
	      // implementation which makes use of both as possible.

	      // In this mode we are always using double maps, so we are not proxy-safe.
	      // This combination does not occur in any known browser, but we had best
	      // be safe.
	      if (doubleWeakMapCheckSilentFailure && typeof Proxy !== 'undefined') {
	        Proxy = undefined;
	      }

	      function DoubleWeakMap() {
	        if (!(this instanceof OurWeakMap)) {  // approximate test for new ...()
	          calledAsFunctionWarning();
	        }

	        // Preferable, truly weak map.
	        var hmap = new HostWeakMap();

	        // Our hidden-property-based pseudo-weak-map. Lazily initialized in the
	        // 'set' implementation; thus we can avoid performing extra lookups if
	        // we know all entries actually stored are entered in 'hmap'.
	        var omap = undefined;

	        // Hidden-property maps are not compatible with proxies because proxies
	        // can observe the hidden name and either accidentally expose it or fail
	        // to allow the hidden property to be set. Therefore, we do not allow
	        // arbitrary WeakMaps to switch to using hidden properties, but only
	        // those which need the ability, and unprivileged code is not allowed
	        // to set the flag.
	        //
	        // (Except in doubleWeakMapCheckSilentFailure mode in which case we
	        // disable proxies.)
	        var enableSwitching = false;

	        function dget(key, opt_default) {
	          if (omap) {
	            return hmap.has(key) ? hmap.get(key)
	                : omap.get___(key, opt_default);
	          } else {
	            return hmap.get(key, opt_default);
	          }
	        }

	        function dhas(key) {
	          return hmap.has(key) || (omap ? omap.has___(key) : false);
	        }

	        var dset;
	        if (doubleWeakMapCheckSilentFailure) {
	          dset = function(key, value) {
	            hmap.set(key, value);
	            if (!hmap.has(key)) {
	              if (!omap) { omap = new OurWeakMap(); }
	              omap.set(key, value);
	            }
	            return this;
	          };
	        } else {
	          dset = function(key, value) {
	            if (enableSwitching) {
	              try {
	                hmap.set(key, value);
	              } catch (e) {
	                if (!omap) { omap = new OurWeakMap(); }
	                omap.set___(key, value);
	              }
	            } else {
	              hmap.set(key, value);
	            }
	            return this;
	          };
	        }

	        function ddelete(key) {
	          var result = !!hmap['delete'](key);
	          if (omap) { return omap.delete___(key) || result; }
	          return result;
	        }

	        return Object.create(OurWeakMap.prototype, {
	          get___:    { value: constFunc(dget) },
	          has___:    { value: constFunc(dhas) },
	          set___:    { value: constFunc(dset) },
	          delete___: { value: constFunc(ddelete) },
	          permitHostObjects___: { value: constFunc(function(token) {
	            if (token === weakMapPermitHostObjects) {
	              enableSwitching = true;
	            } else {
	              throw new Error('bogus call to permitHostObjects___');
	            }
	          })}
	        });
	      }
	      DoubleWeakMap.prototype = OurWeakMap.prototype;
	      module.exports = DoubleWeakMap;

	      // define .constructor to hide OurWeakMap ctor
	      Object.defineProperty(WeakMap.prototype, 'constructor', {
	        value: WeakMap,
	        enumerable: false,  // as default .constructor is
	        configurable: true,
	        writable: true
	      });
	    })();
	  } else {
	    // There is no host WeakMap, so we must use the emulation.

	    // Emulated WeakMaps are incompatible with native proxies (because proxies
	    // can observe the hidden name), so we must disable Proxy usage (in
	    // ArrayLike and Domado, currently).
	    if (typeof Proxy !== 'undefined') {
	      Proxy = undefined;
	    }

	    module.exports = OurWeakMap;
	  }
	})();


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
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
	*****************************************************************************/

	var inherits = __webpack_require__(4);
	var ClockBase = __webpack_require__(2);
	var measurePrecision = __webpack_require__(7);

	var WeakMap = __webpack_require__(5);
	var PRIVATE = new WeakMap();

	var DATENOW_PRECISION = measurePrecision(Date.now.bind(Date), 100) / 1000;

	/**
	 * @exports DateNowClock
	 * @class DateNowClock
	 * @extends ClockBase
	 *
	 * @classdesc
	 * Root clock based on <tt>Date.now()</tt>.
	 * It is a subclass of {@link ClockBase}.
	 *
	 * <p>This clock can be used as the root of a hierarchy of clocks. It uses
	 * <tt>Date.now()</tt> as its underlying system clock. However this clock can
	 * be set to have its own tick rate, independent of <tt>Date.now()</tt>.
	 *
	 * <p>The precision of Date.now() is meausred when the module containing this
	 * class is first imported. The dispersion reported by this clock will always
	 * equal the measurement precision.
	 *
	 * @constructor
	 * @override
	 * @param {object} [options] Options for this clock
	 * @param {Number} [options.tickRate] Initial tick rate for this clock (in ticks per second).
	 * @param {Number} [options.maxFreqErrorPpm] The maximum frequency error of the underlying clock (in ppm).
	 * @default tickRate: 1000, maxFreqErrorPpm: 50
	 *
	 * @example
	 * // milliseconds (default)
	 * root = new DateNowClock({tickRate: 1000000000 }); 
	 *
	 * // nanoseconds
	 * root = new DateNowClock({tickRate: 1000000000 });
	 *
	 * // nanoseconds, lower freq error than default
	 * root = new DateNowClock({tickRate: 1000000000, maxFreqErrorPpm: 10 }); 
	 *
	 * @abstract
	 */
	var DateNowClock = function(options) {
	    ClockBase.call(this);
	    
	    PRIVATE.set(this, {});
	    var priv = PRIVATE.get(this);

	    if (options && (typeof options.tickRate !== "undefined")) {
	        if (options.tickRate <= 0) {
	            throw "Cannot have tickrate of zero or less";
	        }
	        priv.freq = options.tickRate;
	    } else {
	        priv.freq = 1000;
	    }

	    if (options && (typeof options.maxFreqErrorPpm !== "undefined")) {
	        priv.maxFreqErrorPpm = options.maxFreqErrorPpm;
	    } else {
	        priv.maxFreqErrorPpm = 50;
	    }
	    
	    priv.precision = DATENOW_PRECISION;
	};

	inherits(DateNowClock, ClockBase);

	/**
	 * @inheritdoc
	 */
	DateNowClock.prototype.now = function() {
	    return Date.now() / 1000 * PRIVATE.get(this).freq;
	};

	/**
	 * @inheritdoc
	 */
	DateNowClock.prototype.getTickRate = function() {
	    return PRIVATE.get(this).freq;
	};

	/**
	 * @inheritdoc
	 */
	DateNowClock.prototype.calcWhen = function(t) {
	    return t / PRIVATE.get(this).freq * 1000;
	};

	/**
	 * @returns {String} A human readable summary of this clock object, including its [id]{@link DateNowClock#id} and its current properties
	 * @example
	 * > c=new DateNowClock();
	 * > c.toString()
	 * 'DateNowClock({tickRate:1000, maxFreqErrorPpm:50}) [clock_0]'
	 */
	DateNowClock.prototype.toString = function() {
	    var priv = PRIVATE.get(this);
	    return "DateNowClock({tickRate:"+priv.freq+", maxFreqErrorPpm:"+priv.maxFreqErrorPpm+"}) ["+this.id+"]";
	};

	/**
	 * @inheritdoc
	 */
	DateNowClock.prototype.toParentTime = function(t) {
	    throw "Clock has no parent.";
	};

	/**
	 * @inheritdoc
	 */
	DateNowClock.prototype.fromParentTime = function(t) {
	    throw "Clock has no parent.";
	};

	/**
	 * @inheritdoc
	 */
	DateNowClock.prototype.getParent = function() {
	    return null;
	};

	/**
	 * The parent of this clock is always <tt>null</tt> and cannot be changed.
	 * @throws because this clock cannot have a parent.
	 */
	DateNowClock.prototype.setParent = function(newParent) {
	    throw "Cannot set a parent for this clock.";
	};

	/**
	 * This clock is always available, and so its [availabilityFlag]{@link DateNowClock#availabilityFlag} cannot be changed.
	 * @throws because this clock cannot have its availabilty changed.
	 */
	DateNowClock.prototype.setAvailabilityFlag = function(availability) {
	    if (!availability) {
	        throw "Cannot change availability of this clock.";
	    }
	};

	/**
	 * @inheritdoc
	 */
	DateNowClock.prototype._errorAtTime = function(t) {
	    return PRIVATE.get(this).precision;
	};

	/**
	 * @inheritdoc
	 */
	DateNowClock.prototype.getRootMaxFreqError = function() {
	    return PRIVATE.get(this).maxFreqErrorPpm;
	};

	module.exports = DateNowClock;


/***/ }),
/* 7 */
/***/ (function(module, exports) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
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
	*****************************************************************************/

	var measurePrecision = function(timeFunc, sampleSize) {
	    var diffs = [];
	    while (diffs.length < sampleSize) {
	        var a = timeFunc();
	        var b = timeFunc();
	        if (a<b) {
	            diffs.push(b-a);
	        }
	    }
	    return Math.min.apply(this, diffs);
	};

	module.exports = measurePrecision;


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

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
	 *   by British Telecommunications (BT) PLC:
	 *     CorrelatedClock.prototype.calcWhen
	 *     CorrelatedClock.prototype.toParentTime
	 *     CorrelatedClock.prototype.setParent
	 *     CorrelatedClock.prototype.quantifySignedChange
	 *     CorrelatedClock.prototype.quantifyChange
	*****************************************************************************/



	var inherits = __webpack_require__(4);
	var ClockBase = __webpack_require__(2);
	var Correlation = __webpack_require__(9);

	var WeakMap = __webpack_require__(5);
	var PRIVATE = new WeakMap();


	/**
	 * @exports CorrelatedClock
	 * @class CorrelatedClock
	 * @extends ClockBase
	 *
	 * @classdesc
	 * Clock based on a parent clock using a {@link Correlation}.
	 * It is a subclass of {@link ClockBase}.
	 *
	 * <p>The correlation determines how the time of this clock is calculated from
	 * the time of the parent clock.
	 * The correlation represents a point where a given time of the parent equates
	 * to a given time of this clock (the child clock).
	 *
	 * <p>In effect, the combination of all these factors can be though of as defining
	 * a striaght line equation with the parent clock's time on the X-axis and this
	 * clock's time on the Y-axis. The line passes through the point of correlation
	 * and the slope is dictated by the tick rates of both clocks and the speed of
	 * this clock.
	 *
	 * Speed and tick rate are then taken into account to extrapolate from that
	 * point.
	 *
	 *
	 *
	 *
	 * @constructor
	 * @override
	 * @param {ClockBase} parent The parent for this clock.
	 * @param {object} [options] Options for this clock
	 * @param {Number} [options.tickRate] Initial tick rate for this clock (in ticks per second).
	 * @param {Number} [options.speed] The speed for this clock.
	 * @param {Correlation|object|Number[]} [options.correlation] Correlation for this clock as either as a Correlation object, or as an object with properties corresponding to the properties of a correlation, or as an array of values. See examples below
	 * @default tickRate: 1000, speed: 1.0, correlation: Correlation(0,0,0,0)
	 *
	 * @example
	 * root = new DateNowClock();
	 *
	 * // tickRate = 1000, correlation = (0,0)
	 * c1 = new CorrelatedClock(root);
	 *
	 * // tickRate = 25, speed=2.0, correlation = (0,0)
	 * c1 = new CorrelatedClock(root, {tickRate:25, speed:2.0});
	 *
	 * // tickRate = 1000, correlation = (10,500)
	 * c2 = new CorrelatedClock(root, { correlation: new Correlation(10,500) });
	 * c2 = new CorrelatedClock(root, { correlation: [10,500] });
	 * c2 = new CorrelatedClock(root, { correlation: {parentTime:10,childTime:500} });
	 */
	var CorrelatedClock = function(parent, options) {
	    ClockBase.call(this);

	    PRIVATE.set(this, {});
	    var priv = PRIVATE.get(this);

	    if (options && (typeof options.tickRate !== "undefined")) {
	        if (options.tickRate <= 0) {
	            throw "Cannot have tickrate of zero or less";
	        }
	        priv.freq = options.tickRate;
	    } else {
	        priv.freq = 1000;
	    }

	    if (options && (typeof options.speed !== "undefined")) {
	        priv.speed = options.speed;
	    } else {
	        priv.speed = 1.0;
	    }

	    priv.parent = parent;

	    if (options && (typeof options.correlation !== "undefined")) {
	        priv.corr = new Correlation(options.correlation);
	    } else {
	        priv.corr = new Correlation(0,0,0,0);
	    }

	    priv.parentHandlers = {
	        "change" : function(causeClock) {
	            this.emit("change", this);
	        }.bind(this),
	        "available" : this.notifyAvailabilityChange.bind(this),
	        "unavailable" : this.notifyAvailabilityChange.bind(this),
	    };

	    priv.parent = null;
	    this.setParent(parent);
	};

	inherits(CorrelatedClock, ClockBase);

	/**
	 * @inheritdoc
	 */
	CorrelatedClock.prototype.now = function() {
	    var priv = PRIVATE.get(this);
	    var corr = priv.corr;
	    
	    if (priv.parent === null || priv.parent === undefined) {
	        return NaN
	    }

	    return corr.childTime + (priv.parent.now() - corr.parentTime) * priv.freq * priv.speed / priv.parent.getTickRate();
	};

	/**
	 * @returns {String} A human readable summary of this clock object, including its [id]{@link CorrelatedClock#id} and its current properties
	 * @example
	 * > c=new CorrelatedClock(parent);
	 * > c.toString()
	 * 'CorrelatedClock(clock_0, {tickRate:1000, speed:1, correlation:[object Object]}) [clock_1]'
	 */
	CorrelatedClock.prototype.toString = function() {
	    var priv = PRIVATE.get(this);
	    var p;
	    if (priv.parent) {
	        p = priv.parent.id;
	    } else {
	        p = "<<no-parent>>";
	    }
	    return "CorrelatedClock("+p+", {tickRate:"+priv.freq+", speed:"+priv.speed+", correlation:"+priv.corr+"}) ["+this.id+"]";
	};

	/**
	 * @inheritdoc
	 */
	CorrelatedClock.prototype.getSpeed = function() {
	    return PRIVATE.get(this).speed;
	};

	/**
	 * @inheritdoc
	 */
	CorrelatedClock.prototype.setSpeed = function(newSpeed) {
	    var priv = PRIVATE.get(this);
	    if (priv.speed != newSpeed) {
	        priv.speed = newSpeed;
	        this.emit("change", this);
	    }
	};

	/**
	 * @inheritdoc
	 */
	CorrelatedClock.prototype.getTickRate = function() {
	    return PRIVATE.get(this).freq;
	};

	/**
	 * @inheritdoc
	 */
	CorrelatedClock.prototype.setTickRate = function(newTickRate) {
	    var priv = PRIVATE.get(this);

	    if (priv.freq != newTickRate) {
	        priv.freq = newTickRate;
	        this.emit("change", this);
	    }
	};

	CorrelatedClock.prototype.rebaseCorrelationAt = function(t) {
	    var priv = PRIVATE.get(this);

	    priv.corr = priv.corr.butWith({
	        parentTime: this.toParentTime(t),
	        childTime: t,
	        initialError: this._errorAtTime(t)
	    });
	};

	/**
	 * @var {Correlation} correlation The correlation used by this clock to define its relationship to its parent.
	 *
	 * <p>Read this property to obtain the correlation currently being used.
	 *
	 * <p>Change the correlation by setting this property to a new one. Either assign a {@link Correlation} object, or an object containing
	 * keys representing the properties of the correlation, or an Array containing the values for the correlation.
	 *
	 * <p>The underlying implementation fo this property uses the
	 * [getCorrelation]{@link ClockBase#getCorrelation} and
	 * [setCorrelation]{@link ClockBase#setCorrelation} methods.
	 *
	 * @memberof CorrelatedClock
	 * @instance
	 *
	 * @example
	 * clock = new CorrelatedClock(parentClock);
	 * clock.correlation = new Correlation(1,2);
	 * clock.correlation = [1,2];
	 * clock.correlation = { parentTime:1, childTime:2 };
	 * clock.correlation = clock.correlation.butWith({initialError:0.5, errorGrowthRate:0.1});
	 */
	Object.defineProperty(CorrelatedClock.prototype, "correlation", {
	    get: function()  { return this.getCorrelation(); },
	    set: function(v) { return this.setCorrelation(v); }
	});

	/**
	 * Retrieve the correlation for this clock.
	 * @returns {Correlation} correlation The correlation for this clock
	 */
	CorrelatedClock.prototype.getCorrelation = function() {
	    return PRIVATE.get(this).corr;
	};

	/**
	 * Set/change the correlation for this clock.
	 * @param {Correlation} newCorrelation The new correlation for this clock
	 */
	CorrelatedClock.prototype.setCorrelation = function(newCorrelation) {
	    PRIVATE.get(this).corr = new Correlation(newCorrelation);
	    this.emit("change", this);
	};

	/**
	 * Set/change the correlation and speed for this clock as a single operation.
	 *
	 * <p>Using this method instead of setting both separately only generates a single
	 * "change" event notification.
	 *
	 * @param {Correlation} newCorrelation The new correlation for this clock
	 * @param {Number} newSpeed The new speed for this clock
	 */
	CorrelatedClock.prototype.setCorrelationAndSpeed = function(newCorrelation, newSpeed) {
	    var priv = PRIVATE.get(this);

	    priv.corr = new Correlation(newCorrelation);
	    priv.speed = newSpeed;
	    this.emit("change",this);
	};

	/**
	 * @inheritdoc
	 */
	CorrelatedClock.prototype.calcWhen = function(t) {
	    var priv = PRIVATE.get(this);

	    return priv.parent.calcWhen(this.toParentTime(t));
	};

	/**
	 * Convert time value of this clock to the equivalent time of its parent.
	 *
	 * <p>If this clock's speed is zero (meaning that it is paused) then if <tt>t</tt>
	 * does not equal the current time of this clock, then <tt>NaN</tt> will be returned.
	 * This is because there is no equivalent time of the parent clock.
	 *
	 * @param {Number} t Time value of this clock
	 * @returns {Number} corresponding time of the parent clock or <tt>NaN</tt> if not possible when clock speed is zero.
	 * @abstract
	 */
	CorrelatedClock.prototype.toParentTime = function(t) {
	    var priv = PRIVATE.get(this);

	    if (priv.parent === null || priv.parent === undefined) {
	        return NaN;
	    } else if (priv.speed === 0) {
	        return (t === priv.corr.childTime) ? priv.corr.parentTime : NaN;
	    } else {
	        return priv.corr.parentTime + (t - priv.corr.childTime) * priv.parent.getTickRate() / priv.freq / priv.speed;
	    }
	};

	/**
	 * @inheritdoc
	 */
	ClockBase.prototype.fromParentTime = function(t) {
	    var priv = PRIVATE.get(this);
	    if (priv.parent === null || priv.parent === undefined) {
	        return NaN;
	    } else {
	        return priv.corr.childTime + (t - priv.corr.parentTime) * priv.freq * priv.speed / priv.parent.getTickRate();
	    }
	};

	/**
	 * @inheritdoc
	 */
	CorrelatedClock.prototype.getParent = function() {
	    return PRIVATE.get(this).parent;
	};

	/**
	 * @inheritdoc
	 */
	CorrelatedClock.prototype.setParent = function(newParent) {
	    var priv = PRIVATE.get(this);
	    var event;

	    if (priv.parent != newParent) {
	        if (priv.parent) {
	            for(event in priv.parentHandlers) {
	                priv.parent.removeListener(event, priv.parentHandlers[event]);
	            }
	        }

	        priv.parent = newParent;

	        if (priv.parent) {
	            for(event in priv.parentHandlers) {
	                priv.parent.on(event, priv.parentHandlers[event]);
	            }
	        }

	        this.emit("change", this);
	    }
	};

	/**
	 * Calculate the potential for difference in tick values of this clock if a
	 * different correlation and speed were to be used.
	 *
	 * Changes where the new time would become greater return positive values.
	 *
	 * <p>If the new speed is different, even slightly, then this means that the
	 * ticks reported by this clock will eventually differ by infinity,
	 * and so the returned value will equal ±infinity. If the speed is unchanged
	 * then the returned value reflects the difference between old and new correlations.
	 *
	 * @param {Correlation} newCorrelation A new correlation
	 * @param {Number} newSpeed A new speed
	 * @returns {Number} The potential difference in units of seconds. If speeds
	 * differ, this will always be <tt>Number.POSITIVE_INFINITY</tt> or <tt>Number.NEGATIVE_INFINITY</tt>
	 */
	CorrelatedClock.prototype.quantifySignedChange = function(newCorrelation, newSpeed) {
	    var priv = PRIVATE.get(this);
	    newCorrelation = new Correlation(newCorrelation);

	    if (newSpeed != priv.speed) {
	        return (newSpeed > priv.speed) ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	    } else {
	        var nx = newCorrelation.parentTime;
	        var nt = newCorrelation.childTime;
	        if (newSpeed !== 0) {
	            var ox = this.toParentTime(nt);
	            return (nx-ox) / priv.parent.getTickRate();
	        } else {
	            var ot = this.fromParentTime(nx);
	            return (nt-ot) / priv.freq;
	        }
	    }
	};

	/**
	 * Calculate the absolute value of the potential for difference in tick values of this
	 * clock if a different correlation and speed were to be used.
	 *
	 * <p>If the new speed is different, even slightly, then this means that the
	 * ticks reported by this clock will eventually differ by infinity,
	 * and so the returned value will equal +infinity. If the speed is unchanged
	 * then the returned value reflects the difference between old and new correlations.
	 *
	 * @param {Correlation} newCorrelation A new correlation
	 * @param {Number} newSpeed A new speed
	 * @returns {Number} The potential difference in units of seconds. If speeds
	 * differ, this will always be <tt>Number.POSITIVE_INFINITY</tt>
	 */
	CorrelatedClock.prototype.quantifyChange = function(newCorrelation, newSpeed) {
	    return Math.abs(this.quantifySignedChange(newCorrelation, newSpeed));
	};

	/**
	 * Returns True if the potential for difference in tick values of this clock
	 * (using a new correlation and speed) exceeds a specified threshold.
	 *
	 * <p>This is implemented by applying a threshold to the output of
	 * [quantifyChange()]{@link CorrelatedClock#quantifyChange}.
	 *
	 * @param {Correlation} newCorrelation A new correlation
	 * @param {Number} newSpeed A new speed
	 * @returns {Boolean} True if the potential difference can/will eventually exceed the threshold.
	 */
	CorrelatedClock.prototype.isChangeSignificant = function(newCorrelation, newSpeed, thresholdSecs) {
	    var delta = this.quantifyChange(newCorrelation, newSpeed);
	    return delta > thresholdSecs;
	};

	/**
	 * @inheritdoc
	 */
	CorrelatedClock.prototype._errorAtTime = function(t) {
	    var priv = PRIVATE.get(this);

	    var pt = this.toParentTime(t);
	    var deltaSecs = Math.abs(pt - priv.corr.parentTime) / priv.parent.getTickRate();
	    return priv.corr.initialError + deltaSecs * priv.corr.errorGrowthRate;
	};

	module.exports = CorrelatedClock;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
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
	*****************************************************************************/

	var WeakMap = __webpack_require__(5);
	var PRIVATE = new WeakMap();


	/**
	 * @exports Correlation
	 * @class Correlation
	 *
	 * @classdesc
	 * This is an immutable object representing a correlation.
	 * It also can represent associated error/uncertaint information.
	 *
	 * <p>The point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}) represents a relationship between
	 * a parent clock and a child clock - by saying that the parent clock
	 * is at point [parentTime]{@link Correlation#parentTime} when the child clock is at point [childTime]{@link Correlation#childTime}.
	 *
	 * <p>Error information is represented as an [initialError]{@link Correlation#initialError} amount and a
	 * [errorGrowthRate]{@link Correlation#errorGrowthRate}. The initial amount of error represents the amount
	 * of uncertainty at the point of the correlation; and the growth rate represents
	 * how much uncertainty increases by as you move further away from the point
	 * of correlation. Both are in units of seconds, and seconds per second, of
	 * the child clock. By default these are set to zero, so there is assumed to
	 * be no error.
	 *
	 * <p>The properties of the correlation can be read:
	 * <pre class="prettyprint"><code>
	 * corr = new Correlation(10, 20, 0.5, 0.1);
	 * p = corr.parentTime;
	 * t = corr.childTime;
	 * i = corr.initialError;
	 * g = corr.errorGrowthRate;
	 * </code></pre>
	 *
	 * <p>However the object is immutable. The properties cannot be set. Instead use
	 * the butWith() method to create a new correlation "but with" some properties
	 * changed:
	 * <pre class="prettyprint"><code>
	 * corr = new Correlation(10, 20, 0.5, 0.1);
	 * corr2= corr.butWith({parentTime: 11, childTime:19})
	 * </code></pre>
	 *
	 * @constructor
	 * @param {Number|object|Number[]} parentTimeOrObject - The parent time, or the whole correlation expressed as an object, or an array with the arguments in this order.
	 * @param {Number} [parentTimeOrObject.parentTime] The parent time
	 * @param {Number} [parentTimeOrObject.childTime] The child time.
	 * @param {Number} [parentTimeOrObject.initialError] The initial error (in seconds)
	 * @param {Number} [parentTimeOrObject.errorGrowthRate] The error growth rate (in seconds per second.)
	 * @param {Number} [childTime] The child time.
	 * @param {Number} [initialError] The initial error (in seconds)
	 * @param {Number} [errorGrowthRate] The error growth rate (in seconds per second.)
	 *
	 * @example
	 * // parentTime = 10, childTime=20, initialError=0, errorGrowthRate=0
	 * c = new Correlation(10, 20);
	 * @example
	 * // parentTime = 10, childTime=20, initialError=0.5, errorGrowthRate=0.1
	 * c = new Correlation(10, 20, 0.5, 0.1);
	 * @example
	 * // parentTime = 10, childTime=20, initialError=0.5, errorGrowthRate=0.1
	 * c = new Correlation([10, 20, 0.5, 0.1])
	 * @example
	 * // parentTime = 10, childTime=20, initialError=0.5, errorGrowthRate=0.1
	 * c = new Correlation({parentTime:10, childTime:20, initialError:0.5, errorGrowthRate:0.1])
	 */
	var Correlation = function(parentTimeOrObject, childTime, initialError, errorGrowthRate) {
	    PRIVATE.set(this, {});

	    var priv = PRIVATE.get(this);

	    var parentTime;

	    if (Array.isArray(parentTimeOrObject)) {
	        parentTime = parentTimeOrObject[0];
	        childTime = parentTimeOrObject[1];
	        initialError = parentTimeOrObject[2];
	        errorGrowthRate = parentTimeOrObject[3];
	    } else if (typeof parentTimeOrObject === "object") {
	        parentTime = parentTimeOrObject.parentTime;
	        childTime = parentTimeOrObject.childTime;
	        initialError = parentTimeOrObject.initialError;
	        errorGrowthRate = parentTimeOrObject.errorGrowthRate;
	    } else {
	        parentTime = parentTimeOrObject;
	    }

	    priv.parentTime = (typeof parentTime !== "undefined") ? parentTime : 0;
	    priv.childTime  = (typeof childTime !== "undefined")  ? childTime  : 0;

	    priv.initialError    = (typeof initialError !== "undefined")    ? initialError    : 0;
	    priv.errorGrowthRate = (typeof errorGrowthRate !== "undefined") ? errorGrowthRate : 0;
	};

	/**
	 * Build a new correlation object, but with the properties changed listed as
	 * named properties of the object passed.
	 *
	 * @param {object} changes An object where the property names and values represent the properties of the correlation to be changed.
	 * @param {Number} [changes.parentTime] The parent time
	 * @param {Number} [changes.childTime] The child time.
	 * @param {Number} [changes.initialError] The initial error (in seconds)
	 * @param {Number} [changes.errorGrowthRate] The error growth rate (in seconds per second.)
	 *
	 * @returns {Correlation} new Correlation object that is the same as this one, but with the specified changes.
	 *
	 * @example
	 * var corr = new Correlation(1,2);
	 * var corr2 = corr.butWith({parentTime:5});
	 * console.log(corr.parentTime, corr.childTime); // 5 2
	 */
	Correlation.prototype.butWith = function(changes) {
	    var priv = PRIVATE.get(this);

	    if (typeof changes === "undefined") {
	        return this;
	    } else {
	        var p = changes.parentTime;
	        var c = changes.childTime;
	        var i = changes.initialError;
	        var g = changes.errorGrowthRate;

	        if (typeof p === "undefined") { p = priv.parentTime; }
	        if (typeof c === "undefined") { c = priv.childTime; }
	        if (typeof i === "undefined") { i = priv.initialError; }
	        if (typeof g === "undefined") { g = priv.errorGrowthRate; }

	        return new Correlation(p,c,i,g);
	    }
	};

	/**
	 * @var {Number} parentTime Parent Time. Along with the [childTime]{@link Correlation#childTime} it defines the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
	 * @memberof Correlation
	 * @instance
	 */

	Object.defineProperty(Correlation.prototype, "parentTime", {
	    get: function()  { return PRIVATE.get(this).parentTime; },
	    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
	});

	/**
	 * @var {Number} childTime Child Time. Along with the [parentTime]{@link Correlation#parentTime} it defines the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
	 * @memberof Correlation
	 * @instance
	 */

	Object.defineProperty(Correlation.prototype, "childTime", {
	    get: function()  { return PRIVATE.get(this).childTime; },
	    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
	});

	/**
	 * @var {Number} initialError The intial amount of error/uncertainly (in seconds) at the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
	 * @memberof Correlation
	 * @instance
	 */

	Object.defineProperty(Correlation.prototype, "initialError", {
	    get: function()  { return PRIVATE.get(this).initialError; },
	    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
	});

	/**
	 * @var {Number} errorGrowthRate The amonut by which error/uncertainly will grown (in seconds) for every second of child clock time away from the point of correlation ([parentTime]{@link Correlation#parentTime}, [childTime]{@link Correlation#childTime}). Read only.
	 * @memberof Correlation
	 * @instance
	 */

	Object.defineProperty(Correlation.prototype, "errorGrowthRate", {
	    get: function()  { return PRIVATE.get(this).errorGrowthRate; },
	    set: function(v) { throw "Cannot set this property, object is immutable. Use butWith() method."; }
	});

	/**
	 * Compare this correlation with another to check if they are the same.
	 * @param {Correlation} obj - another correlation to compare with.
	 * @returns {boolean} True if this correlation represents the same correlation and error/uncertainty as the one provided.
	 */
	Correlation.prototype.equals = function(obj) {
	    var priv = PRIVATE.get(this);
	    return priv.parentTime === obj.parentTime &&
	        priv.childTime === obj.childTime &&
	        priv.initialError === obj.initialError &&
	        priv.errorGrowthRate === obj.errorGrowthRate;
	};

	Correlation.prototype.toJSON = function() {
	  var priv = PRIVATE.get(this);

	  return JSON.stringify(
	    {
	      parentTime : priv.parentTime,
	      childTime : priv.childTime,
	      initialError : priv.initialError,
	      errorGrowthRate : priv.errorGrowthRate
	    }
	  );
	};


	module.exports = Correlation;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	/****************************************************************************
	 * Copyright 2017 British Broadcasting Corporation
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
	*****************************************************************************/
	 
	var inherits = __webpack_require__(4);
	var ClockBase = __webpack_require__(2);

	var WeakMap = __webpack_require__(5);
	var PRIVATE = new WeakMap();


	/**
	 * @exports OffsetClock
	 * @class OffsetClock
	 * @extends ClockBase
	 *
	 * @classdesc
	 * A clock that applies an offset such that reading it is the same as
	 * reading its parent, but as if the current time is slightly offset by an
	 * amount ahead (+ve offset) or behind (-ve offset). 
	 * It is a subclass of {@link ClockBase}.
	 * 
	 * <p><tt>OffsetClock</tt> inherits the tick rate of its parent. Its speed is
	 * always 1. It takes the effective speed into account when applying the offset,
	 * so it should always represent the same amount of time according to the root
	 * clock. In practice this means it will be a constant offset amount of real-world
	 * time.
	 * 
	 * <p>This can be used to compensate for rendering delays. If it takes N seconds
	 * to render some content and display it, then a positive offset of N seconds
	 * will mean that the rendering code thinks time is N seconds ahead of where
	 * it is. It will then render the correct content that is needed to be displayed
	 * in N seconds time.
	 * 
	 * <p>For example: A correlated clock (the "media clock") represents the time
	 * position a video player needs to currently be at.
	 * 
	 * <p>The video player has a 40 milisecond (0.040 second) delay between when it renders a frame and the light being emitted by the display. We therefore need the
	 * video player to render 40 milliseconds in advance of when the frame is
	 * to be displayed. An :class:`OffsetClock` is used to offset time in this
	 * way and is passed to the video player:
	 * 
	 * <pre class="prettyprint"><code>
	 * mediaClock = new CorrelatedClock(...);
	 *     
	 * PLAYER_DELAY_SECS = 40;
	 * oClock = new OffsetClock(mediaClock, {offset:PLAYER_DELAY_SECS});
	 *     
	 * videoPlayer.syncToClock(oClock);
	 * </code></pre>
	 *     
	 * <p>If needed, the offset can be altered at runtime, by setting the :data:`offset`
	 * property. For example, perhaps it needs to be changed to a 50 millisecond offset:
	 * 
	 * <pre class="prettyprint"><code>
	 * oClock.offset = 50;
	 * </code></pre>
	 * 
	 * <p>Both positive and negative offsets can be used. 
	 */
	var OffsetClock = function(parent, options) {
	    ClockBase.call(this);
	    
	    PRIVATE.set(this, {});
	    var priv = PRIVATE.get(this);

	    if (options && (typeof options.offset !== "undefined")) {
	        if (typeof options.offset === "number") {
	            priv.offset = options.offset;
	        } else {
	            throw "'offset' option must be a number (in milliseconds)";
	        }
	    } else {
	        priv.offset = 0;
	    }
	    
	    priv.parent = parent;
	    
	    priv.parentHandlers = {
	        "change" : function(causeClock) {
	            this.emit("change", this);
	        }.bind(this),
	        "available" : this.notifyAvailabilityChange.bind(this),
	        "unavailable" : this.notifyAvailabilityChange.bind(this),
	    };

	    priv.parent = null;
	    this.setParent(parent);    
	};

	inherits(OffsetClock, ClockBase);

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.now = function() {
	    var priv = PRIVATE.get(this);
	    
	    return priv.parent.now() + priv.offset * this.getEffectiveSpeed() * priv.parent.tickRate / 1000;
	};

	/**
	 * @returns {String} A human readable summary of this clock object, including its current properties
	 * @example
	 * > c=new Offset(parent, {offset:20});
	 * > c.toString()
	 * 'OffsetClock(clock_0, {offset:20}) [clock_1]'
	 */
	OffsetClock.prototype.toString = function() {
	    var priv = PRIVATE.get(this);
	    var p;
	    if (priv.parent) {
	        p = priv.parent.id;
	    } else {
	        p = "<<no-parent>>";
	    }
	    return "OffsetClock("+p+", {offset:"+priv.offset+"}) ["+this.id+"]";
	};

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.getSpeed = function() {
	    return 1;
	};

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.setSpeed = function(newSpeed) {
	    throw "Cannot change the speed of this clock.";
	};

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.getTickRate = function() {
	    return PRIVATE.get(this).parent.tickRate;
	};

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.setTickRate = function(newTickRate) {
	    throw "Cannot change the tick rate of this clock.";
	};

	/**
	 * @var {Number} offset The amount by which this clock should be in advance, in milliseconds in terms of elapsed root clock time.
	 *
	 * <p>The underlying implementation of this property uses the
	 * [getOffset]{@link OffsetClock#getOffset} and
	 * [setOffset]{@link OffsetClock#setOffset} methods.
	 * @default 1.0
	 * @memberof OffsetClock
	 * @instance
	 * @fires change
	 */
	Object.defineProperty(OffsetClock.prototype, "offset", {
	    get: function() { return this.getOffset(); },
	    set: function(millis) { return this.setOffset(millis); },
	});

	/**
	 * Read the number of milliseconds by which this clock is ahead (the offset).
	 *
	 * The offset is in terms of elapsed root clock time, not elapsed time of
	 * the parent.
	 *
	 * @return {Number} The number of milliseconds by which this clock is ahead.
	 */
	OffsetClock.prototype.getOffset = function() {
	    return PRIVATE.get(this).offset;
	};

	/**
	 * Change the number of milliseconds by which this clock is ahead (the offset)
	 *
	 * The offset is in terms of elapsed root clock time, not elapsed time of
	 * the parent.
	 *
	 * @param {Number} millis The number of milliseconds by which this clock is ahead.
	 */
	OffsetClock.prototype.setOffset = function(millis) {
	    var priv = PRIVATE.get(this);
	    var changed = millis != priv.offset;
	    priv.offset = millis;
	    if (changed) {
	        this.emit("change", this);
	    }
	};

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.calcWhen = function(t) {
	    var priv = PRIVATE.get(this);
	    
	    var tt = t + priv.offset * this.getEffectiveSpeed() * priv.parent.tickRate / 1000;
	    return priv.parent.calcWhen(this.toParentTime(tt));
	};

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.getParent = function() {
	    return PRIVATE.get(this).parent;
	};

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.setParent = function(newParent) {
	    var priv = PRIVATE.get(this);
	    var event;
	    
	    if (priv.parent != newParent) {
	        if (priv.parent) {
	            for(event in priv.parentHandlers) {
	                priv.parent.removeListener(event, priv.parentHandlers[event]);
	            }
	        }

	        priv.parent = newParent;

	        if (priv.parent) {
	            for(event in priv.parentHandlers) {
	                priv.parent.on(event, priv.parentHandlers[event]);
	            }
	        }
	        
	        this.emit("change", this);
	    }
	};

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.toParentTime = function(t) {
	    var priv = PRIVATE.get(this);
	    return t - priv.offset * this.getEffectiveSpeed() * this.tickRate / 1000;
	};

	/**
	 * @inheritdoc
	 */
	OffsetClock.prototype.fromParentTime = function(t) {
	    var priv = PRIVATE.get(this);
	    return t + priv.offset * this.getEffectiveSpeed() * this.tickRate / 1000;
	};

	module.exports = OffsetClock;


/***/ })
/******/ ])
});
;