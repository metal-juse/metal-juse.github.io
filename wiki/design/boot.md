# [<<](..) App Bootstrapping

* One module among all app modules is the app **main** module.
* App is bootstrapped by a script tag in the app hosting html.
    * `<script src="url/to/juse.js" data-app="main"></script>`
* The script tag loads the **juse** bootstrap script.
* The script tag attribute `data-app` declares the **main** module.
* The bootstrap script defines global function `define`.
* The bootstrap script loads the **main** module, as well as all dependent modules.
* The **main** module value is then added to the document body.
* **juse** can load module scripts asynchronously if the loading browser supports the [async][] mode.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("hello", "Hello World!");
</script>
```

At line 2, the script tag loads the **juse** bootstrap script and declares the **main** module `hello`.

At line 4, the global function `define` defines the **main** module `hello`.

The code is executed right here in this page with the following result.
The code can also be copy/pasted into a standalone html file, and then can be opened in a browser with the same result.

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("hello", "Hello World!");
</script>
</section>

[async]: https://www.w3schools.com/tags/att_script_async.asp
