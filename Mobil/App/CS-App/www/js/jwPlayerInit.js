var playVideo = function(video){
	var player = jwplayer('video').setup({
	  playlist:[{
			file:video,
			//file:"http://172.24.32.89/HbbTV/video/mpd/v/stream.mpd",
			title:"Sintel",
			description:"This is a DASH stream!",
			type:"dash"
		}],
		dash: 'shaka',
		autostart: false


	});
	player.resize(350,180);
	return player;
}