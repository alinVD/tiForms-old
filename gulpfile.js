var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    eslint = require('gulp-eslint'),
    typescript = require('gulp-typescript'),
    phantom = require('gulp-phantom');

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
    var watcher = gulp.watch('./src/**/*.es6', ['dist']);
    watcher.on('change', function (event) {
        console.log('File ' + event.path + ' was ' + event.type + ', building scripts...');
    });
});

gulp.task('testing', function() {
    return gulp.src('./testing/testing.ts')
        .pipe(typescript({
            module: 'amd'
        }))
        .pipe(gulp.dest('./testing'));
});

gulp.task('phantom', function() {
    return gulp.src('./testing/testing.js')
        .pipe(gulp.dest('./tmp/'))
        .pipe(phantom({
            ext: '.json'
        }))
        .pipe(gulp.dest('./data/'));
});

gulp.task('default', ['dist', 'watch']);
