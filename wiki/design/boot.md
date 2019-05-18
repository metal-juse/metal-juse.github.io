# [App Bootstrapping](..)

* **juse** powered app is bootstrapped by a script tag in the hosting html.
    * For example, `<script data-main="main" src="url/to/juse.js"></script>`
    * The tag attribute `data-main` declares the **main** module of the app (or the app entry point).
    * The tag attribute `src` points to the **juse** bootstrap script url.
* The script tag loads the **juse** bootstrap script.
* The bootstrap script defines the global top-level module `juse` with public methods, including:
    * `define` to define modules.
    * `import` to declare and load dependencies.
* The bootstrap script then loads the **main** module, as well as any dependent modules.

Example:

```html
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="hello" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>
juse.define("hello", "Hello World!");
</script>
```

At line 2, the script tag declares the **main** module as `hello`, and loads the **juse** bootstrap script.

At line 4, method `juse.define` is called to define the **main** module `hello`, its value as `Hello World!`.

The code can be copy/pasted into a standalone html file and opened in a browser.
The exact code is also executed right here on this page, with the **main** module value to be seen as:

<section>
<link rel="stylesheet" href="http://metal-juse.github.io/css/example.css"/>
<script data-main="hello" src="http://metal-juse.github.io/juse-up.min.js"></script>
<script>
juse.define("hello", "Hello World!");
</script>
</section>
