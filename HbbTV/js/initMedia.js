/**
 * Initializes Media Synchroniser for received Video Object and timeline
 * @param {*} vba1 Video Object
 * @param {*} timeline Timeline
 */
var initMedia = function (vba1, timeline) {
	//Creem objecte
	var ms = oipfObjectFactory.createMediaSynchroniser();
	window._ccmaMediaSync = ms;

	ms.onError = function (lastError, lastErrorSource) {
		log('MediaSyncroniser onError');
		log(lastError);
		log(lastErrorSource);
	}

	ms.onSyncNowAchievable = function (mediaObject) {
		log('MediaSyncroniser onSyncNowAchievable');
	}

	ms.onInterDeviceSyncDispersionUpdate = function () {
		log('MediaSyncroniser onInterDeviceSyncDispersionUpdate');
	}

	//Iniciem sincronitzaciÃ³
	log("Timeline selcted: " + timeline);
	log(vba1);
	ms.initMediaSynchroniser(vba1, timeline);

	//Aixecar els endpoints(protocols)
	ms.enableInterDeviceSync(function () { log("Endpoints operable!"); });
	var videoTime = document.getElementById("videoTime");
	setInterval(function () {
		videoTime.value = ms.currentTime.toFixed(3);
	}, 100);
}

/**
 * Tries to destroy interDeviceSync when unloads
 */
window.onunload = function () {
	if (window._ccmaMediaSync) {
		window._ccmaMediaSync.disableInterDeviceSync();
	}
}