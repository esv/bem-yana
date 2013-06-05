/* jshint node:true */
/* global modules:false */

modules.define(
    'yana-http',
    ['inherit', 'vow', 'yana-config', 'yana-logger', 'yana-util'],
    function(provide, inherit, Vow, config, logger, util) {

var FS = require('fs'),
    env = config.app;

provide(inherit({

    __constructor : function(params) {
        this._handlers = [];

        this._params = util.extend(this.getDefaultParams(), params);

        this
            ._loadHandlers()
            ._createServer();
    },

    /**
     * @param {Numer|String} [portOrSocket]
     */
    run : function(portOrSocket) {
        portOrSocket || (portOrSocket = env.socket || env.port);

        this._server.listen(portOrSocket, function() {
            logger.info('Server started on %s "%s"',
                    typeof portOrSocket === 'number'? 'port' : 'socket', portOrSocket);
            if(env.socket) {
                FS.chmod(env.socket, '0777');
            }
        });
    },

    stop : function() {
        logger.debug('Server stoped');
        this._server.close();
    },

    _handlers : [],

    _loadHandlers: function() {
        this._handlers = this._params['handlers'];
        return this;
    },

    _onRequest : function(req, res) {
        logger.debug('\nRequest for "%s" received', req.url);

        if(!this._handlers.length) {
            logger.warning('No request handlers registered. Exiting');
            return this._onStackEnd(req, res);
        }

        var proc,
            hResultsP = this._handlers.reduce(function(val, handler) {
                proc = (new handler())._run();
                // FIXME: Обработчик POST-запроса срабатывает только на первый tick,
                // поэтому первый handler нельзя завернуть в promise (node<=0.8)
                return val === null?
                        proc(req, res) :
                        Vow.when(val, function(result) {
                            if(res.finished) {
                                // FIXME: do something usefull?
                                logger.warning('Response for "%s" was finished before all the handlers processed!', req.url);
                                return;
                            }

                            return proc(req, res);
                        });
        }, null);

        hResultsP.then(
            this._onStackEnd.bind(this, req, res),
            this._onError.bind(this, req, res));
    },

    _onError : function(req, res, err) {
        logger.error('Error cached, %s', err.message, err.stack || '');

        var code = err.code || 500;

        res.writeHead(code, { 'Content-Type' : 'text/plain; charset=utf-8' });
        res.end(err.toString());
    },

    _onStackEnd : function(req, res) {
        logger.debug('All request handlers are passed');

        // XXX: should we really need this?
        res.finished || res.end();
    },

    _createServer : function() {
        this._server ||
            (this._server = this.__self._http.createServer(this._onRequest.bind(this)));
    },

    getDefaultParams : function() {
        return {
            'handlers' : []
        };
    }

}, {

    _http : require('http')

}));

});
