An example ([tile-tree][]) to demonstrate how to use module `tile@juse/ui` and `widget@juse/ui` to render interactive tree structured content.

* [main.html][]
: A module with tree structured content that contains 3 replacement tags that name the tile module [app/tree.html][], indicated by attribute `data-tag=app/tree`.

* [app/tree.html][]
: A tile module with template content to implement a simple tree structure UI, which contains a replacement macro `${label}` and a nameless replacement tag `data-tag`. Content of both constructs will be supplied by the requesting module [main.html][], and replacement to be applied by module `tile@juse/ui`.

* [app/tree][]
: Module that implements simple interactive behavior on a tree structure, applied to the tree content by module `widget@juse/ui`.

[tile-tree]:		https://metal-juse.github.io/examples/tile-tree/
[main.html]:		https://raw.githubusercontent.com/metal-juse/metal-juse.github.io/master/examples/tile-tree/static/main.html
[app/tree.html]:	https://raw.githubusercontent.com/metal-juse/metal-juse.github.io/master/examples/tile-tree/static/app/tree.html
[app/tree]:			https://raw.githubusercontent.com/metal-juse/metal-juse.github.io/master/examples/tile-tree/modules/app/tree.js
