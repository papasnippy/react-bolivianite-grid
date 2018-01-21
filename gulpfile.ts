/**
 * THIS FILE SHOULD BE REWRITTEN!
 */
import * as  gts from 'gulp-typescript';
import * as sourcemaps from 'gulp-sourcemaps';
const gulp = require('gulp');

const tsCommonjs = gts.createProject('tsconfig.json', { declaration: true });
const tsModule = gts.createProject('tsconfig.json', { module: 'es6', target: 'es6' });

function createBuild(type: 'cjs' | 'es') {
    gulp.task(`build::${type}`, () => {
        return gulp
            .src([`src/**/*.ts`, `src/**/*.tsx`])
            .pipe(sourcemaps.init())
            .pipe(type === 'cjs' ? tsCommonjs() : tsModule())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(`build${type === 'es' ? '/es' : ''}`));
    });
}

gulp.task(`package.json`, () => {
    return gulp
        .src(['./package.json'])
        .pipe(gulp.dest('build'));
});

gulp.task(`scss`, () => {
    return gulp
        .src(['./src/**/*.scss'])
        .pipe(gulp.dest('build'))
        .pipe(gulp.dest('build/es'));
});

createBuild('cjs');
createBuild('es');

gulp.task('default', ['build::cjs', 'build::es', 'package.json', 'scss']);
