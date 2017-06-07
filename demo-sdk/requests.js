const request = require('request')

const process = function (data, agent, callback) {

    // API url
    const api_url = 'http://example.com/api/v1/'

    switch (data.type) {
        case 'login':
            login()
            break
        case 'logout':
            logout()
            break
        case 'hangup':
            hangup()
            break
        case 'qualify':
            qualify()
            break
        case 'enter-manual-mode':
            enterManualMode()
            break
        case 'start-manual-call':
            startManualCall()
            break
        case 'exit-manual-mode':
            exitManualMode()
            break
        default:
            console.error('error in function')
            return callback(true)
    }

    function login () {
        const options = {
            method: 'POST',
            url: api_url + 'agent/login',
            form: {
                api_token: agent.token
            }
        }
        console.log(JSON.stringify(options))

        request(options, function (err, response, body) {
            console.log(JSON.stringify(body))
            if (err) {
                return callback(false)
            }
            return callback(true)
        })
    }

    function logout () {
        const options = {
            method: 'POST',
            url: api_url + 'agent/logout',
            form: {
                api_token: agent.token
            }
        }

        console.log(JSON.stringify(options))
        request(options, function (err, response, body) {
            console.log(JSON.stringify(body))
            if (err) {
                return callback(false)
            }
            return callback(true)
        })
    }

    function hangup () {
        const options = {
            method: 'POST',
            url: api_url + 'agent/call' + data.call_id + '/hangup',
            form: {
                api_token: agent.token
            }
        }

        console.log(JSON.stringify(options))
        request(options, function (err, response, body) {
            console.log(JSON.stringify(body))
            if (err) {
                return callback(false)
            }
            return callback(true)
        })
    }

    function qualify () {
        const options = {
            method: 'POST',
            url: api_url + 'agent/call' + data.call_id + '/qualify',
            form: {
                api_token: agent.token,
                qualification_id: data.qualification_id
            }
        }

        console.log(JSON.stringify(options))
        request(options, function (err, response, body) {
            console.log(JSON.stringify(body))
            if (err) {
                return callback(false)
            }
            return callback(true)
        })
    }

    function enterManualMode () {
        const options = {
            method: 'POST',
            url: api_url + 'agent/manual_call/enter',
            form: {
                api_token: agent.token,
            }
        }

        console.log(JSON.stringify(options))
        request(options, function (err, response, body) {
            console.log(JSON.stringify(body))
            if (err) {
                return callback(false)
            }
            return callback(true)
        })
    }

    function startManualCall () {
        const options = {
            method: 'POST',
            url: api_url + 'agent/manual_call/dial',
            form: {
                api_token: agent.token,
                phone: data.phone
            }
        }

        console.log(JSON.stringify(options))
        request(options, function (err, response, body) {
            console.log(JSON.stringify(body))
            if (err) {
                return callback(false)
            }
            return callback(true)
        })
    }

    function exitManualMode () {
        const options = {
            method: 'POST',
            url: api_url + 'agent/manual_call/exit',
            form: {
                api_token: agent.token,
            }
        }

        console.log(JSON.stringify(options))
        request(options, function (err, response, body) {
            console.log(JSON.stringify(body))
            if (err) {
                return callback(false)
            }
            return callback(true)
        })
    }

}

exports.process = process
