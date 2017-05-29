const ws = require("ws");

const readline = require('readline');
const jsdom_eval = require('./lib/jsdom_wrapper').eval;
const jsdom_launch = require('./lib/jsdom_wrapper').launch;
const level1_prompt = 'JSDOM> ';
const level2_prompt = '...> ';

var url = process.argv[2] || "about:blank";

if(~process.argv.indexOf("-h")){
  console.log("Usage: "+process.argv[1]+" [url]");
  process.exit(1);
}

const config = {
   url: url,
   globals: {
    "console":console,
    "WebSocket": ws
   }
};

jsdom_launch(config);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: level1_prompt,
  completer: function (line){
   try{
     var split = line.split('.');
     var last = split[split.length-1]
     var obj = jsdom_eval(split.slice(0,-1));
     var result_arr = Object.keys(obj);
     result_arr = result_arr.filter((el) => {return el.startsWith(last)});
      return [result_arr,line];
   }catch(exc){
      console.error(exc);
    return [[],line]}
   }
});

rl.prompt();
var code = '';
rl.on('line', (line) => {
  code += line;
  try {
    Function(code);
  } catch (exc) {
    rl.setPrompt(level2_prompt)
    rl.prompt();
    return;
  }
  try {
    console.log(jsdom_eval(code));

    rl.setPrompt(level1_prompt);
  } catch (exc) {
    console.log(exc.stack);
  }
  code = '';
  rl.prompt();
}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});
