import {join, normalize} from 'path';
import {createWriteStream, existsSync, unlinkSync} from 'fs';
import {expect} from 'chai';
import browserify  from  'browserify';
import System from 'systemjs';
import pluginIdomizer from '../../src/plugins/systemjs-plugin-idomizer.js';

const htmlparser2Path = 'tmp.htmlparser2.js';

System.config({
    transpiler: 'babel',
    map: {
        'idomizer': 'src/plugins/systemjs-plugin-idomizer.js',
        'htmlparser2': htmlparser2Path
    }
});

describe('systemjs-plugin-idomizer', () => {

    before((done)=> {
        let writer = createWriteStream(normalize(htmlparser2Path));
        writer.on('close', () => {
            done();
        });
        writer.on('error', (err) => {
            done(err);
        });
        browserify(['node_modules/htmlparser2/lib/index.js'], {standalone: 'htmlparser2'}).bundle().pipe(writer);
    });

    after(() => {
        if (existsSync(htmlparser2Path)) {
            unlinkSync(htmlparser2Path);
        }
    });

    it('should convert an idomizer file into a string function', (done) => {
        System.import('test/plugins/dummy.idomizer!idomizer').then(function (factory) {
            let result = factory.toString();
            expect(result).to.contain(`o('h1', null, null, 'class', (data.h1Class));`);
            expect(result).to.contain(`t('Hello');`);
            expect(result).to.contain(`c('h1');`);
            done();
        }, done);
    });

});
