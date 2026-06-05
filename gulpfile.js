const gulp = require('gulp')
const less = require('gulp-less')
const babel = require('gulp-babel')
const autoprefixer = require('gulp-autoprefixer')
const connect = require('gulp-connect')
const pug = require('gulp-pug')
const del = require('del')

// Minification (use only for production build)
const minifycss = require('gulp-clean-css')
const uglify = require('gulp-uglify')
const htmlmin = require('gulp-htmlmin')
const htmlclean = require('gulp-htmlclean')
const cssnano = require('gulp-cssnano')

const config = require('./config.json')
const PRODUCTION = process.env.NODE_ENV === 'production'

gulp.task('clean', function () {
	return del(['./dist/css/', './dist/js/', './dist/index.html'])
})

gulp.task('css', function () {
	let stream = gulp
		.src('./src/css/*.less')
		.pipe(less().on('error', function(err) {
			console.log(err);
			this.emit('end');
		}))
		.pipe(autoprefixer({ overrideBrowserslist: ['last 2 version'] }))

	if (PRODUCTION) {
		stream = stream
			.pipe(minifycss({ compatibility: 'ie8' }))
			.pipe(cssnano({ reduceIdents: false }))
	}

	return stream.pipe(gulp.dest('./dist/css'))
})

gulp.task('html', function () {
	let stream = gulp
		.src('./dist/index.html')

	if (PRODUCTION) {
		stream = stream
			.pipe(htmlclean())
			.pipe(htmlmin())
	}

	return stream.pipe(gulp.dest('./dist'))
})

gulp.task('js', function () {
	let stream = gulp
		.src('./src/js/*.js')
		.pipe(babel({ presets: ['@babel/preset-env'] }))

	if (PRODUCTION) {
		stream = stream.pipe(uglify())
	}

	return stream.pipe(gulp.dest('./dist/js'))
})

gulp.task('pug', function () {
	return gulp
		.src('./src/index.pug')
		.pipe(pug({ data: config, pretty: !PRODUCTION }))
		.pipe(gulp.dest('./dist'))
})

gulp.task('assets', function () {
	return gulp
		.src(['./src/assets/**/*'])
		.pipe(gulp.dest('./dist/assets'));
})

gulp.task('build', gulp.series('clean', 'assets', 'pug', 'css', 'js', 'html'))
gulp.task('default', gulp.series('build'))

gulp.task('watch', function () {
	gulp.watch('./src/components/*.pug', gulp.parallel('pug'))
	gulp.watch('./src/index.pug', gulp.parallel('pug'))
	gulp.watch('./src/css/**/*.scss', gulp.parallel(['css']))
	gulp.watch('./src/js/*.js', gulp.parallel(['js']))
	connect.server({
		root: 'dist',
		livereload: true,
		port: 8080
	})
})
