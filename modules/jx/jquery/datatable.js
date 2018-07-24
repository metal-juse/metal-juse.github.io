juse(".classifier", ["jquery"], function datatable($jquery){
	this.context.property("datatable#home", "https://cdn.datatables.net/1.10.18");
	this.context.juse(["#jQuery.fn.DataTable; ${datatable#home}/js/jquery.dataTables.min.js"]);
	this.context.juse([".css; ${datatable#home}/css/jquery.dataTables.min.css"]);

	return function datatable(node){
		$jquery(node).find("[data-datatable]").dataTable();
	};
});
