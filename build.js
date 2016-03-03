#!/usr/bin/env node

const exec = require('child_process').exec,
      fs   = require('fs'),
      path = require('path'),
      conf = (function() {
        var dir   = process.cwd(),
            files;

        while(dir !== '/') {
          files = fs.readdirSync(dir);

          if(!files.indexOf('package.json'))
            dir = path.dirname(dir);
          else
            return require(path.join(dir, '/package.json'));
        }

        return { buildjs: null };
      }()).buildjs || {};

const C0 = '\033[0m',
      C1 = '\033[1;34m',
      C2 = '\033[1;32m',
      C3 = '\033[1;31m';

const runCmd = (function() {

  var id = 0, trim = function(s) { return !!s? s.toString().replace(/^\s+|\s+$/g, '') : null; };

  return function(str, opts) {

    var cid   = id++,
        child = exec(str, opts);

    console.log(`[${C1}*${C0}] Process ${cid}: ${C1 + str + C0}`);

    child.stdout.on('data', (data) => {
      console.log(`[${C1 + cid + C0}] ${trim(data)}`);
    });

    child.stderr.on('data', (data) => {
      console.log(`[${C3 + cid + C0}] ${trim(data)}`);
    });

    child.on('close', (data) => {
      console.log(`[${C1 + cid + C0}] Process terminated with code ${C2 + trim(data) + C0}`);
    });

    return child;
  }
}());

var children = [];

process.env.PATH = './node_modules/.bin;' + process.env.PATH;

var tasks = process.argv.splice(2).reduce(function(o, i) {
  if(o.indexOf(i) === -1) {
    o.push(i);
    ('tasks' in conf[i] ? conf[i].tasks : []).forEach(function(j) {
      o.push(j);
    });
  }

  return o;

}, []);

tasks.forEach(function(i) {
  var task = conf[i];

  if(!task) return;

  if(task instanceof Array) {
    task = {
      run: task
    };
  } else if(typeof task === 'string') {
    task = {
      run: [task]
    };
  }

  task.run.forEach(function(t) {
    children.push(runCmd(t, {
      cwd: task.cwd,
      env: task.env
    }));
  });
});

process.on('SIGINT', () => {
  children.forEach((i) => {
    i.kill();
  });
  console.log(`[${C1}*${C0}] Interrupted`);
});
