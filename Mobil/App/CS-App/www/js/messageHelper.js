var hex2a = function (hexx) {
    var hex = hexx.toString();
    var str = '';
    for (var i = 0; (i < hex.length && hex.substr(i, 2) !== '00'); i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

var a2hex = function (str) {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n ++) 
     {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
     }
    return arr1.join('');
}

var fill2Digit = function(str){
    var length = str.length;
    if(length < 2){
        for(var i = 2; i > length; i--){
            str = "0" + str;
        }
    }   
    return str;
}

/*var fill5Digit = function(str){
    var length = str.length;
    if(length < 5){
        var i;
        for(i = 5; i > length; i--){
            str = "0" + str;
        }
    }   
    return str;
}*/

var fill8Digit = function(str){
    var length = str.length;
    if(length < 8){
        var i;
        for(i = 8; i > length; i--){
            str = "0" + str;
        }
    }   
    return str;
}

/*var fill32Digit = function(str){
    var length = str.length;
    if(length < 32){
        var i;
        for(i = 32; i > length; i--){
            str = "0" + str;
        }
    }   
    return str;
}*/

var jsonToHexWC = function(msg){
    var str = "";
    str += fill2Digit(msg["version"].toString(16));
    str += fill2Digit(msg["message_type"].toString(16));
    str += fill2Digit(msg["precision"].toString(16));
    str += fill2Digit(msg["reserved"].toString(16));
    str += fill8Digit(msg["max_freq_error"].toString(16));
    str += fill8Digit(msg["originate_timevalues"]["originate_timevalues_secs"].toString(16));
    str += fill8Digit(msg["originate_timevalues"]["originate_timevalues_nanos"].toString(16));
    str += fill8Digit(msg["receive_timevalues"]["receive_timevalues_secs"].toString(16));
    str += fill8Digit(msg["receive_timevalues"]["receive_timevalues_nanos"].toString(16));
    str += fill8Digit(msg["transmit_timevalues"]["transmit_timevalues_secs"].toString(16));
    str += fill8Digit(msg["transmit_timevalues"]["transmit_timevalues_nanos"].toString(16));
    return str;
}

var hexToJsonWC = function(msg){
    var jsonMsg = {
        "version": parseInt(msg.slice(0,2),16),
        "message_type": parseInt(msg.slice(2,4),16),
        "precision": parseInt(msg.slice(4,6),16),
        "reserved": parseInt(msg.slice(6,8),16),
        "max_freq_error": parseInt(msg.slice(8,16),16),
        "originate_timevalues": {
            "originate_timevalues_secs": parseInt(msg.slice(16,24),16),
            "originate_timevalues_nanos": parseInt(msg.slice(24,32),16)
        },
        "receive_timevalues": {
            "receive_timevalues_secs": parseInt(msg.slice(32,40),16),
            "receive_timevalues_nanos": parseInt(msg.slice(40,48),16)
        },
        "transmit_timevalues": {
            "transmit_timevalues_secs": parseInt(msg.slice(48,56),16),
            "transmit_timevalues_nanos": parseInt(msg.slice(56,64),16)
        }
    };


    return jsonMsg;
}