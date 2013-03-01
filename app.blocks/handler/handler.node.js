App.CommonHandler = inherit(App.Router, {

    run : function() {
        return this._handleRequest.bind(this);
    },

    _handleRequest : function(req, res) {
        req = new App.Request(req);

        var route = this.dispatch(req);

        App.Logger.debug('Route dispatched %j', route);

        if(route.action === App.Router.NOT_FOUND) {
            this.handle404.call(this, req, res, route);
            return;
        }

        return this.handleRequest.call(this, req, res, route);
    },

    handleRequest : function(req, res, route) {
        this.__self._getViewClass()
            .create(route.action, req, res, route.path, route.params)
            ._run();
    },

    handle404 : function(req, res, route) {
        App.Logger.debug('Not found: "%s"', req.pathname);
        throw new App.HttpError(404, 'Not found.');
    },

    handle500 : function(req, res) {
        throw new App.HttpError(500, 'Temporarily unavailable.');
    }

}, {

    _getViewClass : function() {
        return App.View;
    }

});