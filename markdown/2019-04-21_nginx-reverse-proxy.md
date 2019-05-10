---
date: 2019-04-25
title: Nginx Reverse Proxy setup
summary: A simple guide to setup nginx as a reverse proxy to serve multiple
  sites from a single server
tags: 
  - nginx
  - fedora
---

In computer networks, a reverse proxy is a type of proxy server that retrieves resources
on behalf of a client from one or more servers. These resources are then returned to the
client, appearing as if they originated from the proxy server itself.[^first].
For this example, assume that we want to run two domains **abc.com** and **xyz.com** on the
same host. All examples have been tested on **Fedora 29**.

#### Setup Nginx

First install nginx on the server

```perl
  dnf install nginx
  
  # After installation start the service and enable it on boot
  systemctl start nginx
  systemctl enable nginx
  
  # Check the status
  systemctl status nginx
```

Nginx config files should be placed in this directory, ideally with a separate .conf file
for each **server_name** (hostname) in Nginx. 

```bash
  /etc/nginx/conf.d/
```

A sample .conf file is shown below for the two domains

```perl
  server {
    listen 80;
    listen [::]:80;
    
    server_name www.abc.com;
    
    location / {
      proxy_pass http://localhost:5000/;
    }
  }
  
  server {
    listen 80;
    listen [::]:80;
    
    server_name www.xyz.com;
    
    location / {
      proxy_pass http://localhost:6000/;
    }
  }  
```

To test this configuration and load it run the following commands

```bash
  nginx -t
  nginx -s reload
```

#### Setup http-server (optional)

To run the two servers mentioned above on port **5000** and **6000**, we can start a simple
**node** server. Feel free to use any other language/server that you are familiar with.

For node, create two directories **test5000** and **test6000** and run these commands

```perl
  # All commands to be run in both directories unless specified

  # First initialize the directories with npm
  npm init -y
  
  # Once that is done, install the http-server npm package
  npm install --save-dev http-server
  
  # Create a simple html file
  echo "Test Site" > index.html
  
  # Run server on Port 5000 in test5000
  node node_modules/http-server/bin/http-server -p 5000
  
  # Run server on Port 6000 in test6000
  node node_modules/http-server/bin/http-server -p 6000
```

#### Testing the setup

The testing setup assumes that A and CNAME records have been maintained for the two sites. Due
to the nginx config we should test opening the following two sites. (**Replace with your own 
site**)

  * http://www.abc.com
  * http://www.xyz.com

If the above do not work and you get a Permission denied page, then run this

```perl
  # For enabling server forward
  setsebool -P httpd_can_network_connect 1
  
  # For enabling static site
  chcon -Rt httpd_sys_content_t /path/to/static/site
```

#### Setup Let's Encrypt (optional)

This is an optional step that is highly recommended to enable https. It assumes that
you already have Let's Encrypt set up with basic config in place. The commands below
are used to setup certbot with nginx. Running the commands below will overwrite the
*.conf file that was placed in **/etc/nginx/conf.d/**

```perl
  dnf install certbot-nginx
  
  # To run certbot
  certbot --nginx
```

#### References
[^first]: ["Forward and reverse proxies".](http://httpd.apache.org/docs/current/mod/mod_proxy.html) The Apache Software Foundation.
