---
date: 2019-06-04
title: Project Euler 94
summary: Problem 94
tags: 
  - euler
---

```js
  let x = {}

  function c(z) {
    let a = z.toString().split('')
    let t = 0
    for (let s = 0; s < a.length; ++s) t += Math.pow(parseInt(a[s], 10), 2)
    return t
  }

  for (let y = 1; y < 568; ++y) {
    let z = y
    while (z !== 1 && z !== 89) z = c(z)
    if (z === 89) x[y] = 1
  }

  let t = 0
  for (let f = 0; f <10000000; ++f) {
    if (x[c(f)]) ++t
  }

  console.log(t)
```

Tweetable version

```js
  let x={};function c(z){let a=z.toString().split('');let t=0;
  for(let s=0;s<a.length;++s)t+=Math.pow(parseInt(a[s],10),2);return t}
  for(let y=1;y<568;++y){let z=y;while(z!==1 && z!==89)z=c(z);if(z===89)x[y]=1}
  let t=0;for(let f=0;f<10000000;++f){if(x[c(f)])++t}console.log(t)
```
