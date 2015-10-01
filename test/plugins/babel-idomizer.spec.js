import {join} from 'path';
import babelIdomizer from '../../src/plugins/babel-idomizer.js';
import {expect} from 'chai';
var babel = require('babel');

describe('babel-idomizer', () => {

    it('should convert an idomizer file into a string function', (done) => {
        let options = {
            plugins: [babelIdomizer]
        };
        let result = babel.transformFile('test/plugins/dummy.es6', options, (err, result) => {
            if (err) {
                return done(err);
            }
            expect(result.code).to.contain(`o("h1", null, null, "class", data.h1Class);`);
            expect(result.code).to.contain(`t("Hello");`);
            expect(result.code).to.contain(`c("h1");`);
            done();
        });
    });

});
