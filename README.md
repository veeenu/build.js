# build.js

Yet another minimal parallel build system / task runner for Javascript.
I decided to roll my own because I don't need all the bells and whistles
from Grunt, Gulp and friends and needed to do away with the clutter
from all the build files lying around. Configuration is done in the
`package.json`. Example:

```
"buildjs": {
  "server": {
    "cwd": "server/",
    "env": {
      "public": "www",
      "host": "0.0.0.0",
      "port": 8080
    },
    "run": [
      "supervisor app.js"
    ],
    "tasks": [
      "watch-web"
    ]
  },
  "watch-web": {
    "run": [
      "browserify dev/app.js -o server/www/build.js",
      "jade dev/index.jade -o server/www",
      "stylus dev/style.styl -o server/www"
    ]
  }
}
```

