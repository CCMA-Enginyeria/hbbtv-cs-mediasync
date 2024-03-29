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

/**
 * @memberof dvbcss-protocols.WallClock
 * @description
 * Factory function that creates a Wall Clock client.
 *
 * @param {Socket} socket Socket object representing the connection
 * @param {Adaptor} AdaptorClass Adaptor class for the socket object
 * @param {Serialiser} serialiser Message seraliser
 * @param {CorrelatedClock} wallClock
 * @param {Object} clientOptions
 * @returns {WebSocketAdaptor} The WebSocket adaptor wrapping the whole client
 */


var createClientWC = function(socket,wallClock,options){
	socket.bind(options.dest.port, function(error, obj) {
		return new UdpAdaptor(
			new WallClockClientProtocol(
		        wallClock,
		        options
	        ),
	    	socket);
	});
};