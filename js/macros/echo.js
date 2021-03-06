/*\
title: js/macros/echo.js

\*/
(function(){

/*jslint node: true */
"use strict";

var Renderer = require("../Renderer.js").Renderer;

exports.macro = {
	name: "echo",
	params: {
		text: {byPos: 0, type: "text"}
	},
	execute: function() {
		return [Renderer.TextNode(this.params.text)];
	}
};

})();
