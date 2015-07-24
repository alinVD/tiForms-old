module.exports = (grunt) ->

    require('time-grunt')(grunt)

    watchFiles =
        main: ['build/module.js']
        directives: ['build/directives/*.js']
        css: ['src/css/*.css']

    # Project configuration.
    grunt.initConfig
        browserify: 
            dist:
                files: [{
                    expand: true
                    cwd:  'src/js'
                    src:  ['**/*.es6']
                    dest: 'build'
                    ext:  '.js'
                }]
            options:
                transform: ['babelify']

        uglify:
            build:
                files: [{
                    src: watchFiles.main.concat watchFiles.directives
                    dest: 'dist/tiForms.min.js'
                }]

        ngAnnotate:
            options:
                singleQuotes: true

            tiForms:
                files:
                    'dist/tiForms.js': watchFiles.main.concat watchFiles.directives

        concat_css:
            all:
                src: watchFiles.css
                dest: "dist/styles.css"

        jshint:
            all:
                src: watchFiles.main.concat watchFiles.directives
                options:
                    jshintrc: true

        babel:
            options:
                sourceMap: true
            all:
                files: [{
                    expand: true
                    cwd:  'src/js'
                    src:  ['**/*.es6']
                    dest: 'build'
                    ext:  '.js'
                }]

    # Tasks to load.
    grunt.loadNpmTasks 'grunt-contrib-uglify'
    grunt.loadNpmTasks 'grunt-contrib-jshint'
    grunt.loadNpmTasks 'grunt-ng-annotate'
    grunt.loadNpmTasks 'grunt-concat-css'
    grunt.loadNpmTasks 'grunt-babel'
    grunt.loadNpmTasks 'grunt-browserify'

    # Default task(s).
    grunt.registerTask 'default', ['babel']
    grunt.registerTask 'build', ['default', 'browserify', 'uglify', 'concat_css', 'ngAnnotate']
