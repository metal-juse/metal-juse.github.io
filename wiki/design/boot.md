# [App Bootstrapping](..)

* **juse** powered app is bootstrapped by a script tag in the hosting html.
    * For example, `<script src="url/to/juse.js" data-app="main"></script>`
    * The tag attribute `src` points to the **juse** bootstrap script url.
    * The tag attribute `data-app` declares the app **main** module (or the app entry point).
* The script tag loads the **juse** bootstrap script.
* The bootstrap script defines the global top-level module `juse` with public methods (including `import` and `define`).
    * `import` for loading dependencies.
    * `define` for defining modules.
* The bootstrap script then loads the app **main** module, as well as any dependent modules.
* **juse** loads module sources asynchronously if the loading browser supports the script tag [async][] attribute.

Example:

```html
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
juse.define("hello", "Hello World!");
</script>
```

At line 2, the script tag loads the **juse** bootstrap script and declares the app **main** module as `hello`.

At line 4, method `juse.define` is called to define the **main** module `hello`, its value as `Hello World!`.

The code can be copy/pasted into a standalone html file and opened in a browser.
The exact code is also executed right here on this page, with the **main** module value to be seen as:

<section>
<link href="http://metal-juse.github.io/css/example.css" rel="stylesheet"/>
<script src="http://metal-juse.github.io/juse-up.min.js" data-app="hello"></script>
<script>
juse.define("hello", "Hello World!");
</script>
</section>

[AMD]:		https://github.com/amdjs/amdjs-api/wiki/AMD (Asynchronous Module Definition)
[async]:	https://www.w3schools.com/tags/att_script_async.asp
