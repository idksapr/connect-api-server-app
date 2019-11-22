const mongoose = require('mongoose');
const express = require('express');

const log = require('./tools/log')(module);
const config = require('./config');

const APIServerApp = new express();

require('./routes')(APIServerApp);

connect()
  .on('error', (error) => {
      log.error('DB connection error:', error.message);
  })
  .on('disconnected', connect)
  .once('open', listen);

function listen() {
    APIServerApp.listen(config.get('port'), (APIServerAppError) => {
        if (APIServerAppError) {
            log.error('HTTP error:', APIServerAppError.message);
        } else {
            log.info(
                '==> API server is started on port %s.',
                config.get('port')
            );
        }
    });
}

function connect() {
    let dbURI = config.get('db:mongoTest:uri');

    if (process.env.NODE_ENV === 'production') {
        dbURI = process.env.MONGOLAB_URI;
    }

    const options = {
        server: {
            socketOptions: {
                keepAlive: 1,
            },
        },
    };

    return mongoose.connect(dbURI, options).connection;
}

process.once('SIGUSR2', () => {
    gracefulShutdown('nodemon restart', () => {
        process.kill(process.pid, 'SIGUSR2');
    });
});

process.on('SIGINT', () => {
    gracefulShutdown('app termination', () => {
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    gracefulShutdown('heroku app termination', () => {
        process.exit(0);
    });
});

function gracefulShutdown(msg, callback) {
    mongoose.connection.close(() => {
        console.log(`Mongoose disconnected through ${msg}`);
        callback();
    });
}
