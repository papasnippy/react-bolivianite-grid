import * as  gts from 'gulp-typescript';
import * as sourcemaps from 'gulp-sourcemaps';
const gulp = require('gulp');

const tsCommonjs = gts.createProject('tsconfig.json', { declaration: true, allowJs: false });
const tsModule = gts.createProject('tsconfig.json', { module: 'es2015', target: 'es6' });

function createBuild(type: 'cjs' | 'es') {
    gulp.task(`build::${type}`, () => {
        return gulp
            .src([`src/**/*.ts`, `src/**/*.tsx`])
            .pipe(sourcemaps.init())
            .pipe(type === 'cjs' ? tsCommonjs() : tsModule())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(`build${type === 'es' ? '/__es_module' : ''}`));
    });
}

gulp.task(`copy`, () => {
    return gulp
        .src(['./package.json', './LICENSE'])
        .pipe(gulp.dest('build'));
});

createBuild('cjs');
createBuild('es');

gulp.task('default', ['build::cjs', 'build::es', 'copy']);
