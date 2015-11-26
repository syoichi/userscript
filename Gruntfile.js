/* jshint node: true, browser: false */
'use strict';

module.exports = function createGruntConfig(grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      node: {
        files: {
          src: 'Gruntfile.js'
        }
      },
      userscript: {
        files: {
          src: 'src/*.js'
        }
      }
    },
    jscs: {
      node: {
        files: {
          src: 'Gruntfile.js'
        },
        options: {
          config: '.jscs.json'
        }
      },
      userscript: {
        files: {
          src: 'src/*.js'
        },
        options: {
          config: '.jscs.json',
          maximumLineLength: {
            value: 80,
            allowComments: true
          },
          requireCamelCaseOrUpperCaseIdentifiers: null
        }
      }
    },
    eslint: {
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
      },
      userscript: {
        files: {
          src: 'src/*.js'
        },
        options: {
          rules: {
            camelcase: 0,
            'object-shorthand': 0,
            'max-len': [2, 80, 2, {
              ignoreUrls: true,
              ignoreComments: true
            }]
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
