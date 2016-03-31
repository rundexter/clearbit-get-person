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
        var coll = step.inputObject(['email','given_name','family_name','location','company']);

        q.all(coll.map(function(item) {
            var deferred = q.defer(); 
            agent.get('https://person.clearbit.com/v2/combined/find')
              .query(item)
              .type('json')
              .set('Authorization', 'Bearer '+step.input('api_key').first())
              .end(function(err, result) {
                console.log(Object.keys(result.body.person));
                return err || result.statusCode >= 400
                  ? deferred.reject(err || result.body)
                  : deferred.resolve(_.get(result, 'body.person'));
              });

            return deferred.promise;
        }))
        .then(this.complete.bind(this))
        .catch(this.fail.bind(this))
        ;
    }
};
