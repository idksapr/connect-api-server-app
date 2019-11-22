const log = require('../../tools/log')(module);

module.exports = {
    push: (modelName, instance, operation, error = null) => {
        const instanceId = instance && instance._id ? instance._id : 'undefined';
        const status = error ? 'fail' : 'success';
        const errorMessage = error ? error.message : '';
        const message = `Model:"${modelName}" Opearation:"${operation}"` +
            ` Status:"${status}" Instance:"${instanceId}" Error:"${errorMessage}"`;

        if (error) {
            log.error(message);
        } else {
            log.info(message);
        }
    },
};
