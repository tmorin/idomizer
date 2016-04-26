import {join} from 'path';
import babelIdomizer from '../../src/plugins/babel-idomizer.js';
import {expect} from 'chai';
var babel = require('babel-core');

describe('babel-idomizer', () => {

    it('should convert an idomizer file into a string function', (done) => {
        let options = {
            plugins: [babelIdomizer]
        };
        babel.transformFile('test/plugins/dummy.es6', options, (err, result) => {
            if (err) {
                /* istanbul ignore next  */
                return done(err);
            }
            expect(result.code).to.contain(`o('h1', null, null, 'class', data.h1Class);`);
            expect(result.code).to.contain(`t('\\n        Hello\\n    ');`);
            expect(result.code).to.contain(`c('h1');`);
            done();
        });
    });

});
