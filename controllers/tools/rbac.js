const config = require('../../config');

class RBAC {
    static getInstance(user, operation, modelName) {
        return new RBAC(user, operation, modelName);
    }

    constructor(user, operation, modelName) {
        this.roles = [ 'guest' ];
        this.errors = [];

        if (user) {
            this.user = user;
            this.roles.push(user.role);
        }
        this.operation = operation.toLowerCase();
        this.essence = modelName.toLowerCase();
    }

    checkCompany(companyId) {
        if (this.user) {
            if (this.user.role.toString() !== 'admin' &&
                !this.user.companies.some((userCompanyId) => (companyId.toString() === userCompanyId.toString()))) {
                this.errors.push(`Access denied for user ${this.user._id}`);
            }
        }
        return this;
    }

    checkOwner(instanceOwnerId) {
        if (this.user) {
            if (this.user._id.toString() === instanceOwnerId.toString()) {
                this.roles.push('owner');
            }
        }
        return this;
    }

    exec(callback) {
        const validRoles = config.get(`RBAC:${this.essence}:${this.operation}`);

        if (!this.roles.some(role => (validRoles.indexOf(role) !== -1))) {
            this.errors.push('There is a lack of access rights for the user');
        }

        if (this.errors.length > 0) {
            const error = new Error('Access denied');

            error.errors = this.errors;
            this.errors = [];
            return callback(error);
        }
        return callback();
    }
}

module.exports = RBAC;
