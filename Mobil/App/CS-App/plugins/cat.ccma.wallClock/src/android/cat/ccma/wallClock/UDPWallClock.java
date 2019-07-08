package cat.ccma.wallClock;

import java.io.IOException;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.MulticastSocket;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;

import android.util.Log;
import android.util.SparseArray;

public class UDPWallClock extends CordovaPlugin {
    private static final String TAG = UDPWallClock.class.getSimpleName();

    SparseArray<DatagramSocket> m_sockets;
    SparseArray<SocketListener> m_listeners;

    public UDPWallClock() {
        m_sockets = new SparseArray<DatagramSocket>();
        m_listeners = new SparseArray<SocketListener>();
    }

    private class SocketListener extends Thread {
        int m_socketId;
        DatagramSocket m_socket;

        public SocketListener(int id, DatagramSocket socket) {
            this.m_socketId = id;
            this.m_socket = socket;
        }

        public void run() {
             /*****CHANGE*****/
            byte[] data = new byte[32]; // investigate MSG_PEEK and MSG_TRUNC in java
            DatagramPacket packet = new DatagramPacket(data, data.length);
            while (true) {
                try {
                    this.m_socket.receive(packet);
                    /*****CHANGE*****/
                    String msg = new String(packet.getData(), packet.getOffset(), packet.getLength());/*
                                    .replace("'", "\'")
                                    .replace("\r", "\\r")
                                    .replace("\n", "\\n");
                                    */
                    /*****CHANGE*****/
                    String ms = UDPWallClock.byteArrayToHexString(data); 

                    Log.d(TAG, "platform android.... run UDPWallClock:" + ms);
                    String address = packet.getAddress().getHostAddress();
                    int port = packet.getPort();

                    UDPWallClock.this.webView.sendJavascript(
                        "cordova.require('cat.ccma.wallClock.UDPWallClock')._onMessage("
                            + this.m_socketId + ","
                            + "'" + ms + "',"
                            + "'" + address + "',"
                            + port + ")");
                } catch (Exception e) {
                    Log.d(TAG, "Receive exception:" + e.toString());
                    return;
                }
            }
        }
    }

    @Override
    public boolean execute(String action, JSONArray data, CallbackContext callbackContext) throws JSONException {
        final int id = data.getInt(0);
        DatagramSocket socket = m_sockets.get(id);

        if (action.equals("create")) {
            assert socket == null;
            final boolean isMulticast = data.getBoolean(1);
            try {
                socket = isMulticast ? new MulticastSocket(null) : new DatagramSocket(null);
                m_sockets.put(id, socket);
                callbackContext.success();
            } catch (Exception e) {
                Log.d(TAG, "Create exception:" + e.toString());
                callbackContext.error(e.toString());
            }
        } else if (action.equals("bind")) {
            final int port = data.getInt(1);
            try {
                socket.bind(new InetSocketAddress(port));

                SocketListener listener = new SocketListener(id, socket);
                m_listeners.put(id, listener);
                listener.start();

                callbackContext.success();
            } catch (Exception e) {
                Log.d(TAG, "Bind exception:" + e.toString());
                callbackContext.error(e.toString());
            }
        } else if (action.equals("joinGroup")) {
            final String address = data.getString(1);
            MulticastSocket msocket = (MulticastSocket) socket;
            try {
                msocket.joinGroup(InetAddress.getByName(address));
                callbackContext.success();
            } catch (Exception e) {
                Log.d(TAG, "joinGroup exception:" + e.toString());
                callbackContext.error(e.toString());
            }
        } else if (action.equals("leaveGroup")) {
            final String address = data.getString(1);
            MulticastSocket msocket = (MulticastSocket) socket;
            try {
                msocket.leaveGroup(InetAddress.getByName(address));
                callbackContext.success();
            } catch (Exception e) {
                Log.d(TAG, "leaveGroup exception:" + e.toString());
                callbackContext.error(e.toString());
            }
        } else if (action.equals("send")) {
            String message = data.getString(1);
            String address = data.getString(2);
            int port = data.getInt(3);

            try {
                /*****CHANGE*****/
                Log.d(TAG, "Sending message:" + message);
                byte[] msg = UDPWallClock.hexStringToByteArray(message);
                Log.d(TAG, "Sending message length:" + msg.length);
                /*****CHANGE*****/
                DatagramPacket packet = new DatagramPacket(msg, msg.length, InetAddress.getByName(address), port);
                socket.send(packet);
                callbackContext.success(message);
            } catch (IOException ioe) {
                Log.d(TAG, "send exception:" + ioe.toString());
                callbackContext.error("IOException: " + ioe.toString());
            }
        } else if (action.equals("close")) {
            if (socket != null) {
                socket.close();
                m_sockets.remove(id);
                SocketListener listener = m_listeners.get(id);
                if (listener != null) {
                    listener.interrupt();
                    m_listeners.remove(id);
                }
            }
            callbackContext.success();
        } else {
            return false; // 'MethodNotFound'
        }

        return true;
    }


    /*****CHANGE*****/
    public static byte[] hexStringToByteArray(String s) {
        int len = s.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4)
                                 + Character.digit(s.charAt(i+1), 16));
        }
        return data;
    }
    /*****CHANGE*****/
    public static String byteArrayToHexString(byte[] data) {
        char[] hexArray = "0123456789ABCDEF".toCharArray();
        char[] hexChars = new char[data.length * 2];
        for ( int j = 0; j < data.length; j++ ) {
            int v = data[j] & 0xFF;
            hexChars[j * 2] = hexArray[v >>> 4];
            hexChars[j * 2 + 1] = hexArray[v & 0x0F];
        }
        return new String(hexChars);
    }
}

