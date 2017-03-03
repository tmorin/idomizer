import {join} from 'path';
import idomizerify from '../../src/plugins/idomizerify.js';
import {runTransform} from 'browserify-transform-tools';
import {expect} from 'chai';

describe('idomizerify', () => {

    it('should convert an idomizer file into a string function', (done) => {
        const dummyJsFile = join(__dirname, 'plugins/dummy.idomizer');
        const content = `<h1 class="{{data.h1Class}}">Hello</h1>`;
        runTransform(idomizerify, dummyJsFile, {content, config: {skipExceptions: false}}, (err, result) => {
            if (err) {
                return done(err);
            }
            expect(result).to.contain(`_elementOpen('h1', null, null, 'class', (data.h1Class));`);
            expect(result).to.contain(`_text('Hello');`);
            expect(result).to.contain(`_elementClose('h1');`);
            done();
        });
    });

});
