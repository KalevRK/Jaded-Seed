var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');

// Linting
var jshint = require('gulp-jshint');
var jshintConfig = require('./package.json').jshintConfig;
jshintConfig.lookup = false;

// Client-side Module Use
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

// Compilation
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var jade = require('gulp-jade');

// Concat and Minify
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minifyCSS = require('gulp-minify-css');

// String replacement
var replace = require('gulp-replace');

// Testing
var mochaPhantomJS = require('gulp-mocha-phantomjs');

// Paths
var Path = {
  CLIENT_JS: 'client/js/**/*.js',
  ENTRY_POINT: 'client/js/app.js',
  SCSS: 'client/styles/**/*.scss',
  JADE: 'client/templates/**/*.jade',
  SPEC_JS: 'specs/client/spec.js',
  SPEC_RUNNER: 'specs/client/specRunner.html',
  DIST_SRC: 'dist/src',
  DIST_BUILD: 'dist/build',
  TEST_BUILD: 'specs/build'
};

// *********************
// * DEVELOPMENT TASKS *
// *********************

// Lint client javascript files
gulp.task('jshint-client', function() {
  return gulp.src(Path.CLIENT_JS)
    .pipe(jshint(jshintConfig))
    .pipe(jshint.reporter('jshint-stylish'));
});

// Lint test spec javascript files
gulp.task('jshint-test', function() {
  return gulp.src(Path.SPEC_JS)
    .pipe(jshint(jshintConfig))
    .pipe(jshint.reporter('jshint-stylish'));
});

// Browserify client javascript files
gulp.task('browserify-client', ['jshint-client'], function() {
  var b = browserify({
    entries: Path.ENTRY_POINT,
    debug: true
  });

  return b.bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(sourcemaps.write())
    .pipe(rename('build.js'))
    .pipe(gulp.dest(Path.DIST_SRC));
});

// Browserify test spec javascript files
gulp.task('browserify-test', ['jshint-test'], function() {
  var b = browserify({
    entries: Path.SPEC_JS,
    debug: true
  });

  return b.bundle()
    .pipe(source('spec.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write())
    .pipe(rename('client-spec.js'))
    .pipe(gulp.dest(Path.TEST_BUILD));
});

// Compile Jade template files into HTML files
gulp.task('compile-jade', function() {
  return gulp.src(Path.JADE)
    .pipe(jade())
    .pipe(gulp.dest(Path.DIST_SRC));
});

// Compile SCSS files into CSS files
gulp.task('compile-scss', function() {
  return gulp.src(Path.SCSS)
    .pipe(sourcemaps.init())
      .pipe(sass())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(Path.DIST_SRC));
});

// Run mocha on client test specs
gulp.task('test', ['browserify-test'], function() {
  return gulp.src(Path.SPEC_RUNNER)
    .pipe(mochaPhantomJS());
})

// ***************
// * BUILD TASKS *
// ***************

// Uglify JS file
gulp.task('uglify', ['browserify-client'], function() {
  return gulp.src(Path.DIST_SRC + '/build.js')
    .pipe(uglify())
    .pipe(rename('build.min.js'))
    .pipe(gulp.dest(Path.DIST_BUILD));
});

// Concat and Minify CSS files
gulp.task('minify', ['compile-scss'], function() {
  return gulp.src(Path.DIST_SRC + '/**/*.css')
    .pipe(concat('styles.css'))
    .pipe(minifyCSS())
    .pipe(rename('styles.min.css'))
    .pipe(gulp.dest(Path.DIST_BUILD));
});

// Copy index.html file to build path and replace references to JS and CSS files
gulp.task('move-html', ['compile-jade'], function() {

  return gulp.src(Path.DIST_SRC + '/index.html')
    .pipe(replace('styles.css', 'styles.min.css'))
    .pipe(replace('build.js', 'build.min.js'))
    .pipe(gulp.dest(Path.DIST_BUILD));
});

// Watch client and test files for changes
gulp.task('watch', function() {
  gulp.watch(Path.CLIENT_JS, ['browserify-client', 'test']);
  gulp.watch(Path.SPEC_JS, ['browserify-test', 'test']);
  gulp.watch(Path.JADE, ['move-html']);
  gulp.watch(Path.SCSS, ['compile-scss']);
});

gulp.task('build', ['uglify', 'minify', 'move-html']);

gulp.task('default', ['test', 'build', 'watch']);
