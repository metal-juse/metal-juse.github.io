# [<<](..) App Bootstrapping

* **juse** powered app is bootstrapped by a script tag in the hosting html.
    * `<script src="url/to/juse.js" data-app="main"></script>`
* The script tag loads the **juse** bootstrap script.
    * The attribute `data-app` declares the **main** module (or the app entry point).
* The bootstrap script loads the **main** module, as well as any dependent modules.
* The **main** module value is then applied to the document body.
* The bootstrap script also defines the [AMD][] compliant global function `define`.
* **juse** loads module sources asynchronously if the loading browser supports the [async][] mode.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("hello", "Hello World!");
</script>
```

At line 2, the script tag loads the **juse** bootstrap script and declares the **main** module `hello`.

At line 4, the **main** module `hello` is defined via the global function `define`, and its value is then added to the document body.

The code can be copy/pasted into a standalone html file and opened in a browser.
It is also executed right here, and the **main** module value is:

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
define("hello", "Hello World!");
</script>
</section>

[AMD]:		https://github.com/amdjs/amdjs-api/wiki/AMD (Asynchronous Module Definition)
[async]:	https://www.w3schools.com/tags/att_script_async.asp
