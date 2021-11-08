const { src, dest, watch, series, parallel } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const cssnano = require("cssnano");
const autoprefixer = require("autoprefixer");
const concat = require("gulp-concat");
const terser = require("gulp-terser");
const imagemin = require("gulp-imagemin");
const plumber = require("gulp-plumber");
const pump = require("pump");
const cache = require("gulp-cache");
const del = require("del");
const browserSync = require("browser-sync").create();

const sourceDir = "app/";
const outputDir = "dist/";

// HTMl Task
function markup() {
  return pump([src(sourceDir.concat("*.html")), dest(outputDir)]);
}

// Styles Task
function styles() {
  return pump([
    src(sourceDir.concat("scss/style.scss"), { sourcemaps: true }),
    plumber(function (err) {
      console.log("Styles Task Error: " + err);
      this.emit("end");
    }),
    sass(),
    postcss([cssnano(), autoprefixer()]),
    dest(outputDir.concat("css"), { sourcemaps: "." }),
    browserSync.stream(),
  ]);
}

// Scripts Task
function scripts() {
  return pump([
    src(sourceDir.concat("js/**/*.js"), { sourcemaps: true }),
    plumber(function (err) {
      console.log("Scripts Task Error: " + err);
      this.emit("end");
    }),
    concat("script.js"),
    terser(),
    dest(outputDir.concat("js"), { sourcemaps: "." }),
  ]);
}

// Images Task
function images() {
  return pump([
    src(sourceDir.concat("images/**/*.+(png|jpg|jpeg|gif|svg)")),
    cache(
      imagemin({
        interlaced: true,
      })
    ),
    dest(outputDir.concat("images")),
  ]);
}

// Cleaning Task
async function clean() {
  return Promise.resolve(del.sync("dist"));
}

// Live Update
function browserSyncServe(cb) {
  browserSync.init({
    server: {
      baseDir: outputDir,
    },
  });
  cb();
}

function browserSyncReload(cb) {
  browserSync.reload();
  cb();
}

// Watch Task
function watchTask() {
  watch(sourceDir.concat("*.html"), parallel(markup, browserSyncReload));
  watch(sourceDir.concat("js/**/*.js"), parallel(scripts, browserSyncReload));
  watch(sourceDir.concat("scss/**/*.scss"), parallel(styles, browserSyncReload));
}

// Run task
const build = series(clean, parallel(markup, styles, scripts, images));
exports.build = build;
exports.default = series(markup, styles, scripts, browserSyncServe, watchTask);
