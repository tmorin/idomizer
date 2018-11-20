import babelIdomizer from '../../src/plugins/babel-idomizer.js';
import {expect} from 'chai';

const babel = require('@babel/core');

describe('babel-idomizer', () => {

    it('should convert an idomizer file into a string function', (done) => {
        let options = {
            plugins: [[babelIdomizer, {skipExceptions: false}]]
        };
        babel.transformFile('test/plugins/dummy.es6', options, (err, result) => {
            if (err) {
                return done(err);
            }
            expect(result.code).to.contain(`_elementOpen('h1', null, null, 'class', data.h1Class);`);
            expect(result.code).to.contain(`_text('\\n        Hello\\n    ');`);
            expect(result.code).to.contain(`_elementClose('h1');`);
            done();
        });
    });

});
