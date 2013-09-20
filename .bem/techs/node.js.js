exports.API_VER = 2;
exports.baseTechName = 'js';
exports.techMixin = {

    getSuffixes : function() {
        return ['node.js'];
    },

    getBuildSuffixes : function() {
        return ['node.js'];
    },

    getBuildResultChunk : function(relPath, path, suffix) {
        return 'require(\'' + relPath + '\');\n';
    }

};
