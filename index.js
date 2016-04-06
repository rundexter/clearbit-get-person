var _     = require('lodash')
  , agent = require('superagent')
  , q     = require('q')
;

module.exports = {

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var self = this
          , coll = step.inputObject(['email','given_name','family_name','location','company'])
        ;

        q.all(coll.map(function(item) {
            var deferred = q.defer(); 
            agent.get('https://person.clearbit.com/v2/combined/find')
              .query(item)
              .type('json')
              .set('Authorization', 'Bearer '+step.input('api_key').first())
              .end(deferred.makeNodeResolver());

            return deferred
                     .promise
                     .then(function(response) {
                       return _.get(response, 'body.person');
                     })
                     .catch(function(err) {
                        var response = err.response;
                        self.log(response.statusCode + ": " + _.get(response, 'body.error.message'), response.body);
                        return { 
                            error: _.get(response, 'body.error.type')
                        };
                     })
                   ;
        }))
        .then(this.complete.bind(this))
        .catch(this.fail.bind(this))
        ;
    }
};
