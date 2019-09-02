const gulp = require('gulp');
const babel = require('gulp-babel');
const webpack = require('webpack');
const path = require('path');

gulp.task('default', () => {
    gulp.start('babel');
});

gulp.task('babel', () => {
    gulp.src('src/*.js')
        .pipe(babel({
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('build',()  => {
    webpack({
        entry: [
            'babel-polyfill',
            path.join(__dirname, 'src/index.js')
        ],
        output: {
            path: path.join(__dirname, 'dist/'),
            filename: 'index.js',
            library: 'ecrx'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    query: {
                        presets: ['@babel/preset-env'],
                        plugins: ['@babel/plugin-proposal-class-properties']

                    }
                },
                {
                    test: /\.json$/,
                    loader: 'json-loader'
                }
            ]
        },
        resolve: {
            extensions: ['.js']
        }
    }).run((err, stat) => {
        if (err) {
            console.log('Error building application - ', err);
            return;
        }
        const statJson = stat.toJson();
        if (statJson.errors.length > 0) {
            console.log('Error building application - ', statJson.errors);
            return;
        }
        console.log('Application built successfully !');
    });
});