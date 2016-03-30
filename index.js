var _     = require('lodash')
  , agent = require('superagent')
  , q     = require('q')
;

/**
 * Stitches a collection together based on a master key that dictates how many
 * operations should be performed for this set. 
 * 
 * @param  {AppStep} step   - The step to use for inputs
 * @param  {String}     master - The key to base indexing off of. This key determines how many elements will be in the collection
 * 
 * @return {Array} A collection of objects for iteration
 */
function stitch(step, master) {
    var stitched = [];
    step.input(master).each(function(item, idx) {
        var el = {};
        stitched.push(el);
        _.each(step.inputs(), function(input, key) {
            el[key] = indexOrFirst(step, key, idx);
        });
    });

    return stitched;
}

/**
 * Get an input at an index or from the first element
 * 
 * @param {AppStep} step - The step to use 
 * @param {String} key - The key to check
 * @param idx $idx - The index we're looking for
 *
 * @return {Mixed} the value to use
 */
function indexOrFirst(step, key, idx) {
    return _.isNil(step.input(key)[idx])
             ? step.input(key).first()
             : step.input(key)[idx]
    ;
}

module.exports = {

    /**
     * The main entry point for the Dexter module
     *
     * @param {AppStep} step Accessor for the configuration for the step using this module.  Use step.input('{key}') to retrieve input data.
     * @param {AppData} dexter Container for all data used in this workflow.
     */
    run: function(step, dexter) {
        var coll = stitch(step, 'email');

        q.allSettled(coll.map(function(item) {
            var deferred = q.defer(); 
            agent.get('https://person.clearbit.com/v2/combined/find')
              .query(_.omit(item, ['api_key']))
              .type('json')
              .set('Authorization', 'Bearer '+item.api_key)
              .end(function(err, result) {
                return err
                  ? deferred.reject(err)
                  : deferred.resolve(_.get(result, 'body.person'));
              });

            return deferred.promise;
        }))
        .then(this.complete.bind(this))
        .catch(this.fail.bind(this))
        ;
    }
};
