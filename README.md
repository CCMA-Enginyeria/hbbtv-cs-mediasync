# ImAc

Project for the synchronization of HbbTV 2.0 video app with mobile app. This project is based on the application of [Franhoufer FOKUS] (https://github.com/fraunhoferfokus/cordova-plugin-hbbtv-helloapp) for the mobile app part and launching of HbbTV 2.0 app on television. The synchronization part is based on the specifications and libraries of [DVB-CSS] (https://www.dvb.org/standards/dvb_css).

### 1.Setting up the prototype

1. Clone the repository.

2. Serve the HbbTv folder from a webserver (Choose you favorite)

3. Modify the conf.brodband.json file with the URL of the videos for TV and Companion App ((!)They should be Mpeg-DASH streams). This configuration file will be used for Vod<->Vod synchronization.

```javascript
{
   "broadcast": false,
   "videoTVBroadband":"### PUT HERE URL OF THE VIDEO THAT WILL BE PLAYED ON TV ###",
   "videoCSBroadband":"### PUT HERE URL OF THE VIDEO THAT WILL BE PLAYED ON CS ###"
}
```

5. Modify the conf.broadcast.json file with the URL of the video for Companion App ((!) Be sure that Broadcast has TEMI timelines). This config file will be used for Broadcast<->Vod synchronization.

```javascript
{
   "broadcast": true,
   "videoCSBroadband":"### PUT HERE URL OF THE VIDEO THAT WILL BE PLAYED ON CS ###"
}
```

4. Serve both config files from a webserver

5. Open ```Mobil/App/CS-App/index.html``` and modify the following variables.

```javascript
 jwplayer.key = "### PUT HERE YOUR JWPLAYER KEY ###";
 window.CONFIG_LOCATION_URL = {
    BROADBAND: "### PUT HERE THE LOCATION OF YOUR CONFIG FILE FOR BROADBAND ###",
    BROADCAST: "### PUT HERE THE LOCATION OF YOUR CONFIG FILE FOR BROADCAST ###"
 };
 window.HBBTV_LOCATION_URL = "### PUT HERE YOUR HBBTV APP LOCATION URL ###";
```

6. Open ```Mobil/App/CS-App``` on terminal.

7. Make sure you have Apache Cordova installed or execute npm install -g cordova

8. Add Android platform, type ```cordova platform add android```.

9. Plug an Android device and execute ```cordova run android```.

### 2. How it works

Once the app is installed on the Android device, you should follow the next steps:

1. Press ```Discover Terminals``` and wait few seconds.

2. All HbbTv devices on the same network should be listed.

3. Press ```Launch``` on the desired device.

4. Once the TV app is running press ```Connect``` to start the media synchronization.