"use strict";
cc._RF.push(module, 'b1cc9yRd15CXqFg0vTGKZUk', 'Net');
// scripts/Net.js

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

if (window.io == null) {
    window.io = require("socket-io");
}

var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip: "",
        sio: null,
        isPinging: false,
        fnDisconnect: null,
        handlers: {},
        addHandler: function addHandler(event, fn) {
            if (this.handlers[event]) {
                console.log("event:" + event + "' handler has been registered.");
                return;
            }

            var handler = function handler(data) {
                //console.log(event + "(" + typeof(data) + "):" + (data? data.toString():"null"));
                if (event != "disconnect" && typeof data == "string") {
                    data = JSON.parse(data);
                }
                fn(data);
            };

            this.handlers[event] = handler;
            if (this.sio) {
                console.log("register:function " + event);
                //把消息和事件放到这里面
                this.sio.on(event, handler);
            }
        },
        connect: function connect(fnConnect, fnError) {
            var self = this;

            var opts = {
                'reconnection': false,
                'force new connection': true,
                'transports': ['websocket', 'polling']
            };
            this.sio = window.io.connect(this.ip, opts);
            this.sio.on('reconnect', function () {
                console.log('reconnection');
            });
            this.sio.on('connect', function (data) {
                self.sio.connected = true;
                fnConnect(data);
            });

            this.sio.on('disconnect', function (data) {
                console.log("disconnect");
                self.sio.connected = false;
                self.close();
            });

            this.sio.on('connect_failed', function () {
                console.log('connect_failed');
            });

            for (var key in this.handlers) {
                var value = this.handlers[key];
                if (typeof value == "function") {
                    if (key == 'disconnect') {
                        this.fnDisconnect = value;
                    } else {
                        console.log("register:function " + key);
                        this.sio.on(key, value);
                    }
                }
            }

            this.startHearbeat();
        },

        startHearbeat: function startHearbeat() {
            this.sio.on('game_pong', function () {
                console.log('game_pong');
                self.lastRecieveTime = Date.now();
            });
            this.lastRecieveTime = Date.now();
            var self = this;
            console.log(1);
            if (!self.isPinging) {
                console.log(1);
                self.isPinging = true;
                setInterval(function () {
                    console.log(3);
                    if (self.sio) {
                        console.log(4);
                        if (Date.now() - self.lastRecieveTime > 10000) {
                            self.close();
                        } else {
                            self.ping();
                        }
                    }
                }, 5000);
            }
        },
        send: function send(event, data) {
            if (this.sio.connected) {
                if (data != null && (typeof data === "undefined" ? "undefined" : _typeof(data)) == "object") {
                    data = JSON.stringify(data);
                    //console.log(data);              
                }
                this.sio.emit(event, data);
            }
        },

        ping: function ping() {
            this.send('game_ping');
        },

        close: function close() {
            console.log('close');
            if (this.sio && this.sio.connected) {
                this.sio.connected = false;
                this.sio.disconnect();
                this.sio = null;
            }
            if (this.fnDisconnect) {
                this.fnDisconnect();
                this.fnDisconnect = null;
            }
        },

        test: function test(fnResult) {
            var xhr = null;
            var fn = function fn(ret) {
                fnResult(ret.isonline);
                xhr = null;
            };

            var arr = this.ip.split(':');
            var data = {
                account: cc.vv.userMgr.account,
                sign: cc.vv.userMgr.sign,
                ip: arr[0],
                port: arr[1]
            };
            xhr = cc.vv.http.sendRequest("/is_server_online", data, fn);
            setTimeout(function () {
                if (xhr) {
                    xhr.abort();
                    fnResult(false);
                }
            }, 1500);
            /*
            var opts = {
                'reconnection':false,
                'force new connection': true,
                'transports':['websocket', 'polling']
            }
            var self = this;
            this.testsio = window.io.connect(this.ip,opts);
            this.testsio.on('connect',function(){
                console.log('connect');
                self.testsio.close();
                self.testsio = null;
                fnResult(true);
            });
            this.testsio.on('connect_error',function(){
                console.log('connect_failed');
                self.testsio = null;
                fnResult(false);
            });
            */
        }
    }
});

cc._RF.pop();