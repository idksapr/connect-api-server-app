module.exports = {
    sendSuccess: (req, res, modelName, instance, status = 200) => {
        return res.status(status).json({
            response: {
                model: modelName,
                instance,
            },
            status,
            success: true,
        });
    },

    sendError: (req, res, error, modelName, status = 500) => {
        return res.status(status).json({
            response: {
                model: modelName,
                error: {
                    message: error.message,
                    errors: error.errors,
                },
            },
            status,
            success: false,
        });
    },
};
