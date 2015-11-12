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
          disallowKeywords: ['continue', 'debugger', 'delete', 'void', 'with']
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
    },
    eslint: {
      userscript: {
        files: {
          src: 'src/*.js'
        },
        options: {
          rules: {
            complexity: 0,
            camelcase: 0,
            'no-var': 0,
            'object-shorthand': 0,
            'prefer-arrow-callback': 0,
            'prefer-template': 0,
            'max-len': [2, 80, 2, {
              ignoreUrls: true,
              ignoreComments: true
            }]
          }
        }
      },
      node: {
        files: {
          src: 'Gruntfile.js'
        },
        options: {
          envs: ['node'],
          rules: {
            strict: [2, 'global']
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.registerTask('default', ['jshint', 'jscs', 'eslint']);
};
