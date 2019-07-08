# Apache Cordova App

This application is based on a Fraunhofer FOKUS example app [Fraunhofer FOKUS](https://github.com/fraunhoferfokus/cordova-plugin-hbbtv-helloapp). 

This application relies on two libraries developed by the BBC, [clocks](https://github.com/bbc/dvbcss-clocks) and [protocols](https://github.com/bbc/dvbcss-protocols). We have made some changes in the protocols library in order to establish the communication with CSS-WC protocol through UDP, for this purpouse we use the UDPWallClock plugin [Datagram](https://github.com/masashiGMS/cordova-plugin-datagram).