module.exports = {
    generateRandomString: (length) =>
        Math.random().toString(36).slice(2, 2 + (length ? Math.min(length, 24) : 24)),
};
