// Server is the ip of the janus server followed by /janus
let server = ''
// 3cplus host
let host = ''
// agent id
let agent_id = ''
// agent password
let agent_password = ''

let janus = null
let registered = false
let sipcall = null

function addAgent(options) {
    server = options.server
    host = options.host
    agent_id = options.agent_id
    agent_password = options.agent_password
    console.log(options)
    register()
}

function register_agent() {
    register = {
        request: 'register',
        proxy: 'sip:' + host,
        username: 'sip:'+ agent_id + '@' + host,
        secret: agent_password,
        display_name: agent_id
    }

    sipcall.send({"message": register});
}

function register(){
    $('#info').text('Trying to register...')
    Janus.init({
        debug: "all",
        callback: function() {
            if (!Janus.isWebrtcSupported()) {
                Janus.log("No WebRTC support... ")
                return
            }
        }
    })
    // Create session
    janus = new Janus({
        server: server,
        success: function() {
            // Attach to echo test plugin
            janus.attach({
                plugin: "janus.plugin.sip",
                success: function(pluginHandle) {
                    sipcall = pluginHandle
                    Janus.log("Plugin attached! (" + sipcall.getPlugin() + ", id=" + sipcall.getId() + ")")
                    $('#info').text('Janus success connect, Trying to register agent...')
                    register_agent()
                },
                error: function(error) {
                    Janus.error("  -- Error attaching plugin...", error)
                    $('#info').text('Error connecting to janus server')
                },
                consentDialog: function(on) {
                    Janus.debug("Consent dialog should be " + (on ? "on" : "off") + " now")
                },
                onmessage: function(msg, jsep) {
                    Janus.debug(" ::: Got a message :::")
                    Janus.debug(JSON.stringify(msg))

                    // Any error?
                    var error = msg["error"]
                    if (error != null && error != undefined) {
                        // Reset status
                        sipcall.hangup()
                        return
                    }

                    var result = msg["result"]
                    if (result !== null && result !== undefined && result["event"] !== undefined && result["event"] !== null) {
                        var event = result["event"]
                        switch (event) {
                            case 'registration_failed':
                                Janus.warn("Registration failed: " + result["code"] + " " + result["reason"])
                                $('#info').text('Registration failed')
                                return
                            case 'registered':
                                Janus.log("Successfully registered as " + result["username"] + "!")
                                $('#info').text('Successfully registered')
                                if (!registered)
                                    registered = true
                                break
                            case 'calling':
                                Janus.log("Waiting for the peer to answer...")
                                break
                            case 'incomingcall':
                                console.log(JSON.stringify(result))
                                var doAudio = true, doVideo = true;
                                if(jsep !== null && jsep !== undefined) {
                                    // What has been negotiated?
                                    doAudio = (jsep.sdp.indexOf("m=audio ") > -1);
                                    doVideo = (jsep.sdp.indexOf("m=video ") > -1);
                                    Janus.debug("Audio " + (doAudio ? "has" : "has NOT") + " been negotiated");
                                    Janus.debug("Video " + (doVideo ? "has" : "has NOT") + " been negotiated");
                                }
                                // Any security offered? A missing "srtp" attribute means plain RTP
                                var rtpType = "";
                                var srtp = result["srtp"];
                                if(srtp === "sdes_optional")
                                    rtpType = " (SDES-SRTP offered)";
                                else if(srtp === "sdes_mandatory")
                                    rtpType = " (SDES-SRTP mandatory)";
                                Janus.log("Incoming call from " + result["username"] + "!")
                                sipcall.createAnswer({
                                    jsep: jsep,
                                    media: {
                                        audio: doAudio,
                                        video: doVideo
                                    },
                                    success: function(jsep) {
                                        Janus.debug(jsep);
                                        var body = { request: "accept" };
                                        sipcall.send({"message": body, "jsep": jsep});
                                    },
                                    error: function(error) {
                                        Janus.error("WebRTC error:", error);
                                        var body = { "request": "decline", "code": 480 };
                                        sipcall.send({"message": body});
                                    }
                                });
                                break
                            case 'accepted':
                                console.log(JSON.stringify(result))
                                Janus.log(result["username"] + " accepted the call!")
                                if(jsep !== null && jsep !== undefined) {
                                    sipcall.handleRemoteJsep({jsep: jsep, error: doHangup });
                                }
                                break
                            case 'hangup':
                                $('#info').text('Disconnected')
                                Janus.log("Call hung up (" + result["code"] + " " + result["reason"] + ")!")
                                sipcall.hangup()
                                break
                        }
                    }
                },
                onlocalstream: function(stream) {
                    Janus.debug(" ::: Got a local stream :::")
                },
                onremotestream: function(stream) {
                    Janus.debug(" ::: Got a remote stream :::")
                    $('#info').text('Connected in a campaign')
                    Janus.attachMediaStream($('#audio').get(0), stream);
                },
                oncleanup: function() {
                    Janus.log(" ::: Got a cleanup notification :::")
                }
            })
        },
        error: function(error) {
            console.log('Error - ', error)
            $('#info').text('Error connecting to janus server')
        },
        destroyed: function() {
            console.log('Session destroyed')
        }
    })
}

function doHangup() {
    // Hangup a call
    var hangup = { "request": "hangup" };
    sipcall.send({"message": hangup});
    sipcall.hangup();
}

function mute() {
    sipcall.muteAudio()
}

function unmute() {
    sipcall.unmuteAudio()
}

function destroyRegister(){
    janus.destroy()
}


