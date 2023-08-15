function regex(str) {
	return new RegExp(str, 'gm');
}



function type_except(type){

	var format = "(?!.*"+type+")";
	//(?!.*排除的字符串)
	 
	return format;
	
}

function type_keyword(){

var format = "[^(public|private|function|)]";



}


function type_expresion() {
	var format = "([^ ]+) ([^ ]+) = ([^ ]+);";
	 
	return format;
}

function type_format(type) {
	var format = {"Int": "int", "Double": "double", "Float": "float", "Bool": "boolean", "Long": "long"};
	if(type in format) {
		return format[type];
	}
	return type;
}




function type_expr(type) {
	var format = {"int": "0", "double": "0.0", "float": "0.0", "boolean": "false", "long": "0", "String": "\"\""};

  
	return format[type];
}



function expr_format(expr) {
 




	if (isNaN(Number(expr))){
		return "new " + expr;
	}
 



	return expr;
}

function type_params(params) {
	//var pattern = regex("(.*)\\s+(.*)");

	if (params == ""){
		return "";
	}

	var pattern = regex("[_\s]{0,}([^\s]+):\s{0,}([^\s]+)")

	if (params.includes(',')) {
		var params = params.split(',');
		params.forEach(function (item, idx) {
			item = item.trim();
			params[idx] = item.replace(pattern,  function(all, name, type){
				//return "_ "+name+": "+type_format(type);
				return type_format(type) + " " + name;
			});
		});
	}
	else{
		params = params.replace(pattern,  function(all, name, type){
			//return "_ "+name+": "+type_format(type);
			return type_format(type) + " " + name;
		});
	}
	return params;
}

function convert() {
	var from = document.getElementById("from");
	var to = document.getElementById("to");
	
	var source = from.value;
	var pattern;
	
	//查找类名
	var class_name = "";
	var new_class_name = "";
	//class\s{0,}(.+?)\s{0,}\:\s{0,}(.+?)\s{0,}(\,{0,}\s{0,}(.+?)\s{0,}){0,}\{
	var reg_class = "class";
	var reg_space = "\\s{0,}";
	var reg_word = "(.+?)";
	var reg_class_split = "\\:";
	var reg_class_name = reg_class + reg_space + reg_word + reg_space;
	var reg_base_name = reg_class_split + reg_space + reg_word + reg_space;
	var reg_pattern = reg_class_name + reg_base_name + "\\{";
	//查找基类
	var base_name = "";
	//pattern = regex(reg_pattern); 
	match = source.match(reg_pattern);

	if (match.length > 0){
		class_name = match[1];
	} 
	if (match.length > 2){
		base_name = match[2];
		
		if (match[2].includes(",")){

			base_name_arr = match[2].split(",");
			base_name = base_name_arr[0];
			new_class_name = "public " + class_name + " " + "extends " + base_name;
			new_class_name += " implements ";
			var i = 0;
			for (i = 1 ; i < base_name_arr.length - 1 ; i++){
				
				new_class_name += "\r\n" + base_name_arr[i] + " , "
			}
			new_class_name += "\r\n" + base_name_arr[i] + "{";
		}
		else{

			new_class_name = "public " + class_name + " " + "extends" + base_name;
		}
	}
  	if (new_class_name != ""){
		source = source.replace(match[0], new_class_name);
	}

	 
	//更改self->this 
	pattern = regex("self\\.");
	source = source.replace(pattern, "this.");
	
	//更改nil->null
	pattern = regex("nil");
	source = source.replace(pattern, "null");
	

	//更改变量声明
	//带有private关键字
	//分配
	pattern = regex("var\\s+([^\\s]+)\\s{0,}\\:\\s{0,}([^\\s]+)[?!]{0,}\\s{0,}=\\s{0,}([^\\s]+);{0,}");
	source = source.replace(pattern,  function(all,name,type, expr){
		//return 'var '+name+" : "+type_format(type)+" = "+expr+";";
		exprStr = expr_format(expr.replace(regex([";"]),"")) + "";
		return type_format(type) +  " " + name + " = " +  (exprStr.includes(";") ? exprStr : exprStr + ";");
	});




	//没有分配
	pattern = regex("var\\s+([^\\s]+)\\s{0,}\\:\\s{0,}([^\\s]+)[?!]{0,}[;]{0,}");
	source = source.replace(pattern,  function(all,name, type){
		//return "var "+name+": "+type_format(type)+" = "+type_expr(type)+";";
		return type_format(type).replace(regex("[?!;]{0,}"),"") +  " " +  name + ";";
	});

 
	

	//更改for循环结构
	//for\s+([^\s]+)\s+in\s+([^\s]+)\s+..<\s+([^\s]+)
	pattern = regex("for\\s+([^\\s]+)\\s+in\\s+([^\\s]+)\\s+..<\\s+([^\\s]+)");
	source = source.replace(pattern,  function(all, name , range, tail){
		return "for (int " + name +" = "+ range + " ; " + name +" < "+ tail + " ; " + name + "++)";
	});


	//更改构造函数
	//"(public\s+|private\s+|protected\s+|){0,}init\((.*?)\)\s*{"
	pattern = regex("(public\\s+|private\\s+|protected\\s+|){0,}init\\s{0,}\\((.*?)\\)\\s*{");
	source = source.replace(pattern,  function(all, t, params){

		if (t == undefined){
			t = "public";
		}
		return  t  + " " + class_name + "("+type_params(params)  + "){";
	});

	

	//更改函数参数
	//"(public\s+|private\s+|protected\s+|){0,}func\s+([^\s]+)\((.*?)\)\s{0,}(->){0,}\s{0,}([^\s]+){0,}\s*{"
	pattern = regex("(public\\s+|private\\s+|protected\\s+|){0,}func\\s+([^\\s]+)\\((.*?)\\)\\s{0,}(->){0,}\\s{0,}([^\\s]+){0,}\\s*{");
	source = source.replace(pattern,  function(all, t, name, params,c,type){
		var rtn_type = "";

 
		if(type != undefined) {
			rtn_type = type_format(type);
		}

		if(rtn_type == ""){
			rtn_type = "void"
		}


		if (t == undefined){
			t = "public";
		}

		return t + " " + rtn_type + " " + name + "("+type_params(params)  + "){";
	});

 
	to.value = source.trim();
}
