---
date: 2019-10-03
title: Regex vs Split in JavaScript to extract text
summary: I recently had a problem where I wanted to extract the sub-domain from a URL. 
  I wanted to check how long it would take using both approaches
tags: 
  - benchmark
  - javascript
---

The problem can be described as follows, given a URL of the form shown below

```bash
  https://textToExtract.fromDomain.com/someurl/somenumber
```

To extract the text using split