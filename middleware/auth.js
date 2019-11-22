const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;

const config = require('../config');
const UserModel = require('../models/user-model');
const ClientAppModel = require('../models/client-app-model').ClientAppModel;
const AccessTokenModel = require('../models/client-app-model').AccessTokenModel;

passport.use(new BasicStrategy(
    (username, password, done) => {
        ClientAppModel.findById(username, (err, client) => {
            if (err) {
                return done(err);
            }
            if (!client) {
                return done(null, false);
            }
            if (client.clientSecret !== password) {
                return done(null, false);
            }
            return done(null, client);
        });
    }
));

passport.use(new ClientPasswordStrategy(
    (clientId, clientSecret, done) => {
        ClientAppModel.findById(clientId, (err, client) => {
            if (err) {
                return done(err);
            }
            if (!client) {
                return done(null, false);
            }
            if (client.clientSecret !== clientSecret) {
                return done(null, false);
            }
            return done(null, client);
        });
    }
));

passport.use(new BearerStrategy(
    (accessToken, done) => {
        AccessTokenModel.findOne({ token: accessToken }, (tokenFindError, token) => {
            if (tokenFindError) {
                return done(tokenFindError);
            }
            if (!token) {
                return done(null, false);
            }

            if (Math.round((Date.now() - token.created) / 1000) > config.get('security:tokenLife')) {
                AccessTokenModel.remove({ token: accessToken }, (tokenRemoveError) => {
                    if (tokenRemoveError) {
                        return done(tokenRemoveError);
                    }
                    return true;
                });
                return done(null, false, { message: 'Token expired' });
            }

            return UserModel.findById(token.userId, (userFindError, user) => {
                if (userFindError) {
                    return done(userFindError);
                }
                if (!user) {
                    return done(null, false, { message: 'Unknown user' });
                }

                const info = { scope: '*' };

                return done(null, user, info);
            });
        });
    }
));
