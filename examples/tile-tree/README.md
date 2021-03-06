An [example](example) to demonstrate how to use module `tile@juse/ui` and `widget@juse/ui` to render interactive tree structured content.

* [main.html][]
: A module with tree structured content that contains replacement tags `data-tag=app/tree` that name the tile module [app/tree.html][].

* [app/tree.html][]
: A tile module with template content to implement a simple tree structure UI, which contains a replacement macro `${label}` and a nameless replacement tag `data-tag`. Content of both constructs will be supplied by the requesting module [main.html][], and replacement to be applied by module `tile@juse/ui`.

* [app/tree][]
: Module that implements simple interactive behavior on a tree structure, applied to the tree content by module `widget@juse/ui`.

A similar [example](example-single) with all artifacts in one file.

* [example-single.html][]
: The single html file includes content for `main.html`, `app/tree.html`, and `app/tree`.

[main.html]:			https://raw.githubusercontent.com/metal-juse/metal-juse.github.io/master/examples/tile-tree/static/main.html
[app/tree.html]:		https://raw.githubusercontent.com/metal-juse/metal-juse.github.io/master/examples/tile-tree/static/app/tree.html
[app/tree]:				https://raw.githubusercontent.com/metal-juse/metal-juse.github.io/master/examples/tile-tree/modules/app/tree.js
[example-single.html]:	https://raw.githubusercontent.com/metal-juse/metal-juse.github.io/master/examples/tile-tree/example-single.html
