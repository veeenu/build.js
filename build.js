#!/usr/bin/env node

const exec = require('child_process').exec,
      fs   = require('fs'),
      path = require('path'),
      conf = (function() {
        var dir   = process.cwd(),
            files, ret = null;

        while(dir !== '/' && ret === null) {
          files = fs.readdirSync(dir);

          if(!files.indexOf('package.json'))
            dir = path.dirname(dir);
          else
            ret = require(path.join(dir, '/package.json')).buildjs || {};
        }

        if(ret !== null) for(var i in ret) {
          var task = ret[i];

          if(task instanceof Array) {
            ret[i] = { run: task };
          } else if(typeof task === 'string') {
            ret[i] = { run: [task] };
          }
        
        }

        return ret || {};
      }());

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
      trim(data).split(/\n/).forEach(line => console.log(`[${C1 + cid + C0}] ${line}`));
    });

    child.stderr.on('data', (data) => {
      trim(data).split(/\n/).forEach(line => console.log(`[${C3 + cid + C0}] ${line}`));
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
  if(o.indexOf(i) === -1 && i in conf) {
    o.push(i);
    //console.log(i, conf);
    ('tasks' in conf[i] ? conf[i].tasks : []).forEach(function(j) {
      o.push(j);
    });
  }

  return o;

}, []);

tasks.forEach(function(i) {
  var task = conf[i];

  if(!task) return;

  var mEnv = {};

  Object.assign(mEnv, process.env);
  Object.assign(mEnv, task.env || {});

  task.run.forEach(function(t) {
    children.push(runCmd(t, {
      cwd: task.cwd,
      env: mEnv
    }));
  });
});

process.on('SIGINT', () => {
  children.forEach((i) => {
    i.kill();
  });
  console.log(`[${C1}*${C0}] Interrupted`);
});
