/* jshint node: true, browser: false */
'use strict';

module.exports = function createGruntConfig(grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      userscript: {
        files: {
          src: 'src/*.js'
        }
      },
      node: {
        files: {
          src: 'Gruntfile.js'
        }
      }
    },
    jscs: {
      userscript: {
        files: {
          src: 'src/*.js'
        },
        options: {
          config: '.jscsrc',
          maximumLineLength: {
            value: 80,
            allowComments: true
          },
          requirePaddingNewLinesInObjects: null
        }
      },
      node: {
        files: {
          src: 'Gruntfile.js'
        },
        options: {
          config: '.jscsrc'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.registerTask('default', ['jshint', 'jscs']);
};
