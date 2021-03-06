/*\
title: js/FileRetriever.js

FileRetriever can asynchronously retrieve files from HTTP URLs or the local file system. Files are treated as utf-8 text or, if the filepath ends in one of the recognised binary extensions, as a base64 encoded binary string

\*/
(function(){

/*jslint node: true */
"use strict";

var fs = require("fs"),
	path = require("path"),
	url = require("url"),
	util = require("util"),
	http = require("http"),
	https = require("https");

var FileRetriever = exports;

// These are the file extensions that we'll recognise as binary.
FileRetriever.binaryFileExtensions = [".jpg",".jpeg",".png",".gif"];

// Retrieve a local file and invoke callback(err,data) in the usual way
var fileRequest = function fileRequest(filepath,callback) {
	fs.readFile(filepath, function (err,data) {
		if(err) {
			callback(err); 
		} else {
			// Check if we need to base64 encode the file
			if(FileRetriever.binaryFileExtensions.indexOf(path.extname(filepath)) !== -1) {
				callback(err,data.toString("base64"));
			} else {
				callback(err,data.toString("utf8"));
			}
		}
	});
};

// Retrieve a file over HTTP and invoke callback(err,data) in the usual way
var httpRequest = function(fileurl,callback) {
	var opts = url.parse(fileurl),
		httpLib = opts.protocol === "http:" ? http : https,
		encoding = (FileRetriever.binaryFileExtensions.indexOf(path.extname(fileurl)) !== -1) ? "binary" : "utf8";
	var request = httpLib.get(opts,function(res) {
		if(res.statusCode != 200) {
			var err = new Error("HTTP error");
			err.code = res.statusCode.toString();
			callback(err);
		} else {
			var data = [];
			res.setEncoding(encoding);
			res.on("data", function(chunk) {
				data.push(chunk);
			});
			res.on("end", function() {
				if(encoding === "binary") {
					callback(null,(new Buffer(data.join(""),"binary")).toString("base64"));
				} else {
					callback(null,data.join(""));
				}
			});
		}
	});
	request.addListener("error", function(err) {
		callback(err);
	});
	request.end();
};

// Retrieve a file given a filepath specifier and a base directory. If the filepath isn't an absolute
// filepath or an absolute URL, then it is interpreted relative to the base directory, which can also be
// a local directory or a URL. On completion, the callback function is called as callback(err,data). The
// data hashmap is as follows:
//		text: full text of file
//		path: full path used to reach the file
//		basename: the basename of the file
//		extname: the extension of the file
FileRetriever.retrieveFile = function(filepath,baseDir,callback) {
	var httpRegExp = /^(https?:\/\/)/gi,
		result = {},
		filepathIsHttp = httpRegExp.test(filepath),
		baseDirIsHttp = httpRegExp.test(baseDir),
		requester;
	if(baseDirIsHttp || filepathIsHttp) {
		// If we've got a full HTTP URI then we're good to go
		result.path = url.resolve(baseDir,filepath);
		var parsedPath = url.parse(result.path);
		result.extname = path.extname(parsedPath.pathname);
		result.basename = path.basename(parsedPath.extname);
		requester = httpRequest;
	} else {
		// It's a file requested in a file context
		result.path = path.resolve(baseDir,filepath);
		result.extname = path.extname(result.path);
		result.basename = path.basename(result.path,result.extname);
		requester = fileRequest;
	}
	requester(result.path,function(err,data) {
		if(!err) {
			result.text = data;
		}
		callback(err,result);
	});
};

})();
