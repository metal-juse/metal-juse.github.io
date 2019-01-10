juse(["promise"], function(promise){

	function resolve(value) {
		return promise(function(resolve, reject){
			setTimeout(function(){
				resolve(value);
			});
		});
	}

	function reject(reason) {
		return promise(function(resolve, reject){
			setTimeout(function(){
				reject(reason);
			});
		});
	}

	function p_resolve(value) {
		return new Promise(function(resolve, reject){
			setTimeout(function(){
				resolve(value);
			});
		});
	}

	function p_reject(reason) {
		return new Promise(function(resolve, reject){
			setTimeout(function(){
				reject(reason);
			});
		});
	}

	resolve("done").then(function(value){
		juse.log('--------1 value: ', value);
		return resolve('--1 value is: ' + value);
	}, function(reason){
		juse.log('--------1 reason: ', reason);
		return reject('--1 reason is: ' + reason);
	}).then(function(value){
		juse.log('--------2 value: ', value);
		return resolve('--2 value is: ' + value);
	}, function(reason){
		juse.log('--------2 reason: ', reason);
		return reject('--2 reason is: ' + reason);
	});

	p_resolve("done").then(function(value){
		juse.log('========1 value: ', value);
		return p_resolve('==1 value is: ' + value);
	}, function(reason){
		juse.log('========1 reason: ', reason);
		return p_reject('==1 reason is: ' + reason);
	}).then(function(value){
		juse.log('========2 value: ', value);
		return p_resolve('==2 value is: ' + value);
	}, function(reason){
		juse.log('========2 reason: ', reason);
		return p_reject('==2 reason is: ' + reason);
	});

});
