import {join} from 'path';
import {readFileSync, unlinkSync} from 'fs';
import webpack from 'webpack';
import {expect} from 'chai';

/* istanbul ignore next */
xdescribe('idomizer-loader', () => {
    let context = join(__dirname, '../../'),
        outputFilename = 'idomizer-loader.result',
        output = join(context, outputFilename);

    after(() => {
        if (existsSync(output)) {
            unlinkSync(output);
        }
    });

    it('should convert an idomizer file into a string function', (done) => {
        console.log('context %s', context);
        webpack({
            context: context,
            entry: ['test/plugins/dummy'],
            output: {
                path: context,
                filename: outputFilename
            },
            module: {
                loaders: [
                    {test: /\.idomizer$/, loader: 'idomizer-loader'}
                ]
            },
            resolveLoader: {
                root: join(context)
            }
        }, (err, stats) => {
            if (err) {
                done(err);
            }
            try {
                let result = readFileSync(output, 'utf8');
                expect(result).to.contain(`o('h1', null, null, 'class', (data.h1Class));`);
                expect(result).to.contain(`t('Hello');`);
                expect(result).to.contain(`c('h1');`);
            } catch (e) {
                done(e);
            }
            done();
        });
    });

});
