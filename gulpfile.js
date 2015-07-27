var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    eslint = require('gulp-eslint');

gulp.task('lint', function () {
    return gulp.src(['src/**/*.es6'])
        .pipe(eslint())
        .pipe(eslint.format());
        // .pipe(eslint.failOnError());
});

gulp.task('dist', function () {
    return gulp.src('src/**/*.es6')
        .pipe(sourcemaps.init())
        .pipe(babel())
        .pipe(concat('tiForms.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist'));
});

gulp.task('minify', function () {
    return gulp.src('src/**/*.es6')
        .pipe(babel())
        .pipe(concat('tiForms.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['dist'], function () {
    var watcher = gulp.watch('./src/**/*.js', ['dist']);
    watcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', building scripts...');
    });
});

gulp.task('default', ['lint', 'dist', 'watch']);
