var fs = require('fs');
var del = require('del');
var gulp = require('gulp');
var less = require('gulp-less');
var spawn = require('child_process').spawn;
var gutil = require('gulp-util');
var watch = require('gulp-watch');
var uglify = require('gulp-uglify');
var plumber = require('gulp-plumber');
var minifycss = require('gulp-minify-css');
var minifyImage = require('gulp-imagemin');

var restart_time = 1500; // 文件变动后1.5秒重启node.js
var color = gutil.colors;
var prec, handler, starting;
var conf = {
    asset: './assets',
    html: {
        path: './views/',
        file: '**/*.html'
    },
    less: {
        from: {
            path: './assets/src/less/',
            file: '**/*.less'
        },
        to: {
            src_path: './assets/src/css/',
            dist_path: './assets/dist/css/',
            file: '**/*.css'
        }
    },
    js: {
        from: {
            path: './assets/src/js/',
            file: '**/*.js'
        },
        to: {
            path: './assets/dist/js/',
            file: '**/*.js'
        }
    },
    img: {
        from: {
            path: './assets/src/img/',
            file: '**/*.*'
        },
        to: {
            path: './assets/dist/img/',
            file: '**/*.*'
        }
    }
};

gulp.task('clean-less', function (cb) {
    if (!fs.existsSync(conf.less.to.src_path)) {
        fs.mkdirSync(conf.less.to.src_path);
    }
    if (!fs.existsSync(conf.less.to.dist_path)) {
        fs.mkdirSync(conf.less.to.dist_path);
    }
    del(conf.less.del, { force: true }).then(function () {
        cb && cb();
    }).catch(function (err) {
        err && console.log(err.stack);
    });
});

gulp.task('less', ['clean-less'], function () {
    if (!fs.existsSync(conf.less.to.src_path)) {
        fs.mkdirSync(conf.less.to.src_path);
    }
    if (!fs.existsSync(conf.less.to.dist_path)) {
        fs.mkdirSync(conf.less.to.dist_path);
    }
    gulp.src(conf.less.from.path + conf.less.from.file)
        .pipe(plumber())
        .pipe(less())
        .pipe(minifycss())
        .pipe(gulp.dest(conf.less.to.src_path))
        .pipe(gulp.dest(conf.less.to.dist_path));
});

gulp.task('clean-js', function (cb) {
    if (!fs.existsSync(conf.js.to.path)) {
        fs.mkdirSync(conf.js.to.path);
    }
    del(conf.js.to.path + conf.js.to.file, { force: true }).then(function () {
        cb && cb();
    }).catch(function (err) {
        err && console.log(err.stack);
    });
});

gulp.task('js', ['clean-js'], function () {
    if (!fs.existsSync(conf.js.to.path)) {
        fs.mkdirSync(conf.js.to.path);
    }
    gulp.src(conf.js.from.path + conf.js.from.file)
        .pipe(plumber())
        .pipe(uglify())
        .pipe(gulp.dest(conf.js.to.path));
});

gulp.task('img', function () {
    gulp.src(conf.img.from.path + conf.img.from.file)
        .pipe(plumber())
        .pipe(minifyImage({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        }))
       .pipe(gulp.dest(conf.img.to.path));
});

gulp.task('start', function(cb) {
    prec = spawn('node', ['app.js']);
    gutil.log('Process is started. Pid: %s', prec.pid);
    prec.stdout.on('data', function(data) {
        console.log(data.toString());
    });
    prec.stderr.on('data', function(data) {
        console.error(data.toString());
    });
    prec.on('close', function(code) {
        gutil.log('Process is closed.');
    });
    cb && cb();
});

gulp.task('stop', function(cb) {
    prec.kill('SIGHUP');
    cb && cb();
});

gulp.task('watch', function() {
    watch(conf.less.from.path + conf.less.from.file, function() {
        gulp.start('less');
    });
    watch(conf.js.from.path + conf.js.from.file, function() {
        gulp.start('js');
    });
    watch(conf.img.from.path + conf.img.from.file, function() {
        gulp.start('img');
    });
    watch([
        conf.less.to.dist_path + conf.less.to.file, 
        conf.js.to.path + conf.js.to.file, 
        conf.img.to.path + conf.img.to.file, 
        conf.html.path + conf.html.file
    ], function() {
        if (starting) {
            gutil.log('Node is starting, please wait for a minute.');
            return;
        }
        if (handler) {
            clearTimeout(handler);
            handler = null;
        }
        handler = setTimeout(function() {
            starting = true;
            gulp.start('stop', function() {
                gulp.start('start', function() {
                    starting = false;
                    handler = null;
                });
            });  
        }, restart_time);
    });
});

gulp.task('default', ['less', 'js', 'img', 'watch', 'start']);