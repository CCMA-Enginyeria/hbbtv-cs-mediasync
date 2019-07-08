/*******************************************************************************
 *
 * Copyright (c) 2015 Fraunhofer FOKUS, All rights reserved.
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3.0 of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library. If not, see <http://www.gnu.org/licenses/>.
 *
 * AUTHORS: Louay Bassbouss (louay.bassbouss@fokus.fraunhofer.de)
 *
 ******************************************************************************/

var clocks = window["dvbcss-clocks"];
var Protocols = window["dvbcss-protocols"];
var terminalManager;
var terminals = [];
var jsonCII;
var first = true;
var tickRateTV;
var confJson;
var player;



var log = function (msg) {
    console.log(msg);
    var logElem = $("#log");
    logElem.val(logElem.val()+msg+"\n");
    logElem.scrollTop(logElem[0].scrollHeight);
};

window._infoObject = {};
var printInfo = function(key, value) {
    window._infoObject[key] = value;
    var content = '';
    Object.keys(window._infoObject).forEach(function(key) {
        content += '<tr><td>' + key + '</td><td>' + window._infoObject[key] + '</td></tr>';
    });
    $('.info-fields tbody').html(content);
}

$(document).on('click', '.edit-tick-rate', function (e) {
    var value = prompt("Tick rate?", window._timelineClock.tickRate);
    value = parseInt(value, 10);
    if(value && !isNaN(value)) {
        window._timelineClock.setTickRate(value);
    }
});

var discoverTerminals = function () {
    terminalManager.discoverTerminals(function (discoveredTerminals) {
        terminals = discoveredTerminals;
        $("#discoverTerminalsBtn").attr("disabled", false);
        $("#terminals").empty();
        $(terminals).each(function (i,terminal) {
            //Channel random
            var channel = Math.random().toString(36).substring(2);
            $("#terminals").append("<li id='"+i+"'>"+terminal.friendly_name+"  <button class='launch' data-index='"+i+"' data-channel='"+channel+"'>Launch</button>  <button class='connect' data-index='"+i+"' data-channel='"+channel+"'>Connect</button> <div class='log'></div></li>");
        });
        if(terminals.length==0){
            $("#terminals").html("No HbbTV terminals found. Click on the discover button to search again!");
        }
        else{
            $("button.launch").click(function () {
                var index = $(this).attr("data-index");
                var channel = $(this).attr("data-channel");
                launchHbbTVApp(index,channel);
            });
            $("button.connect").click(function () {
                var index = $(this).attr("data-index");
                var channel = $(this).attr("data-channel");
                connect(index,channel);
            });
        }
        log(terminals.length+" HbbTV terminals found");
    });
};

var launchHbbTVApp = function (index,channel) {
    var terminal = terminals[index];
    var appLocation = "?channel=" + channel + '#conf-file=' + window.confUrl
    log('appLocation: ' + appLocation);
    var options = {
        "appUrlBase": window.HBBTV_LOCATION_URL,
        "appLocation": appLocation
    };

    if(confJson.orgId) {
        options.orgId = confJson.orgId;
        options.appId = confJson.appId;
    }

    printInfo("launchOptions", JSON.stringify(options));

    terminal && terminalManager.launchHbbTVApp(terminal.enum_id, options, function (res) {
        log("launch app: enum_id="+ terminal.enum_id);
    });
};

var connect = function (index,channel) {
    var terminal = terminals[index];
    var app2appRemoteBaseUrl = terminal && terminal.X_HbbTV_App2AppURL || app2appURL;
    //Sense channel podrem conectarnos amb la app ja arrencada
    var ws = new WebSocket(app2appRemoteBaseUrl/* + channel*/);
    
    ws.binaryType = "arraybuffer";
    ws.onopen = function(evt) {
        log("Connection waiting ...");
    };
    ws.onclose = function(evt) {
        log("Connection closed.");
    };
    ws.onerror = function (evt) {
        log("Connection error.");
    };
    ws.onmessage = function(evt) {
        console.log(evt.data);
        if (evt.data == "pairingcompleted") {
            log("connection paired");
            ws.onmessage = function(evt) {
                log( "Received Message: " + evt.data);

                //CSS-CII URL
                var url_css_cii = evt.data; //receiving CSS-CII URL
                connect_cii(url_css_cii); //connecting to CSS-CII

            };
            var msg = "Hello from Companion Screen";
            ws.send(msg);
            if(typeof Int8Array != "undefined"){
                var array = [0,1,2,3,4,5,6,7,8,9];
                var binary = new Int8Array(array).buffer;
                ws.send(binary);
            }
        } else {
            log("Unexpected message received from terminal.");
            ws.close();
        }
    };
};

//CSS_CII Protocol
var connect_cii = function (url_css_cii){
    //log("Connecting to "+url_css_cii);
    var ws = new WebSocket(url_css_cii);
    ws.onopen = function(evt) {
        log("Connecting to CSS-CII protocol");
    };
    ws.onclose = function(evt) {
        log("Connection CSS-CII closed.");
    };
    ws.onerror = function (evt) {
        log(evt);
        log(JSON.stringify(evt));
        log("Connection CSS-CII error.");
    };
    ws.onmessage = function(evt) {
        //log(evt.data);

        //JSON CII received
        jsonCII = JSON.parse(evt.data);
        log(jsonCII);

        printInfo('jsonCII', JSON.stringify(jsonCII));

        //TickRate TV 
        //tickRateTV = jsonCII.timelines[0].timelineProperties.unitsPerSecond;
        if(confJson.broadcast){
            tickRateTV = 1000;    
        }else {
            tickRateTV = 25;
        }
        
        log("MRS URL:   " + jsonCII.mrsUrl);  //Sempre NULL no implementat encara

        //Iniciem la sincronització
        if(first){
            initSynchronization();
            first = false;
        }
    }
}

//Iniciar sincronització dels protocols
var initSynchronization = function(){
    log("Connecting endpoints...");

    //Creació clocks per sincronització
    var root = new clocks.DateNowClock();  //Rellotge global
    /*var wallClock = new clocks.CorrelatedClock(root, {
        tickRate:25
    }); 
    ************* NO FUNCIONA SI NO ES EL TICK RATE PREDETERMINAT *************
    */
    var wallClock = new clocks.CorrelatedClock(root);  //Clock que es sincronitzarà amb el de la TV
    printInfo('tickRate', tickRateTV);
    var timelineClock = new clocks.CorrelatedClock(wallClock, { //Clock per sincronitzar el video (tickRate ha de ser igual que el de la TV)
        tickRate:tickRateTV
    })

    //Conectem protocol CSS-WC i CSS-TS
    connect_wc(wallClock);
    connect_ts(timelineClock);

    //Iniciem la sincronització del video
    videoSynchronization(timelineClock);
}

var connect_wc = function (wallClock){

    //Creació UDP socket i els seus parametres
    var datagram = cordova.require("cat.ccma.wallClock.UDPWallClock");
    var aux = jsonCII.wcUrl.split("/");
    var ip_port_wc = aux[2].split(":");
    var ip_wc = ip_port_wc[0];
    var port_wc = ip_port_wc[1];
    var protocolOptions = {
        "dest": {
            "port": parseInt(port_wc),
            "ip": ip_wc
        }
    };

    var udpSocket = datagram.createSocket("udp4");

    //Iniciem UDPSocket
    var wcClient = createClientWC(udpSocket, wallClock, protocolOptions);

    log("WC connected!");
}

var connect_ts = function (timelineClock){

    //Creem WebSocket per conectar CSS-TS
    var createClient = Protocols.TimelineSynchronisation.createTSClient;

    var ws = new WebSocket(jsonCII.tsUrl);
    var options = {
        contentIdStem: jsonCII.contentId,
        timelineSelector: "urn:dvb:css:timeline:mpd:period:rel:25",
        tickrate: timelineClock.tickRate
    }

    printInfo('TS Configuration', JSON.stringify(options));
    
    //Iniciem video per a la sincronització
    player.play();

    //Iniciem WebSocket
    var client = createClient(ws, timelineClock, options);

    log("TS connected!");
}

var videoSynchronization = function(timelineClock){
    var timeVideo, error;

    //SYNC
    setInterval(function(){
        if(player.getState() != "paused"){
            window._timelineClock = timelineClock;
            printInfo('tickRate', timelineClock.getTickRate() + ' <button class="edit-tick-rate">Edit</button>');
            if(timelineClock.speed == 0){
                log('timelineClock.speed forced to 1')
                timelineClock.setSpeed(1);
            }
            timeVideo = (timelineClock.now()/timelineClock.getTickRate());
            error = Math.abs(player.getPosition() - timeVideo);
            printInfo('error', error);
            printInfo('position', player.getPosition());
            if(error > 10000 && confJson.broadcast){
                printInfo('tickRate', timelineClock.getTickRate() + ' <button class="edit-tick-rate">Edit</button>');
                printInfo('strange values', '<span style="color:red">should correct tickRate (1000000?)</span>');
                return;
            } else {
                printInfo('strange values', 'false');
            }
            if(error > 0.2){
                printInfo('seeked to video', String(timeVideo+0.4));
                player.seek(timeVideo+0.4);
            }
        }
    }, 1000);
}

var initConf = function(url){
     $.getJSON(url, function(json)
    {
        log(json)
        confJson = json;
        initPlayer();
    });
}

var initPlayer = function(){
    player = playVideo(confJson.videoCSBroadband);
}

var initApp = function() {

    terminalManager = hbbtv && hbbtv.createTerminalManager();
    $("#discoverTerminalsBtn").click(function () {
        log("Discover HbbTV Terminals");
        $("#terminals").html("Searching for HbbTV terminals:  please wait ...");
        $("#discoverTerminalsBtn").attr("disabled", true);
        setTimeout(discoverTerminals,500);
    });
    $("#discoverTerminalsBtn").attr("disabled",false);
};

window.confUrl = null;

$('.config-block select').on('change', function(e) {
    window.confUrl = window.CONFIG_LOCATION_URL[$(e.currentTarget).val()];
    log('conf: ' + window.confUrl);
    $('body')
        .removeClass('select-conf-state')
        .addClass('running-state')
    if(typeof hbbtv != "undefined"){
        initConf(window.confUrl);
        initApp();
    }
    else {
        initConf(window.confUrl);
        // wait for deviceready events (in Cordova Apps)
        document.addEventListener('deviceready', function () {
            initApp();
        }, false);
    }
})