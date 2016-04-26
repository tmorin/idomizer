import {join} from 'path';
import idomizerify from '../../src/plugins/idomizerify.js';
import {runTransform} from 'browserify-transform-tools';
import {expect} from 'chai';

describe('idomizerify', () => {

    it('should convert an idomizer file into a string function', (done) => {
        let dummyJsFile = join(__dirname, 'plugins/dummy.idomizer');
        let content = `<h1 class="{{data.h1Class}}">Hello</h1>`;
        runTransform(idomizerify, dummyJsFile, {content}, (err, result) => {
            /* istanbul ignore if  */
            if (err) {
                return done(err);
            }
            expect(result).to.contain(`o('h1', null, null, 'class', (data.h1Class));`);
            expect(result).to.contain(`t('Hello');`);
            expect(result).to.contain(`c('h1');`);
            done();
        });
    });

});
