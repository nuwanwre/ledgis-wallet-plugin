const gulp = require('gulp');
const babel = require('gulp-babel');

gulp.task('babel', () => {
    gulp.src('src/*.js')
        .pipe(babel({
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-class-properties']
        }))
        .pipe(gulp.dest('dist'));
})