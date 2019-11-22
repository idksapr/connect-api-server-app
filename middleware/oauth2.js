const oauth2orize = require('oauth2orize');
const passport = require('passport');
const crypto = require('crypto');

const config = require('../config');
const UserModel = require('../models/user-model');
const AccessTokenModel = require('../models/client-app-model').AccessTokenModel;
const RefreshTokenModel = require('../models/client-app-model').RefreshTokenModel;

// create OAuth 2.0 server
const server = oauth2orize.createServer();

// Exchange username & password for access token.
server.exchange(oauth2orize.exchange.password((client, username, password, scope, done) => {
    UserModel.findOne({ username }, (userFindError, user) => {
        if (userFindError) {
            return done(userFindError);
        }
        if (!user) {
            return done(null, false);
        }
        if (!user.checkPassword(password)) {
            return done(null, false);
        }

        RefreshTokenModel.remove({ userId: user.userId, clientId: client._id }, refreshTokenRemoveError =>
            (refreshTokenRemoveError ? done(refreshTokenRemoveError) : true)
        );
        AccessTokenModel.remove({ userId: user.userId, clientId: client._id }, accessTokenRemoveError =>
            (accessTokenRemoveError ? done(accessTokenRemoveError) : true)
        );

        const tokenValue = crypto.randomBytes(32).toString('base64');
        const refreshTokenValue = crypto.randomBytes(32).toString('base64');
        const token = new AccessTokenModel({
            token: tokenValue,
            clientId: client._id,
            userId: user.userId,
        });
        const refreshToken = new RefreshTokenModel({
            token: refreshTokenValue,
            clientId: client._id,
            userId: user.userId,
        });

        refreshToken.save(refreshTokenSaveError =>
            (refreshTokenSaveError ? done(refreshTokenSaveError) : true)
        );

        return token.save((tokenSaveError) => {
            if (tokenSaveError) {
                return done(tokenSaveError);
            }
            return done(null, tokenValue, refreshTokenValue, { expires_in: config.get('security:tokenLife') });
        });
    });
}));

// Exchange refreshToken for access token.
server.exchange(oauth2orize.exchange.refreshToken((client, refreshToken, scope, done) => {
    RefreshTokenModel.findOne({ token: refreshToken }, (refreshTokenFindError, token) => {
        if (refreshTokenFindError) {
            return done(refreshTokenFindError);
        }
        if (!token) {
            return done(null, false);
        }

        return UserModel.findById(token.userId, (userFindError, user) => {
            if (userFindError) {
                return done(userFindError);
            }
            if (!user) {
                return done(null, false);
            }

            RefreshTokenModel.remove({ userId: user.userId, clientId: client._id }, refreshTokenRemoveError =>
                (refreshTokenRemoveError ? done(refreshTokenRemoveError) : true)
            );
            AccessTokenModel.remove({ userId: user.userId, clientId: client._id }, accessTokenRemoveError =>
                (accessTokenRemoveError ? done(accessTokenRemoveError) : true)
            );

            const tokenValue = crypto.randomBytes(32).toString('base64');
            const refreshTokenValue = crypto.randomBytes(32).toString('base64');
            const newToken = new AccessTokenModel({
                token: tokenValue,
                clientId: client._id,
                userId: user.userId,
            });
            const newRefreshToken = new RefreshTokenModel({
                token: refreshTokenValue,
                clientId: client._id,
                userId: user.userId,
            });

            newRefreshToken.save(refreshTokenSaveError =>
                (refreshTokenSaveError ? done(refreshTokenSaveError) : true)
            );

            return newToken.save((tokenSaveError) => {
                if (tokenSaveError) {
                    return done(tokenSaveError);
                }
                return done(null, tokenValue, refreshTokenValue, { expires_in: config.get('security:tokenLife') });
            });
        });
    });
}));


// token endpoint
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler(),
];
