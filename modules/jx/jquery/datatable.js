juse.import("jquery").define("datatable", function($jquery){
	this.context.property("datatable#home", "https://cdn.datatables.net/1.10.18");
	juse.import("#jQuery.fn.DataTable; ${datatable#home}/js/jquery.dataTables.min.js");
	juse.import(".css; ${datatable#home}/css/jquery.dataTables.min.css");

	juse.export(function datatable(node){
		$jquery(node).find("[data-datatable]").dataTable();
	});
});
