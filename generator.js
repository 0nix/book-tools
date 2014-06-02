'use strict';
const countdown = function* (count) {
    while (count > 0) {
      yield count;
      count -= 1;
    }
  };
const counter = countdown(5);
  
const callback = function(){
    let item = counter.next();
    if (!item.done) {
      console.log(item.value);
      setTimeout(callback, 1000);
    }
  };
callback();