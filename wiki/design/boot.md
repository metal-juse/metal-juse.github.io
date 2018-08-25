# [<<](..) App Bootstrapping

* One module among all app modules is the app bootstrap entrypoint.
* App is bootstrapped by a script tag in the app homepage html.
    * `<script src="url/to/juse.js" data-app="main"></script>`
* The `juse` bootstrap script can be one of the variants such as `juse.js`, `juse-up.js` or `juse-up.min.js`.
* The script tag attribute `data-app` declares the bootstrap entrypoint or the main module spec.
* One global function `define` is defined and aliased to `juse`.
* The bootstrap process loads the main module, as well as all dependent modules.
* The main module value is then converted and added to the document body.
* `juse` can load module scripts asynchronously if the loading browser supports the [async][] mode.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("hello", "hello juse!");
</script>
```

At line 2 is the script tag loading the bootstrapping `juse` script and declaring the main module `hello`, and at line 4 is the global function `define` defines the main module `hello`.

The example code is executed in this page, and it produces the following result.

<section>
<link href="boot.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("hello", "hello juse!");
</script>
</section>

[async]: https://www.w3schools.com/tags/att_script_async.asp
