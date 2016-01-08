var util = require('./util.js');
var request = require('request').defaults({
    baseUrl: 'https://person.clearbit.com/'
});

var pickInputs = {
        'email': 'email',
        'given_name': 'given_name',
        'family_name': 'family_name',
        'location': 'location',
        'company': 'company',
        'company_domain': 'company_domain',
        'linkedin': 'linkedin',
        'facebook': 'facebook'
    },
    pickOutputs = {
        'id': 'person.id',
        'name': 'person.name',
        'email': 'person.email',
        'gender': 'person.gender',
        'location': 'person.location',
        'bio': 'person.bio',
        'site': 'person.site',

        'employment': 'person.employment'
    };

module.exports = {

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var inputs = util.pickInputs(step, pickInputs),
            validateErrors = util.checkValidateErrors(inputs, pickInputs),
            apiKey = dexter.environment('clearbit_api_key'),
            api = '/v2/combined/find';

        if (!apiKey)
            return this.fail('A [clearbit_api_key] environment variable is required for this module');

        if (validateErrors)
            return this.fail(validateErrors);

        request.get({uri: api, qs: inputs, auth: { user: apiKey, pass: '' }, json: true}, function (error, response, body) {
            if (error)
                this.fail(error);
            else if (body && body.error)
                this.fail(body.error);
            else
                this.complete(util.pickOutputs(body, pickOutputs));
        }.bind(this));
    }
};
