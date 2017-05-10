// Server is the ip of the janus server followed by /janus
var server = "http://example.com/janus"

var janus = null
var registered = false
var sipcall = null

// When the page is loaded...
$(document).ready(function() {
    // Initialize the janus library (all console debuggers enabled)
    Janus.init({
        debug: "all",
        callback: function() {
            if (!Janus.isWebrtcSupported()) {
                Janus.log("No WebRTC support... ")
                return
            }

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
                        },
                        error: function(error) {
                            Janus.error("  -- Error attaching plugin...", error)
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
                                        return
                                    case 'registered':
                                        Janus.log("Successfully registered as " + result["username"] + "!")
                                        if (!registered)
                                            registered = true
                                        break
                                    case 'calling':
                                        Janus.log("Waiting for the peer to answer...")
                                        break
                                    case 'incomingcall':
                                        Janus.log("Incoming call from " + result["username"] + "!")
                                        break
                                    case 'accepted':
                                        Janus.log(result["username"] + " accepted the call!")
                                        break
                                    case 'hangup':
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
                        },
                        oncleanup: function() {
                            Janus.log(" ::: Got a cleanup notification :::")
                        }
                    })
                },
                error: function(error) {
                    console.log('Error - ', error)
                },
                destroyed: function() {
                    console.log('Session destroyed')
                }
            })
        }
    })
})